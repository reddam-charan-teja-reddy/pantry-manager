'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<NextUIProvider>
					{children}
					<Toaster position='top-center' />
				</NextUIProvider>
			</PersistGate>
		</Provider>
	);
}
