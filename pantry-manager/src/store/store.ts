import { configureStore, combineReducers, AnyAction } from '@reduxjs/toolkit';
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
import authReducer from '@/store/authSlice';
import pantryReducer from '@/store/pantrySlice';
import recipesReducer from '@/store/recipesSlice';
import shoppingListReducer from '@/store/shoppingListSlice';
import notificationsReducer from '@/store/notificationsSlice';
import profileReducer from '@/store/profileSlice';

// Action type for resetting the entire store
export const RESET_STATE = 'RESET_STATE';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'user',
    'auth',
    'pantry',
    'recipes',
    'shoppingList',
    'notifications',
    'profile',
  ], // persist these reducers
};

const rootReducer = combineReducers({
  user: userInfoSlice,
  auth: authReducer,
  pantry: pantryReducer,
  recipes: recipesReducer,
  shoppingList: shoppingListReducer,
  notifications: notificationsReducer,
  profile: profileReducer,
});

// Root reducer with state reset capability
const appReducer = (
  state: ReturnType<typeof rootReducer> | undefined,
  action: AnyAction
) => {
  // When logout action is dispatched, reset all state (except keep auth.authLoading status)
  if (action.type === RESET_STATE) {
    // Persist the authLoading state
    const { authLoading } = state?.auth || { authLoading: true };

    // Clear the state (persisted and non-persisted)
    state = undefined;

    // Return a new state with auth.authLoading preserved
    return rootReducer(undefined, action);
  }
  return rootReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, appReducer);

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
