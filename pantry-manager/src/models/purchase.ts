import mongoose, { Schema } from 'mongoose';

const purchaseSchema = new Schema(
  {
    storeName: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    receiptNumber: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        unitCost: { type: Number, required: true },
        expirationDate: { type: Date, default: null },
        category: { type: String, required: true },
      },
    ],
  },
  { timestamps: false }
);

const Purchase =
  mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

export default Purchase;
