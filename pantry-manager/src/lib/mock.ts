import type { User, UserProfile, PantryItem, Recipe, ShoppingListItem, Notification } from './types';
import { subDays, addDays } from 'date-fns';

export const mockUser: User = {
  uid: '12345',
  email: 'user@example.com',
  displayName: 'Alex Doe',
  photoURL: 'https://placehold.co/100x100.png',
};

export const mockProfile: UserProfile = {
  displayName: 'Alex Doe',
  dietaryPreferences: ['Vegetarian'],
  notificationSettings: {
    expiryAlerts: true,
    weeklyReminders: false,
  },
  categoryThresholds: {
    Dairy: 2,
    Vegetables: 5,
  },
  privacyConsent: true,
  region: 'US-CA',
};

export const mockPantryItems: PantryItem[] = [
  { id: '1', name: 'Milk', quantity: 1, unit: 'l', expiryDate: addDays(new Date(), 3).toISOString(), category: 'Dairy', imageUrl: 'https://placehold.co/100x100.png' },
  { id: '2', name: 'Eggs', quantity: 8, unit: 'units', expiryDate: addDays(new Date(), 10).toISOString(), category: 'Dairy', imageUrl: 'https://placehold.co/100x100.png' },
  { id: '3', name: 'Bread', quantity: 1, unit: 'units', expiryDate: addDays(new Date(), 1).toISOString(), category: 'Bakery', imageUrl: 'https://placehold.co/100x100.png' },
  { id: '4', name: 'Chicken Breast', quantity: 500, unit: 'g', expiryDate: addDays(new Date(), 2).toISOString(), category: 'Meat', imageUrl: 'https://placehold.co/100x100.png' },
  { id: '5', name: 'Tomatoes', quantity: 4, unit: 'units', expiryDate: addDays(new Date(), 5).toISOString(), category: 'Vegetables', imageUrl: 'https://placehold.co/100x100.png' },
];

export const mockCandidateItems: PantryItem[] = [
    { id: '6', name: 'Avocado', quantity: 2, unit: 'units', expiryDate: addDays(new Date(), 4).toISOString(), category: 'Fruit' },
    { id: '7', name: 'Cheddar Cheese', quantity: 200, unit: 'g', expiryDate: addDays(new Date(), 20).toISOString(), category: 'Dairy' },
];


export const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    title: 'Simple Chicken Salad',
    description: 'A quick and healthy salad perfect for lunch.',
    imageUrl: 'https://placehold.co/600x400.png',
    data_ai_hint: 'chicken salad',
    ingredients: [
        { name: 'Chicken Breast', quantity: '200g' },
        { name: 'Tomatoes', quantity: '2' },
        { name: 'Lettuce', quantity: '1 head' },
        { name: 'Mayonnaise', quantity: '2 tbsp' },
    ],
    inPantry: ['Chicken Breast', 'Tomatoes'],
    missing: ['Lettuce', 'Mayonnaise'],
  },
  {
    id: 'r2',
    title: 'Classic Omelette',
    description: 'A fluffy and delicious omelette for any time of day.',
    imageUrl: 'https://placehold.co/600x400.png',
    data_ai_hint: 'fluffy omelette',
    ingredients: [
        { name: 'Eggs', quantity: '3' },
        { name: 'Milk', quantity: '50ml' },
        { name: 'Cheese', quantity: '30g' },
    ],
    inPantry: ['Eggs', 'Milk'],
    missing: ['Cheese'],
  },
];

export const mockShoppingList: ShoppingListItem[] = [
  { 
    id: 's1', 
    name: 'Lettuce', 
    quantity: 1, 
    unit: 'units', 
    purchased: false,
    category: 'Recipe Ingredients',
    estimatedPrice: 1.99,
    priority: 'medium',
    recipeId: 'r1',
    recipeName: 'Simple Chicken Salad'
  },
  { 
    id: 's2', 
    name: 'Mayonnaise', 
    quantity: 1, 
    unit: 'units', 
    purchased: false,
    category: 'Recipe Ingredients',
    estimatedPrice: 3.99,
    priority: 'low',
    recipeId: 'r1',
    recipeName: 'Simple Chicken Salad'
  },
  { 
    id: 's3', 
    name: 'Cheese', 
    quantity: 1, 
    unit: 'units', 
    purchased: true,
    category: 'Recipe Ingredients',
    estimatedPrice: 4.99,
    priority: 'low',
    recipeId: 'r2',
    recipeName: 'Classic Omelette'
  },
  { 
    id: 's4', 
    name: 'Apples', 
    quantity: 5, 
    unit: 'units', 
    purchased: false,
    category: 'Custom',
    estimatedPrice: 0.99,
    priority: 'low'
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'expiry', message: 'Your Bread is expiring tomorrow!', timestamp: subDays(new Date(), 0).toISOString(), read: false },
  { id: 'n2', type: 'expiry', message: 'Your Chicken Breast is expiring in 2 days.', timestamp: subDays(new Date(), 1).toISOString(), read: false },
  { id: 'n3', type: 'recommendation', message: 'You seem to be low on Milk. Add to shopping list?', timestamp: subDays(new Date(), 2).toISOString(), read: true },
];
