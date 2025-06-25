import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ShoppingListItem } from '@/lib/types';
import { mockShoppingList } from '@/lib/mock';

const initialState: ShoppingListItem[] = [];

const shoppingListSlice = createSlice({
  name: 'shoppingList',
  initialState,
  reducers: {
    setShoppingList: (state, action: PayloadAction<ShoppingListItem[]>) => {
      return action.payload;
    },
    addToShoppingList: (state, action: PayloadAction<ShoppingListItem>) => {
      state.push(action.payload);
    },
    updateShoppingListItem: (
      state,
      action: PayloadAction<ShoppingListItem>
    ) => {
      const index = state.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    removeFromShoppingList: (state, action: PayloadAction<string>) => {
      return state.filter((item) => item.id !== action.payload);
    },
  },
});

export const {
  setShoppingList,
  addToShoppingList,
  updateShoppingListItem,
  removeFromShoppingList,
} = shoppingListSlice.actions;

export default shoppingListSlice.reducer;
