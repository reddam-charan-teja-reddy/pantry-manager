import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '@/lib/types';
import { mockProfile } from '@/lib/mock';

const initialState: UserProfile = mockProfile;

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      return { ...state, ...action.payload };
    },
    resetProfile: () => {
      return initialState;
    },
  },
});

export const { updateProfile, resetProfile } = profileSlice.actions;
export default profileSlice.reducer;
