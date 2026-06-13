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
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Resolve onboarding status and sessions
    let onboardingComplete = false;
    let sessions: any[] = [];
    if (user.role === 'Volunteer') {
      const volunteer = await Volunteer.findOne({ userId: user._id }).lean();
      onboardingComplete = (volunteer as any)?.onboardingComplete ?? false;
      sessions = (volunteer as any)?.chatSessions || [];
    } else {
      onboardingComplete = true; // Coordinators skip onboarding
    }

    return NextResponse.json({ user, onboardingComplete, sessions });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
