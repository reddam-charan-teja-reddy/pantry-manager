import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
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

// Define a reset action
export const RESET_STORE = 'RESET_STORE';

export const resetStore = (): Action => ({
  type: RESET_STORE,
});

const appReducer = combineReducers({
  user: userInfoSlice,
  pantry: pantryReducer,
  recipes: recipesReducer,
  shoppingList: shoppingListReducer,
  notifications: notificationsReducer,
  profile: profileReducer,
  addItems: addItemsReducer,
});

// Root reducer with reset capability
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: Action
) => {
  // Reset all slices to initial state if the action is RESET_STORE
  if (action.type === RESET_STORE) {
    // Return undefined to let each reducer initialize with their default state
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

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
