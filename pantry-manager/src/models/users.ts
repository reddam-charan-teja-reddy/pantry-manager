import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: String,
    email: String,
    photoURL: String,
    firebaseUid: String, // Store the Firebase UID for easier lookup
    displayName: { type: String, default: '' },
    region: { type: String, default: '' },
    dietaryPreferences: { type: [String], default: [] },
    notificationSettings: {
      expiryAlerts: { type: Boolean, default: true },
      weeklyReminders: { type: Boolean, default: true },
    },
    categoryThresholds: { type: Map, of: Number, default: {} },
    privacyConsent: { type: Boolean, default: false },
    pantry: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'pcs' },
        expirationDate: { type: Date, default: null },
        category: { type: String, default: 'general' },
        notes: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
