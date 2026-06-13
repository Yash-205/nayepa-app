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

// Helper to authenticate request
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (err) {
    console.error('Profile auth verification error:', err);
    return null;
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let volunteer = null;
    if (user.role === 'Volunteer') {
      volunteer = await Volunteer.findOne({ userId: user._id }).lean();
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      volunteer,
    });
  } catch (error) {
    console.error('GET Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'Volunteer') {
      return NextResponse.json(
        { error: 'Only Volunteer profiles can be updated via this endpoint' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { phone, location, availability, skills } = body;

    // Build update object
    const updateFields: any = {};
    if (typeof phone === 'string') updateFields.phone = phone;
    if (typeof location === 'string') updateFields.location = location;
    if (typeof availability === 'number') updateFields.availability = availability;
    if (Array.isArray(skills)) updateFields.skills = skills;

    // Update or create Volunteer document
    const updatedVolunteer = await Volunteer.findOneAndUpdate(
      { userId: user._id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.error('PUT Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
