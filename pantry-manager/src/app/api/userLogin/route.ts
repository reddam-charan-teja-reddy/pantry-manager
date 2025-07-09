import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { name, email, photoURL, uid } = await req.json();

    // Check if user already exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with Firebase UID stored and default profile settings
      user = await User.create({
        name,
        email,
        photoURL,
        firebaseUid: uid, // Store the Firebase UID
        displayName: name, // Initialize displayName from name
        region: '', // Empty default region
        dietaryPreferences: [], // Empty dietary preferences
        notificationSettings: {
          expiryAlerts: true, // Default to true
          weeklyReminders: false, // Default to false
        },
        categoryThresholds: {}, // Empty category thresholds
        privacyConsent: false, // Default to false
        pantry: [], // Empty pantry
      });
    } else {
      // Update the Firebase UID if it changed or wasn't set
      if (uid && (!user.firebaseUid || user.firebaseUid !== uid)) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Always extract and include profile data in the response
    const profileData = {
      displayName: user.displayName || user.name || '',
      region: user.region || '',
      dietaryPreferences: user.dietaryPreferences || [],
      notificationSettings: {
        expiryAlerts: user.notificationSettings?.expiryAlerts ?? true,
        weeklyReminders: user.notificationSettings?.weeklyReminders ?? false,
      },
      categoryThresholds: user.categoryThresholds || {},
      privacyConsent: user.privacyConsent || false,
    };

    return NextResponse.json({
      user,
      profile: profileData,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const searchParams = new URL(req.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Try multiple lookup strategies
    let user;

    try {
      // Try MongoDB ObjectId first
      user = await User.findById(userId);
    } catch (error) {
      // Not a valid ObjectId, which is fine
      console.log('ID lookup failed, trying alternative methods');
    }

    // If not found by ID, try Firebase UID
    if (!user) {
      user = await User.findOne({ firebaseUid: userId });
    }

    // If still not found, try email
    if (!user) {
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: `No user found with identifier: ${userId}`,
        },
        { status: 404 }
      );
    }

    // Include both MongoDB ID and Firebase UID in the response
    const userData = user.toObject ? user.toObject() : { ...user };

    // Extract profile data
    const profileData = {
      displayName: userData.displayName || userData.name || '',
      region: userData.region || '',
      dietaryPreferences: userData.dietaryPreferences || [],
      notificationSettings: {
        expiryAlerts: userData.notificationSettings?.expiryAlerts ?? true,
        weeklyReminders:
          userData.notificationSettings?.weeklyReminders ?? false,
      },
      categoryThresholds: userData.categoryThresholds || {},
      privacyConsent: userData.privacyConsent || false,
    };

    const responseUser = {
      ...userData,
      _id: userData._id.toString(),
      mongoId: userData._id.toString(), // Explicit MongoDB ID
      profile: profileData, // Include profile data
    };

    return NextResponse.json({
      user: responseUser,
      profile: profileData, // Also return profile separately for easier access
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
