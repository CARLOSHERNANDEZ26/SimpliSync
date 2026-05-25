import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin securely
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: unknown) {
    console.error('Firebase Admin Init Error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, newPassword } = body;

    if (!uid || !newPassword) {
      return NextResponse.json({ error: 'Missing UID or new password' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Forcefully update the user's password in Firebase Auth
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: unknown) {
    console.error('Password Reset Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}