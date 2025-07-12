import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/hooks/db';
import User from '@/models/users';

// GET handler to get user profile
export async function GET(req: NextRequest) {
  // Ensure database connection is established per request
  await dbConnect();
  console.log('Database connection established for GET /api/profile');
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by firebaseUid
    const user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return profile data
    // Convert Mongoose Map for categoryThresholds to plain object
    const thresholds: Record<string, number> = {};
    if (
      user.categoryThresholds &&
      typeof user.categoryThresholds.forEach === 'function'
    ) {
      // Mongoose Map supports forEach
      user.categoryThresholds.forEach((value: number, key: string) => {
        thresholds[key] = value;
      });
    }
    return NextResponse.json({
      success: true,
      profile: {
        displayName: user.displayName || user.name || '',
        region: user.region || '',
        dietaryPreferences: user.dietaryPreferences || [],
        notificationSettings: {
          expiryAlerts: user.notificationSettings?.expiryAlerts ?? true,
          weeklyReminders: user.notificationSettings?.weeklyReminders ?? false,
        },
        categoryThresholds: thresholds,
        privacyConsent: user.privacyConsent || false,
      },
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

// PUT handler to update user profile
export async function PUT(req: NextRequest) {
  try {
    const { userId, profileData } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by firebaseUid
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
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

    // No need to remove undefined fields since we only added defined ones

    // Update user document
    await User.updateOne({ _id: user._id }, { $set: updatedFields });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
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
