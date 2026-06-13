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

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    if (decoded.role !== 'Coordinator') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    await dbConnect();

    const volunteers = await Volunteer.find()
      .populate({ path: 'userId', model: User, select: 'name email createdAt' })
      .sort({ createdAt: -1 })
      .lean();

    // ── Build CSV buffer ──────────────────────────────────────────────────────
    const headers = ['Name', 'Email', 'Location', 'Availability (hrs/week)', 'Skills', 'Domain', 'Onboarding Complete', 'Registered At'];

    const escape = (val: unknown) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = volunteers.map((v: any) => [
      escape(v.userId?.name ?? 'N/A'),
      escape(v.userId?.email ?? 'N/A'),
      escape(v.location),
      escape(v.availability),
      escape((v.skills ?? []).join(', ')),
      escape(v.targetDomain),
      escape(v.onboardingComplete ? 'Yes' : 'No'),
      escape(v.userId?.createdAt ? new Date(v.userId.createdAt).toLocaleDateString('en-IN') : 'N/A'),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nayepankh_volunteers_${timestamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Admin CSV Export Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
