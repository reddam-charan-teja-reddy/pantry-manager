import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';
import { DbPantryItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let user;

    try {
      // Try to find by MongoDB ObjectId first
      user = await User.findById(userId);
    } catch (error) {
      console.log(
        'Looking up user by alternative methods since ID lookup failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      user = await User.findOne({ email: userId });

      // If that doesn't work either, try looking up by a field that might store the UID
      if (!user) {
        user = await User.findOne({ firebaseUid: userId });
      }
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

    // Prepare the pantry items for the frontend
    const pantryItems = user.pantry || [];

    // Just return the pantry items directly
    // Let the frontend handle the conversion in the convertDbToPantryItem function
    const serializedItems = JSON.parse(JSON.stringify(pantryItems));

    return NextResponse.json({
      success: true,
      pantryItems: serializedItems,
    });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
