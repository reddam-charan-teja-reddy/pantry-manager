import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface userData {
  authState: boolean;
  authLoading: boolean;
  userDetails: {
    uid: string;
    name: string;
    email: string;
    photoURL: string;
  };
}

const userInfo: userData = {
  authState: false,
  authLoading: false,
  userDetails: {
    uid: '',
    name: '',
    email: '',
    photoURL: '',
  },
};

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState: userInfo,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        uid: string;
        displayName: string;
        email: string;
        photoURL: string;
      }>
    ) => {
      state.authState = true;
      state.authLoading = false;
      state.userDetails = {
        uid: action.payload.uid,
        name: action.payload.displayName,
        email: action.payload.email,
        photoURL: action.payload.photoURL,
      };
    },
    logout: (state) => {
      state.authState = false;
      state.authLoading = false;
      state.userDetails = {
        uid: '',
        name: '',
        email: '',
        photoURL: '',
      };
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.authLoading = action.payload;
    },
    setAuthState: (state, action: PayloadAction<boolean>) => {
      state.authState = action.payload;
    },
    setUserDetails: (
      state,
      action: PayloadAction<{
        uid: string;
        name: string;
        email: string;
        photoURL: string;
      }>
    ) => {
      state.userDetails = action.payload;
    },
  },
});

export const {
  loginSuccess,
  logout,
  setAuthLoading,
  setAuthState,
  setUserDetails,
} = userInfoSlice.actions;

export default userInfoSlice.reducer;
