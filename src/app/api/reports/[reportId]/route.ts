import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const reportPath = path.join(
      process.cwd(),
      'generated_reports',
      // Ensure we're looking for a markdown file
      params.reportId.endsWith('.md') ? params.reportId : `${params.reportId}.md`
    );
    
    const report = await readFile(reportPath, 'utf-8');
    
    return new NextResponse(report, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `inline; filename="${path.basename(reportPath)}"`,
      },
    });
  } catch (error) {
    console.error('[reports/route.ts] Error reading report:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 404 }
    );
  }
}
