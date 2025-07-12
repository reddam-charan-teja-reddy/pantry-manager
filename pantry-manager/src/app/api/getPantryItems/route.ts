import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';
import { DbPantryItem } from '@/lib/types';

// Common logic for fetching pantry items by userId
async function fetchItemsByUserId(userId: string | null) {
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  let user;
  try {
    user = await User.findById(userId);
  } catch {
    user =
      (await User.findOne({ email: userId })) ||
      (await User.findOne({ firebaseUid: userId }));
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
  const pantryItems = user.pantry || [];
  const serializedItems = JSON.parse(JSON.stringify(pantryItems));
  return NextResponse.json({ success: true, pantryItems: serializedItems });
}

// Handle GET (fallback to URL searchParams)
export async function GET(req: NextRequest) {
  await connectDb();
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  return fetchItemsByUserId(userId);
}

// Handle POST (expect JSON body but fallback on parse failure)
export async function POST(req: NextRequest) {
  await connectDb();
  let userId: string | null = null;
  try {
    // Check content type and parse JSON body if applicable
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      userId = body.userId || null;
    }
  } catch {
    // ignore JSON parse errors
  }

  // If userId is not found in body, try query params (fallback)
  if (!userId) {
    const searchParams = req.nextUrl.searchParams;
    userId = searchParams.get('userId');
  }

  return fetchItemsByUserId(userId);
}
