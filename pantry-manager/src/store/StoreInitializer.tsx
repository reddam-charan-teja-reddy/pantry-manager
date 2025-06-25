import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setPantryItems } from '@/store/pantrySlice';
import { setRecipes } from '@/store/recipesSlice';
import { setShoppingList } from '@/store/shoppingListSlice';
import { setNotifications } from '@/store/notificationsSlice';
import { setAuthLoading, loginSuccess } from '@/store/authSlice';
import {
  mockPantryItems,
  mockRecipes,
  mockShoppingList,
  mockNotifications,
} from '@/lib/mock';

/**
 * This component initializes the Redux store with mock data
 * It should be rendered once near the root of the app
 */
export const StoreInitializer = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load mock data into store
    dispatch(setPantryItems(mockPantryItems));
    dispatch(setRecipes(mockRecipes));
    dispatch(setShoppingList(mockShoppingList));
    dispatch(setNotifications(mockNotifications));

    // Simulate checking auth status
    const timer = setTimeout(() => {
      // Add a mock user for testing
      dispatch(
        loginSuccess({
          uid: '1',
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: null,
        })
      );
      dispatch(setAuthLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [dispatch]);

  return null;
};
