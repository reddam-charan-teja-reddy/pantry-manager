import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { userId, items } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Transform items to match MongoDB schema
    const pantryItems = items.map((item) => {
      // Safely parse the expiry date
      let expirationDate = null;
      if (item.expiryDate) {
        try {
          expirationDate = new Date(item.expiryDate);
          // Check if the date is valid
          if (isNaN(expirationDate.getTime())) {
            expirationDate = null;
          }
        } catch (e) {
          console.error(`Invalid date format: ${item.expiryDate}`, e);
          expirationDate = null;
        }
      }

      return {
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expirationDate,
        category: item.category,
        notes: item.notes || '',
        addedAt: new Date(),
      };
    });

    // First find the user to get their current pantry
    let user;

    try {
      // Try to find by MongoDB ObjectId first
      user = await User.findById(userId);
    } catch (error) {
      // If that fails, try to find by email or other fields
      // This handles cases where userId might not be a valid ObjectId
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
          message: `No user found with identifier: ${userId}. Make sure the user exists in the database.`,
        },
        { status: 404 }
      );
    }

    // Process each item - either update an existing one or add a new one
    const updatedPantryItems = [];
    const updatedItemsMap = new Map(); // To track which items were updated
    let updateCount = 0;
    let insertCount = 0;

    // Go through each new item
    for (const newItem of pantryItems) {
      // Check if a similar item already exists in the pantry
      const existingItemIndex = user.pantry.findIndex(
        (item: { itemName: string; unit: string; category: string }) =>
          item.itemName.toLowerCase() === newItem.itemName.toLowerCase() &&
          item.unit === newItem.unit &&
          item.category === newItem.category
      );

      if (existingItemIndex !== -1) {
        // Item exists - increment the quantity
        user.pantry[existingItemIndex].quantity += newItem.quantity;

        // If new item has notes and existing doesn't, or new notes are more detailed
        if (
          (newItem.notes && !user.pantry[existingItemIndex].notes) ||
          (newItem.notes &&
            user.pantry[existingItemIndex].notes &&
            newItem.notes.length > user.pantry[existingItemIndex].notes.length)
        ) {
          user.pantry[existingItemIndex].notes = newItem.notes;
        }

        // Update expiration date if the new one is later than the existing one
        if (
          newItem.expirationDate &&
          user.pantry[existingItemIndex].expirationDate
        ) {
          const existingDate = new Date(
            user.pantry[existingItemIndex].expirationDate
          );
          const newDate = new Date(newItem.expirationDate);

          if (
            !isNaN(newDate.getTime()) &&
            !isNaN(existingDate.getTime()) &&
            newDate > existingDate
          ) {
            user.pantry[existingItemIndex].expirationDate =
              newItem.expirationDate;
          }
        }

        updatedItemsMap.set(existingItemIndex, true);
        updateCount++;
      } else {
        // New item - add it to the pantry
        updatedPantryItems.push(newItem);
        insertCount++;
      }
    }

    // Update the user document with both the updated and new items
    if (updatedPantryItems.length > 0) {
      user.pantry.push(...updatedPantryItems);
    }

    try {
      // Save the updated user
      await user.save();

      // Get the updated user to return the latest pantry
      let updatedUser;
      try {
        updatedUser = await User.findById(userId);
      } catch (error) {
        // If findById fails, try the same alternative lookups we used earlier
        updatedUser =
          (await User.findOne({ email: userId })) ||
          (await User.findOne({ firebaseUid: userId }));
      }

      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user data');
      }

      // Serialize the pantry items for the response
      const serializedPantry = JSON.parse(JSON.stringify(updatedUser.pantry));

      return NextResponse.json({
        success: true,
        message: `${insertCount} items added and ${updateCount} items updated in your pantry.`,
        pantry: serializedPantry,
      });
    } catch (error) {
      console.error('Error saving pantry updates:', error);
      return NextResponse.json(
        {
          error: 'Failed to save pantry updates',
          message: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        },
        { status: 500 }
      );
    }

    // The return logic has been moved inside the try block above
  } catch (error) {
    console.error('Error adding items to pantry:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}
