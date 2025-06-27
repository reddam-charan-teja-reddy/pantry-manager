import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from '@/hooks/storage';
import userInfoSlice from '@/store/userInfoSlice';
import pantryReducer from '@/store/pantrySlice';
import recipesReducer from '@/store/recipesSlice';
import shoppingListReducer from '@/store/shoppingListSlice';
import notificationsReducer from '@/store/notificationsSlice';
import profileReducer from '@/store/profileSlice';
import addItemsReducer from '@/store/addItemsSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'user',
    'pantry',
    'recipes',
    'shoppingList',
    'notifications',
    'profile',
    'addItems',
  ], // persist these reducers
};

const rootReducer = combineReducers({
  user: userInfoSlice,
  pantry: pantryReducer,
  recipes: recipesReducer,
  shoppingList: shoppingListReducer,
  notifications: notificationsReducer,
  profile: profileReducer,
  addItems: addItemsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
