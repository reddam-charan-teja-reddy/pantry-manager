'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { Button } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const Auth = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const { user } = res;
      const { displayName, email, photoURL } = user;

      if (!displayName || !email || !photoURL) {
        throw new Error('Missing user details');
      }

      const response = await fetch('/api/userLogin', {
        method: 'POST',
        body: JSON.stringify({
          name: displayName,
          email,
          photoURL,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      dispatch(
        loginSuccess({
          uid: data.user._id || user.uid,
          displayName,
          email,
          photoURL,
        })
      );
      toast.success('Successfully signed in!');
    } catch (error) {
      setError('Failed to sign in with Google');
      toast.error('Failed to sign in with Google');
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);
      const { user } = res;
      if (!user.email) throw new Error('Missing user details');
      dispatch(
        loginSuccess({
          uid: user.uid,
          displayName: user.displayName || null,
          email: user.email,
          photoURL: user.photoURL || null,
        })
      );
      toast.success('Successfully signed in!');
      handleAuthSuccess();
    } catch (err) {
      setError('Failed to sign in with email');
      toast.error('Failed to sign in with email');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className='grid gap-6'>
      <form onSubmit={handleEmailSignIn}>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <label htmlFor='email' className='text-sm font-medium'>
              Email
            </label>
            <input
              id='email'
              placeholder='name@example.com'
              type='email'
              className='border rounded px-3 py-2 disabled:opacity-50'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <div className='grid gap-2'>
            <label htmlFor='password' className='text-sm font-medium'>
              Password
            </label>
            <input
              id='password'
              placeholder='••••••••'
              type='password'
              className='border rounded px-3 py-2 disabled:opacity-50'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <Button disabled={isLoading || isGoogleLoading} type='submit'>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sign In with Email
          </Button>
        </div>
      </form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-muted-foreground'>
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant='ghost'
        color='primary'
        type='button'
        isLoading={isGoogleLoading}
        startContent={<FcGoogle />}
        onPress={handleGoogleSignIn}>
        Google
      </Button>
    </div>
  );
};
export default Auth;
