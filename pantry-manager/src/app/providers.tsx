'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { HeroUIProvider } from '@heroui/react';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<HeroUIProvider>
					{children}
					<Toaster position='top-center' />
				</HeroUIProvider>
			</PersistGate>
		</Provider>
	);
}
