'use client';

const HomePage = () => {
	return (
		<div className='flex flex-col items-center justify-center h-screen'>
			<h1 className='text-4xl font-bold mb-4'>Welcome to Pantry Manager</h1>
			<p className='text-lg mb-8'>Your personal pantry management system.</p>
			<a
				href='/auth'
				className='px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300'
			>
				Get Started
			</a>
		</div>
	);
};

export default HomePage;
