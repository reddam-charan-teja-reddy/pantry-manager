import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';
import { PantryItem } from '@/lib/types';

export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    const { userId, item } = await req.json();

    if (!userId || !item || !item.id) {
      return NextResponse.json(
        { error: 'User ID and item data are required' },
        { status: 400 }
      );
    }

    // Find user document
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

    // Find pantry subdocument by id
    const subItem = user.pantry.id(item.id);
    if (!subItem) {
      return NextResponse.json(
        { error: 'Item not found in pantry' },
        { status: 404 }
      );
    }

    // Update fields
    subItem.itemName = item.name;
    subItem.quantity = item.quantity;
    subItem.unit = item.unit;
    subItem.notes = item.notes || subItem.notes;
    // Parse expiry date
    if (item.expiryDate) {
      const d = new Date(item.expiryDate);
      subItem.expirationDate = isNaN(d.getTime()) ? subItem.expirationDate : d;
    }

    await user.save();

    // Prepare updated item for response
    const updated: PantryItem = {
      id: subItem._id.toString(),
      name: subItem.itemName,
      quantity: subItem.quantity,
      unit: subItem.unit as PantryItem['unit'],
      expiryDate: subItem.expirationDate
        ? new Date(subItem.expirationDate).toISOString()
        : new Date().toISOString(),
      category: subItem.category,
      notes: subItem.notes,
    };

    return NextResponse.json({ success: true, updatedItem: updated });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
