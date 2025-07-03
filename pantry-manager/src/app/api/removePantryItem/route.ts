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

    // Find user by ID or alternate fields
    let user;
    try {
      user = await User.findById(userId);
    } catch {
      user =
        (await User.findOne({ firebaseUid: userId })) ||
        (await User.findOne({ email: userId }));
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove matching pantry item
    const originalCount = user.pantry.length;
    user.pantry = user.pantry.filter(
      (pi: DbPantryItem) => pi._id?.toString() !== itemId
    );
    if (user.pantry.length === originalCount) {
      return NextResponse.json(
        { error: 'Pantry item not found' },
        { status: 404 }
      );
    }

    // Save user
    await user.save();
    return NextResponse.json({ success: true, removedId: itemId });
  } catch (error) {
    console.error('Error removing pantry item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
