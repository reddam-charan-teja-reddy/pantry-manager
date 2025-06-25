import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Recipe } from '@/lib/types';
import { mockRecipes } from '@/lib/mock';

const initialState: Recipe[] = [];

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setRecipes: (state, action: PayloadAction<Recipe[]>) => {
      return action.payload;
    },
    addRecipe: (state, action: PayloadAction<Recipe>) => {
      state.push(action.payload);
    },
    updateRecipe: (state, action: PayloadAction<Recipe>) => {
      const index = state.findIndex(
        (recipe) => recipe.id === action.payload.id
      );
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    removeRecipe: (state, action: PayloadAction<string>) => {
      return state.filter((recipe) => recipe.id !== action.payload);
    },
  },
});

export const { setRecipes, addRecipe, updateRecipe, removeRecipe } =
  recipesSlice.actions;
export default recipesSlice.reducer;
