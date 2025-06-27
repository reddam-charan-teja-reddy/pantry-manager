import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PantryItem } from '@/lib/types';

export type InputMethod = 'qr' | 'history' | 'manual';
export type Step = 'select' | 'input' | 'validate';

interface AddItemsState {
  step: Step;
  method: InputMethod | null;
  candidateItems: PantryItem[];
}

const initialState: AddItemsState = {
  step: 'select',
  method: null,
  candidateItems: [],
};

const addItemsSlice = createSlice({
  name: 'addItems',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<Step>) => {
      state.step = action.payload;
    },
    setMethod: (state, action: PayloadAction<InputMethod | null>) => {
      state.method = action.payload;
    },
    setCandidateItems: (state, action: PayloadAction<PantryItem[]>) => {
      state.candidateItems = action.payload;
    },
    updateCandidateItem: (
      state,
      action: PayloadAction<{
        id: string;
        field: keyof PantryItem;
        value: string | number | boolean | undefined;
      }>
    ) => {
      const { id, field, value } = action.payload;
      const itemIndex = state.candidateItems.findIndex(
        (item) => item.id === id
      );
      if (itemIndex !== -1) {
        state.candidateItems[itemIndex] = {
          ...state.candidateItems[itemIndex],
          [field]: value,
        };
      }
    },
    removeCandidateItem: (state, action: PayloadAction<string>) => {
      state.candidateItems = state.candidateItems.filter(
        (item) => item.id !== action.payload
      );
    },
    addCandidateItem: (state) => {
      const newItem: PantryItem = {
        id: `new-${Date.now()}`,
        name: '',
        quantity: 1,
        unit: 'units',
        expiryDate: new Date().toISOString(),
        category: 'General',
      };
      state.candidateItems.push(newItem);
    },
    resetAddItems: (state) => {
      state.step = 'select';
      state.method = null;
      state.candidateItems = [];
    },
  },
});

export const {
  setStep,
  setMethod,
  setCandidateItems,
  updateCandidateItem,
  removeCandidateItem,
  addCandidateItem,
  resetAddItems,
} = addItemsSlice.actions;

export default addItemsSlice.reducer;
