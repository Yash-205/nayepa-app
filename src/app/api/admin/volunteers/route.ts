import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Volunteer from '@/models/Volunteer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123456';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    // Ensure the user is a Coordinator
    if (decoded.role !== 'Coordinator') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch all volunteers and populate the associated User details (name, email)
    const volunteers = await Volunteer.find()
      .populate({
        path: 'userId',
        model: User,
        select: 'name email role createdAt',
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error('Admin Fetch Volunteers Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
