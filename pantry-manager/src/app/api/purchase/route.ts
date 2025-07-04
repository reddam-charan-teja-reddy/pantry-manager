import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDb from '@/hooks/db';
import Purchase from '@/models/purchase';

// Define the shape of a purchase document for type safety
type PurchaseDoc = {
  storeName: string;
  purchaseDate: Date;
  receiptNumber: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: Date;
  items: Array<{
    productId: Types.ObjectId;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    expirationDate: Date | null;
    category: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    // Validate presence of id
    if (!id) {
      return NextResponse.json(
        { error: 'Missing purchase id' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid purchase id' },
        { status: 400 }
      );
    }

    await connectDb();

    // Fetch the purchase document
    const purchase = (await Purchase.findById(id).lean()) as PurchaseDoc | null;
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Format dates and return required fields
    const formatted = {
      storeName: purchase.storeName,
      purchaseDate: purchase.purchaseDate.toISOString(),
      receiptNumber: purchase.receiptNumber,
      paymentMethod: purchase.paymentMethod,
      totalAmount: purchase.totalAmount,
      createdAt: purchase.createdAt.toISOString(),
      items: purchase.items.map((item) => ({
        productId: item.productId.toString(),
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        expirationDate: item.expirationDate
          ? item.expirationDate.toISOString()
          : null,
        category: item.category,
      })),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
