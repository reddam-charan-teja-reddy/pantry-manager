'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Auth from '@/components/Auth/Auth';
import { LogoIcon } from '@/components/LogoIcon';

export default function Home() {
  const router = useRouter();
  const { user, authLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <LogoIcon className='h-12 w-12 animate-spin text-primary' />
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
        <div className='w-full max-w-sm'>
          <div className='mb-8 flex justify-center'></div>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Welcome to Pantry Manager
            </h1>
            <p className='text-sm text-muted-foreground'>
              Sign in to manage your pantry
            </p>
          </div>
          <Auth />
          <p className='px-8 text-center text-sm text-muted-foreground mt-6'>
            By clicking continue, you agree to our{' '}
            <a
              href='#'
              className='underline underline-offset-4 hover:text-primary'>
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='#'
              className='underline underline-offset-4 hover:text-primary'>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  // This should never render as we redirect authenticated users to /dashboard
  return null;
}
