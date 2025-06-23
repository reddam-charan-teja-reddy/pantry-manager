import connectDb from '@/hooks/db';
import User from '@/models/users';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	try {
		await connectDb();
		const { name, email, photoURL } = await req.json();

		// Check if user already exists
		let user = await User.findOne({ email });

		if (!user) {
			user = await User.create({ name, email, photoURL });
		}

		if (!user) {
			return NextResponse.json(
				{ error: 'Failed to create user' },
				{ status: 400 }
			);
		}

		return NextResponse.json({ user });
	} catch (error) {
		console.error('Error creating user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	try {
		await connectDb();
		const searchParams = new URL(req.url).searchParams;
		const userId = searchParams.get('userId');
		if (!userId) {
			return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
		}
		const user = await User.findById(userId);
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}
		return NextResponse.json({ user });
	} catch (error) {
		console.error('Error fetching user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
