'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { HeroUIProvider } from '@heroui/react';
import { Analytics } from '@vercel/analytics/next';

// Loading component shown during persistence rehydration
const PersistenceLoading = () => (
  <div className='flex min-h-screen items-center justify-center'>
    <div className='animate-pulse text-center'>
      <p className='text-sm text-muted-foreground'>Loading your account...</p>
    </div>
  </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<PersistenceLoading />} persistor={persistor}>
        <HeroUIProvider>
          {children}
          <Analytics />
          <Toaster position='top-center' />
        </HeroUIProvider>
      </PersistGate>
    </Provider>
  );
}
