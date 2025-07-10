import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/hooks/db';
import User from '@/models/users';

// Connect to database
try {
  dbConnect();
  // Log successful database connection to monitor API initialization
  console.log('Database connection successful in profile-update route');
} catch (error) {
  console.error(
    'Failed to connect to database in profile-update route:',
    error
  );
}

// POST handler to update user profile
export async function POST(req: NextRequest) {
  try {
    // Log when a profile update request is received
    console.log('Received profile update request in profile-update route');
    const { userId, profileData } = await req.json();
    // Log the data structure to verify proper receipt of client data
    console.log('Update data received in profile-update:', {
      userId,
      profileData,
    });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by firebaseUid or _id
    // Log the user ID we're searching for in the database
    console.log('Looking for user with ID:', userId);
    let user;
    try {
      // Try with firebaseUid
      user = await User.findOne({ firebaseUid: userId });

      // If not found, try with _id directly
      if (!user) {
        // Log fallback to _id lookup when firebaseUid lookup fails
        console.log('User not found by firebaseUid, trying with _id');
        user = await User.findById(userId);
      }

      // Log whether a user was found by either method
      console.log('User found?', !!user);
    } catch (err) {
      console.error('Error finding user:', err);
    }

    if (!user) {
      // Log when a user cannot be found with the provided ID
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

    // Log the fields that will be updated in the database
    console.log('Updating user with fields:', updatedFields);
    // Log the MongoDB document _id being updated
    console.log('User _id:', user._id);

    try {
      // Update user document
      const result = await User.updateOne(
        { _id: user._id },
        { $set: updatedFields }
      );
      // Log the MongoDB update operation result object
      console.log('Update result:', result);

      // Verify the update was successful
      if (result.acknowledged && result.modifiedCount > 0) {
        // Log when document update succeeds
        console.log('User document was successfully updated');
      } else {
        // Log when operation is acknowledged but no changes were made
        // This can happen if the submitted data matches what's already in the database
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
