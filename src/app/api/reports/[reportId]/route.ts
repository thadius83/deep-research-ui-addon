import { type NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await context.params;
  const reportIdWithExt = reportId.endsWith('.md') ? reportId : `${reportId}.md`;
  
  try {
    const reportPath = path.join(process.cwd(), 'generated_reports', reportIdWithExt);
    const report = await readFile(reportPath, 'utf-8');
    
    return new NextResponse(report, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `inline; filename="${reportIdWithExt}"`,
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
