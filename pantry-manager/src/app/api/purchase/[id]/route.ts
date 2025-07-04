import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDb from '@/hooks/db';
import Purchase from '@/models/purchase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
  }
  await connectDb();
  // Fetch and type the purchase document
  const purchase = (await Purchase.findById(id).lean()) as {
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
  } | null;
  if (!purchase) {
    return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
  }
  // Format dates and return only required fields
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
}
