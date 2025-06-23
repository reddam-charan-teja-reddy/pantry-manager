'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthState, setUserDetails } from '../../store/userInfoSlice';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const Auth = () => {
	const router = useRouter();
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const userData = useSelector((state: RootState) => state.user);
	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
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

			dispatch(setAuthState(true));
			dispatch(
				setUserDetails({
					uid: data.user._id,
					name: displayName,
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
			setLoading(false);
		}
	};
	return (
		<div>
			<div className={styles.authContainer}>
				<h1 className={styles.authTitle}>Welcome to Pantry Manager</h1>
				<p className={styles.authSubtitle}>
					Sign in to manage your pantry efficiently
				</p>
				<button
					className={styles.googleButton}
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					{loading ? (
						'Signing in...'
					) : (
						<span className={styles.googleIcon}>
							<FcGoogle />
						</span>
					)}
					Sign in with Google
				</button>
				{error && <p className={styles.errorMessage}>{error}</p>}
			</div>
		</div>
	);
};
export default Auth;
