import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/lib/types';
import { mockNotifications } from '@/lib/mock';

const initialState: Notification[] = [];

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      return action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.push(action.payload);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      return state.filter((n) => n.id !== action.payload);
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationRead,
  removeNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
