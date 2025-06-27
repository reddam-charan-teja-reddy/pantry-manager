import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PantryItem, DbPantryItem } from '@/lib/types';

interface PantryState {
  items: PantryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: PantryState = {
  items: [],
  loading: false,
  error: null,
};

// Convert database pantry item to frontend pantry item
export const convertDbToPantryItem = (dbItem: DbPantryItem): PantryItem => {
  // Handle various date formats that might come from MongoDB
  let expiryDateIso: string;

  if (!dbItem.expirationDate) {
    // If no expiration date, use current date
    expiryDateIso = new Date().toISOString();
  } else {
    try {
      // Try to convert the date - it could be a string, Date object, or ISODate from MongoDB
      const dateObj =
        typeof dbItem.expirationDate === 'string'
          ? new Date(dbItem.expirationDate)
          : dbItem.expirationDate;

      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        expiryDateIso = dateObj.toISOString();
      } else {
        // Fallback if we can't parse the date
        expiryDateIso = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      expiryDateIso = new Date().toISOString();
    }
  }

  return {
    id: dbItem._id || `temp-${Date.now()}`,
    name: dbItem.itemName,
    quantity: dbItem.quantity,
    unit: dbItem.unit as 'units' | 'g' | 'kg' | 'ml' | 'l',
    expiryDate: expiryDateIso,
    category: dbItem.category,
    notes: dbItem.notes,
  };
};

// Async thunk for adding items to pantry
export const addItemsToPantry = createAsyncThunk(
  'pantry/addItemsToPantry',
  async (
    payload: { userId: string; items: PantryItem[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/addItems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: payload.userId,
          items: payload.items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to add items');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Failed to add items to pantry');
    }
  }
);

// Async thunk for fetching user's pantry items
export const fetchPantryItems = createAsyncThunk(
  'pantry/fetchPantryItems',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log(`Fetching pantry items for user: ${userId}`);
      const response = await fetch(`/api/getPantryItems?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.error || 'Failed to fetch pantry items'
        );
      }

      const data = await response.json();
      console.log('Pantry items fetched successfully:', data);
      return data; // Return the full data object to handle in the reducer
    } catch (error) {
      return rejectWithValue('Failed to fetch pantry items');
    }
  }
);

const pantrySlice = createSlice({
  name: 'pantry',
  initialState,
  reducers: {
    setPantryItems: (state, action: PayloadAction<PantryItem[]>) => {
      // Create a new state object with the items updated
      // This avoids the Immer error with direct assignment
      return {
        ...state,
        items: action.payload,
      };
    },
    addPantryItem: (state, action: PayloadAction<PantryItem>) => {
      state.items.push(action.payload);
    },
    updatePantryItem: (state, action: PayloadAction<PantryItem>) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removePantryItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    // Helper reducer to reset loading state in case of issues
    resetLoadingState: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle addItemsToPantry
      .addCase(addItemsToPantry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemsToPantry.fulfilled, (state, action) => {
        state.loading = false;
        // Update state with new pantry items from the response if needed
        if (action.payload.pantry) {
          state.items = action.payload.pantry.map(convertDbToPantryItem);
        }
      })
      .addCase(addItemsToPantry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Handle fetchPantryItems
      .addCase(fetchPantryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPantryItems.fulfilled, (state, action) => {
        state.loading = false;
        // Check if action.payload has pantryItems property (from API response)
        const items = action.payload?.pantryItems || action.payload || [];
        state.items = items.map(convertDbToPantryItem);
      })
      .addCase(fetchPantryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPantryItems,
  addPantryItem,
  updatePantryItem,
  removePantryItem,
  resetLoadingState,
} = pantrySlice.actions;
export default pantrySlice.reducer;
