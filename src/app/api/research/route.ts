import { deepResearch, writeFinalReport } from '@/lib/deep-research';
import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { query, reportFileName, queryFileName, breadth, depth, followUpQuestions, answers } = await req.json();

    if (!reportFileName || !queryFileName) {
      return NextResponse.json(
        { error: 'Missing reportFileName or queryFileName. Please initialize the report first.' },
        { status: 400 }
      );
    }

    // Combine query with follow-up Q&A using combinedQuery
    const combinedQuery = `Initial Query: ${query}\nFollow-up Questions and Answers: ${followUpQuestions
      .map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`)
      .join('\n')}`;

    console.log("[route.ts] Starting deep research with query:", combinedQuery);
    let report = "";

    if ( process.env.DEBUG_REPORTS !== 'true' ) {
      // Perform research
      const { learnings, visitedUrls } = await deepResearch({
        query: combinedQuery,
        breadth,
        depth,
      });

      console.log("[route.ts] Deep research completed. Writing final report...");

      // Generate report using combinedQuery for both 'query' and 'prompt'
      console.log("[route.ts] Generating final report with combinedQuery as both query and prompt.");
      report = await writeFinalReport({
        query: combinedQuery,
        prompt: combinedQuery,
        learnings,
        visitedUrls,
      });

      console.log("[route.ts] Final report generated.");
    } else {
      report = "This is a test";
    }
    
    // Save the report to a markdown file
    const reportPath = path.join(process.cwd(), 'generated_reports', reportFileName);
    const queryPath = path.join(process.cwd(), 'generated_reports', queryFileName);
    
    // Save the report and update the query file
    await writeFile(reportPath, report);
    await writeFile(queryPath, combinedQuery);

    console.log(`[route.ts] Report and query saved to ${reportPath} and ${queryPath}`);

    // Create the URLs for accessing both files
    const reportUrl = `/generated_reports/${reportFileName}`;
    const queryUrl = `/generated_reports/${queryFileName}`;

    return NextResponse.json({ 
      reportId: reportFileName.replace('.md', ''),
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
