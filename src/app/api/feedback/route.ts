import { generateFeedback } from '@/lib/feedback';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const questions = await generateFeedback({ query });
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 },
    );
  }
} 