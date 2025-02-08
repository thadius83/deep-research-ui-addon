import { Terminal } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Markdown } from '@/components/Markdown';

// @ts-ignore - Ignore Next.js page props type checking
export default async function ReportPage({ params }: any) {
  // Move the fetch logic to a separate function
  async function getReport(id: string) {
    try {
      const res = await fetch(`/api/reports/${id}`, { 
        cache: 'no-store',
        method: 'GET',
      });
      
      if (!res.ok) return null;
      return res.json();
    } catch (error) {
      console.error('Failed to fetch report:', error);
      return null;
    }
  }

  // Get the report data
  const data = await getReport(params.id);
  
  // Show loading state if no data
  if (!data?.report) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Terminal className="w-8 h-8 text-green-500 animate-pulse" />
      </div>
    );
  }

  // Show the report
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-black border-green-500 p-8 rounded-lg shadow-lg">
        <Markdown content={data.report} />
      </Card>
    </main>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'; 