import { deepResearch, writeFinalReport } from '@/lib/deep-research';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';

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
    
    // Create timestamp prefix in format YYYY-MM-DD-HH-mm
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/[\/:]/g, '-').replace(',', '').replace(' ', '-');
    
    // Save the report to a markdown file
    const reportFileName = `${timestamp}-${reportId}.md`;
    const reportPath = path.join(process.cwd(), 'generated_reports', reportFileName);
    
    // Save the raw markdown content directly
    await writeFile(reportPath, report);

    // Save the query to a separate markdown file
    const queryFileName = `${timestamp}-${reportId}.query.md`;
    const queryPath = path.join(process.cwd(), 'generated_reports', queryFileName);
    await writeFile(queryPath, combinedQuery);

    console.log(`[route.ts] Report and query saved to ${reportPath} and ${queryPath}`);

    // Create the URLs for accessing both files
    const reportUrl = `/generated_reports/${reportFileName}`;
    const queryUrl = `/generated_reports/${queryFileName}`;

    return NextResponse.json({ 
      reportId, 
      report, 
      reportUrl,
      query: combinedQuery,
      queryUrl
    });
  } catch (error) {
    console.error('[route.ts] Error performing research:', error);
    return NextResponse.json(
      { error: 'Failed to perform research' },
      { status: 500 }
    );
  }
}
