import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/hooks/db';
import User from '@/models/users';

// Connect to database
try {
  dbConnect();
  console.log('Database connection successful in profile/update route');
} catch (error) {
  console.error(
    'Failed to connect to database in profile/update route:',
    error
  );
}

// POST handler to update user profile (Using POST as an alternative to PUT)
export async function POST(req: NextRequest) {
  try {
    console.log('Received profile update request');
    const { userId, profileData } = await req.json();
    console.log('Update data received:', { userId, profileData });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by firebaseUid or _id
    console.log('Looking for user with ID:', userId);
    let user;
    try {
      // Try with firebaseUid
      user = await User.findOne({ firebaseUid: userId });

      // If not found, try with _id directly
      if (!user) {
        console.log('User not found by firebaseUid, trying with _id');
        user = await User.findById(userId);
      }

      console.log('User found?', !!user);
    } catch (err) {
      console.error('Error finding user:', err);
    }

    if (!user) {
      console.log('User not found with ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user profile
    interface ProfileUpdateFields {
      displayName?: string;
      region?: string;
      dietaryPreferences?: string[];
      notificationSettings?: {
        expiryAlerts?: boolean;
        weeklyReminders?: boolean;
      };
      categoryThresholds?: Record<string, number>;
      privacyConsent?: boolean;
    }

    const updatedFields: ProfileUpdateFields = {};

    // Only add fields that are provided
    if (profileData.displayName !== undefined)
      updatedFields.displayName = profileData.displayName;
    if (profileData.region !== undefined)
      updatedFields.region = profileData.region;
    if (profileData.dietaryPreferences !== undefined)
      updatedFields.dietaryPreferences = profileData.dietaryPreferences;
    if (profileData.notificationSettings !== undefined)
      updatedFields.notificationSettings = profileData.notificationSettings;
    if (profileData.categoryThresholds !== undefined)
      updatedFields.categoryThresholds = profileData.categoryThresholds;
    if (profileData.privacyConsent !== undefined)
      updatedFields.privacyConsent = profileData.privacyConsent;

    console.log('Updating user with fields:', updatedFields);
    console.log('User _id:', user._id);

    try {
      // Update user document
      const result = await User.updateOne(
        { _id: user._id },
        { $set: updatedFields }
      );
      console.log('Update result:', result);

      // Verify the update was successful
      if (result.acknowledged && result.modifiedCount > 0) {
        console.log('User document was successfully updated');
      } else {
        console.log('Update operation acknowledged but no documents modified');
      }

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (updateError) {
      console.error('Error during update operation:', updateError);
      const errorMessage =
        updateError instanceof Error ? updateError.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Database update failed', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
