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
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    await dbConnect();

    const [totalVolunteers, onboardedVolunteers, allVolunteers, totalUsers] = await Promise.all([
      Volunteer.countDocuments(),
      Volunteer.countDocuments({ onboardingComplete: true }),
      Volunteer.find().select('skills location availability').lean(),
      User.countDocuments({ role: 'Volunteer' }),
    ]);

    // Aggregate unique skills across all volunteers
    const skillSet = new Set<string>();
    let totalAvailabilityHours = 0;
    const locationCounts: Record<string, number> = {};

    for (const v of allVolunteers as any[]) {
      for (const skill of (v.skills ?? [])) {
        if (skill) skillSet.add(skill);
      }
      if (v.availability) totalAvailabilityHours += Number(v.availability);
      if (v.location) {
        const loc = v.location.trim();
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    }

    // Top 3 locations
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      totalVolunteers,
      onboardedVolunteers,
      pendingOnboarding: totalUsers - onboardedVolunteers,
      uniqueSkills: skillSet.size,
      totalAvailabilityHours,
      topLocations,
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
