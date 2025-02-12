import { NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

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
    
    // Generate filenames
    const reportFileName = `${timestamp}-${reportId}.md`;
    const queryFileName = `${timestamp}-${reportId}.query.md`;
    const reportPath = path.join(process.cwd(), 'generated_reports', reportFileName);
    const queryPath = path.join(process.cwd(), 'generated_reports', queryFileName);
    
    // Create stub files with initial content
    await writeFile(reportPath, '# Research in Progress\n\nYour report is being generated. Please check back in a few minutes...');
    await writeFile(queryPath, query || 'Query processing...');

    // Create the URLs for accessing both files
    const reportUrl = `/generated_reports/${reportFileName}`;
    const queryUrl = `/generated_reports/${queryFileName}`;

    return NextResponse.json({ 
      reportId,
      timestamp,
      reportUrl,
      queryUrl,
      reportFileName,
      queryFileName
    });
  } catch (error) {
    console.error('[research/init/route.ts] Error initializing report:', error);
    return NextResponse.json(
      { error: 'Failed to initialize report' },
      { status: 500 }
    );
  }
}
