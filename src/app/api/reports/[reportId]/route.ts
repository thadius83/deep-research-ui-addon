import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await context.params;
  const reportIdWithExt = reportId.endsWith('.md') ? reportId : `${reportId}.md`;
  
  try {
    const response = await fetch(`${request.nextUrl.origin}/generated_reports/${reportIdWithExt}`);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to retrieve report' },
        { status: 404 }
      );
    }
    
    const report = await response.text();
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
