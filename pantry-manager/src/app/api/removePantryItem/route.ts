import connectDb from '@/hooks/db';
import User from '@/models/users';
import { DbPantryItem } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    await connectDb();
    const { userId, itemId } = await req.json();
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing userId or itemId' },
        { status: 400 }
      );
    }

    // Find user by ID or alternate fields to check if user exists
    let query;
    try {
      // First try to find by MongoDB _id
      if (await User.findById(userId)) {
        query = { _id: userId };
      } else {
        // Otherwise try firebaseUid or email
        query = { $or: [{ firebaseUid: userId }, { email: userId }] };
      }
    } catch {
      // If error in parsing ObjectId, use alternative fields
      query = { $or: [{ firebaseUid: userId }, { email: userId }] };
    }

    // Use MongoDB's atomic $pull operation to remove the item in a single operation
    const result = await User.updateOne(query, {
      $pull: { pantry: { _id: itemId } },
    });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Pantry item not found or already removed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, removedId: itemId });
  } catch (error) {
    console.error('Error removing pantry item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
