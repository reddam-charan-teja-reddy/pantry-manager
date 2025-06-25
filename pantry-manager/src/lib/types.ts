// This file contains shared TypeScript types used throughout the application.

// User & Profile
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  displayName: string;
  dietaryPreferences: string[];
  notificationSettings: {
    expiryAlerts: boolean;
    weeklyReminders: boolean;
  };
  categoryThresholds: Record<string, number>;
  privacyConsent: boolean;
  region: string;
}

// Pantry
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'units' | 'g' | 'kg' | 'ml' | 'l';
  expiryDate: string; // ISO 8601 string
  category: string;
  imageUrl?: string;
}

// Recipes
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ingredients: { name: string; quantity: string }[];
  inPantry: string[];
  missing: string[];
  data_ai_hint?: string;
}

// Shopping List
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'units' | 'g' | 'kg' | 'ml' | 'l';
  purchased: boolean;
}

// Notifications
export interface Notification {
  id: string;
  type: 'expiry' | 'reminder' | 'recommendation';
  message: string;
  timestamp: string; // ISO 8601 string
  read: boolean;
}
