import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PantryItem } from '@/lib/types';
import { mockPantryItems } from '@/lib/mock';

const initialState: PantryItem[] = [];

const pantrySlice = createSlice({
  name: 'pantry',
  initialState,
  reducers: {
    setPantryItems: (state, action: PayloadAction<PantryItem[]>) => {
      return action.payload;
    },
    addPantryItem: (state, action: PayloadAction<PantryItem>) => {
      state.push(action.payload);
    },
    updatePantryItem: (state, action: PayloadAction<PantryItem>) => {
      const index = state.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    removePantryItem: (state, action: PayloadAction<string>) => {
      return state.filter((item) => item.id !== action.payload);
    },
  },
});

export const {
  setPantryItems,
  addPantryItem,
  updatePantryItem,
  removePantryItem,
} = pantrySlice.actions;
export default pantrySlice.reducer;
