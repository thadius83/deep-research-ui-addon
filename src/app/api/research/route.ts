import { deepResearch, writeFinalReport } from '@/lib/deep-research';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { query, breadth, depth, followUpQuestions, answers } = await req.json();

    // Combine query with follow-up Q&A using combinedQuery
    const combinedQuery = `Initial Query: ${query}\nFollow-up Questions and Answers: ${followUpQuestions
      .map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`)
      .join('\n')}`;

    console.log("[route.ts] Combined Query:", combinedQuery);

    // Perform research
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth,
      depth,
    });

    console.log("[route.ts] Deep research returned learnings:", learnings);
    console.log("[route.ts] Deep research returned visitedUrls:", visitedUrls);

    // Generate report using combinedQuery for both 'query' and 'prompt'
    console.log("[route.ts] Generating final report with combinedQuery as both query and prompt.");
    const report = await writeFinalReport({
      query: combinedQuery,
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    console.log("[route.ts] Final report generated.");

    // Generate a unique ID for the report
    const reportId = crypto.randomBytes(16).toString('hex');

    return NextResponse.json({ reportId, report });
  } catch (error) {
    console.error('[route.ts] Error performing research:', error);
    return NextResponse.json(
      { error: 'Failed to perform research' },
      { status: 500 }
    );
  }
}

