import { deepResearch, writeFinalReport } from '@/lib/deep-research';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { query, breadth, depth, followUpQuestions, answers } = await req.json();

    // Combine query with follow-up Q&A
    const combinedQuery = `
Initial Query: ${query}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

    // Perform research
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth,
      depth,
    });

    // Generate report
    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    // Generate unique ID for the report
    const reportId = crypto.randomBytes(16).toString('hex');


    return NextResponse.json({ reportId, report });
  } catch (error) {
    console.error('Error performing research:', error);
    return NextResponse.json(
      { error: 'Failed to perform research' },
      { status: 500 },
    );
  }
} 