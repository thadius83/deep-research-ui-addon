import { Terminal } from 'lucide-react';
import { ResearchForm } from '@/components/ResearchForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Research AI
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Using AI to enhance your search experience.
          </p>
        </div>
        <ResearchForm />
      </div>
    </main>
  );
} 