import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { HumanMessage } from '@langchain/core/messages';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Volunteer from '@/models/Volunteer';
import { MongoCheckpointer } from '@/lib/agents/saver';
import { createOnboardingGraph } from '@/lib/agents/graph';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123456';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
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

    // 2. Fetch/create Volunteer profile
    await dbConnect();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    let volunteer = await Volunteer.findOne({ userId: user._id });
    if (!volunteer) {
      volunteer = await Volunteer.create({
        userId: user._id,
        phone: '',
        location: '',
        availability: 0,
        skills: [],
        screeningNotes: '',
        targetDomain: 'General',
        chatHistory: [],
        chatSessions: [],
        onboardingComplete: false,
      });
    }

    // 3. Read request body
    const body = await req.json();
    const { message, sessionId } = body;
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Guard: ensure chatSessions exists for legacy documents created before schema update
    if (!volunteer.chatSessions) {
      (volunteer as any).chatSessions = [];
    }

    // Determine active session or create a new one
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      volunteer.chatSessions.push({
        sessionId: activeSessionId,
        title: 'Session ' + (volunteer.chatSessions.length + 1)
      });
      await volunteer.save();
    } else {
      // Ensure the session exists in user's sessions list
      const sessionExists = volunteer.chatSessions.some((s: any) => s.sessionId === activeSessionId);
      if (!sessionExists) {
        volunteer.chatSessions.push({
          sessionId: activeSessionId,
          title: 'Session ' + (volunteer.chatSessions.length + 1)
        });
        await volunteer.save();
      }
    }

    // 4. Initialize LangGraph checkpointer and graph
    const checkpointer = new MongoCheckpointer();
    const graph = createOnboardingGraph(checkpointer);

    const threadId = activeSessionId;
    const config = {
      configurable: {
        thread_id: threadId,
      },
    };

    // Get current state to determine if this is the first message or a continuation
    const graphState = await graph.getState(config);
    const hasHistory = graphState.values && Object.keys(graphState.values).length > 0;

    // 5. Invoke LangGraph StateGraph
    // Always pass volunteerId so saveProfileNode can write to DB on any turn
    const input: any = {
      messages: [new HumanMessage({ content: message })],
      volunteerId: volunteer._id.toString(),
    };

    // On a brand new thread also supply the existing onboarding state
    if (!hasHistory) {
      input.onboardingComplete = volunteer.onboardingComplete || false;
    }

    const output = await graph.invoke(input, config);

    // 6. Extract the latest AI assistant message
    const outMessages = output.messages;
    const lastMsg = outMessages[outMessages.length - 1];
    const aiResponseText = lastMsg.content as string;

    // Remove the trailing JSON block from the user-facing text if onboarding completed
    let userFacingText = aiResponseText;
    const triggerIndex = aiResponseText.indexOf('[ONBOARDING_COMPLETE]');
    if (triggerIndex !== -1) {
      userFacingText = aiResponseText.substring(0, triggerIndex).trim();
    }

    // 7. Duplicate transaction logs in main Volunteer schema for dashboard query ease
    // Reload fields in case saveProfileNode ran to update MongoDB
    const updatedVolunteer = await Volunteer.findById(volunteer._id);
    if (updatedVolunteer) {
      updatedVolunteer.chatHistory.push({ sessionId: threadId, role: 'user', text: message });
      updatedVolunteer.chatHistory.push({ sessionId: threadId, role: 'model', text: userFacingText });
      await updatedVolunteer.save();
    }

    return NextResponse.json({
      response: userFacingText,
      onboardingComplete: output.onboardingComplete || false,
      sessionId: threadId,
      sessions: updatedVolunteer ? updatedVolunteer.chatSessions : volunteer.chatSessions,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const volunteer = await Volunteer.findOne({ userId: decoded.userId }).lean();
    if (!volunteer) {
      return NextResponse.json({ error: 'User is not a volunteer.' }, { status: 403 });
    }

    const history = (volunteer.chatHistory || []).filter((m: any) => m.sessionId === sessionId);
    
    return NextResponse.json({
      messages: history.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        text: m.text,
        ts: new Date(m.createdAt).getTime()
      }))
    });
  } catch (error: any) {
    console.error('Chat API GET Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

