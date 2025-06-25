import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/lib/types';
import { RESET_STATE } from './store';

interface AuthState {
  user: User | null;
  authLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  authLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.authLoading = false;
    },
    logout: (state) => {
      state.user = null;
      // We'll handle complete state reset in the AppLayout
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.authLoading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
