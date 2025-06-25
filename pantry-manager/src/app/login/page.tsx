import Auth from '@/components/Auth/Auth';
export default function login() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
			<div className='w-full max-w-sm'>
				<div className='mb-8 flex justify-center'></div>
				<div className='text-center mb-6'>
					<h1 className='text-2xl font-bold tracking-tight text-foreground'>
						Welcome back
					</h1>
					<p className='text-sm text-muted-foreground'>
						Sign in to manage your pantry
					</p>
				</div>
				<Auth />
				<p className='px-8 text-center text-sm text-muted-foreground mt-6'>
					By clicking continue, you agree to our{' '}
					<a href='#' className='underline underline-offset-4 hover:text-primary'>
						Terms of Service
					</a>{' '}
					and{' '}
					<a href='#' className='underline underline-offset-4 hover:text-primary'>
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	);
}
