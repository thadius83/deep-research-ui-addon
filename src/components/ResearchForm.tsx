'use client';

import { useState, useEffect } from 'react';
import { Terminal, Copy, Check, FileDown } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Markdown } from '@/components/Markdown';

type ResearchStatus = {
  stage:
    | 'idle'
    | 'collecting-feedback'
    | 'researching'
    | 'writing-report'
    | 'complete';
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
  currentTask?: string;
  error?: string | null;
};

export function ResearchForm() {
  
  const [query, setQuery] = useState('');
  const [breadth, setBreadth] = useState('2');
  const [depth, setDepth] = useState('4');
  const [status, setStatus] = useState<ResearchStatus>({ stage: 'idle' });
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  // Create a state to hold the html2pdf instance
  const [html2pdfInstance, setHtml2pdfInstance] = useState<any>(null);

  // Load html2pdf only on client side
  useEffect(() => {
    const loadHtml2Pdf = async () => {
      const html2pdfModule = await import('html2pdf.js');
      setHtml2pdfInstance(html2pdfModule.default);
    };
    loadHtml2Pdf();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update status to show generating questions
      setStatus({ 
        stage: 'collecting-feedback',
        message: 'Generating follow-up questions...' 
      });
      
      // Get follow-up questions
      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const questions = await feedbackRes.json();
      setFollowUpQuestions(questions);
      
      // Update status to show questions ready
      setStatus({ 
        stage: 'collecting-feedback',
        message: 'Please answer these questions to help focus your research.' 
      });
      
    } catch (error) {
      console.error('Error:', error);
      setStatus({ 
        stage: 'idle',
        message: 'An error occurred. Please try again.' 
      });
    }
  };

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [section]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [section]: false }));
    }, 2000);
  };

  const handleAnswerSubmit = async () => {
    try {
      setStatus({ 
        stage: 'researching',
        message: 'Research in progress...' 
      });

      const researchRes = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          breadth: parseInt(breadth),
          depth: parseInt(depth),
          followUpQuestions,
          answers,
        }),
      });

      const { report } = await researchRes.json();
      setReport(report);
      setStatus({ stage: 'complete' });
      
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        stage: 'idle',
        message: 'An error occurred. Please try again.',
      });
    }
  };

  const handleExportPDF = async () => {
    if (!html2pdfInstance) return;
    
    const reportContent = document.createElement('div');
    
    const formattedReport = report?.replace(/\n\n/g, '<br/><br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/<li>/g, '<ul><li>').replace(/<\/li>\n/g, '</li></ul>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    reportContent.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, sans-serif;
        padding: 40px;
        color: #1a1a1a;
        line-height: 1.6;
        font-size: 14px;
      ">
        <style>
          h1 {
            color: #047857;
            font-size: 24px;
            margin-bottom: 16px;
            font-weight: bold;
            border-bottom: 2px solid #047857;
            padding-bottom: 8px;
          }
          h2 {
            color: #047857;
            font-size: 20px;
            margin-top: 24px;
            margin-bottom: 12px;
            font-weight: bold;
          }
          h3 {
            color: #047857;
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          p {
            margin-bottom: 12px;
            text-align: justify;
          }
          ul {
            margin-bottom: 12px;
            padding-left: 20px;
          }
          li {
            margin-bottom: 6px;
          }
          a {
            color: #047857;
            text-decoration: none;
          }
          .sources {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 2px solid #047857;
          }
          .sources li {
            word-break: break-all;
            font-size: 12px;
            color: #404040;
          }
        </style>
        ${formattedReport}
      </div>
    `;

    const opt = {
      margin: [15, 15],
      filename: 'research-report.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
        precision: 16
      }
    };

    try {
      await html2pdfInstance().set(opt).from(reportContent).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleReset = () => {
    const isConfirmed = window.confirm(
      "Are you sure? This will clear the current research progress."
    )

    if (isConfirmed) {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 p-8 rounded-xl shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          
          <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">Your Question</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-indigo-500">
              What would you like to find out?
            </label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-500">
                Research Breadth (diversity of sources)
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[parseInt(breadth)]}
                  onValueChange={(value) => setBreadth(value[0].toString())}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  style={{
                    '--slider-track': 'rgb(199 210 254)',
                    '--slider-range': 'rgb(79 70 229)',
                    '--slider-thumb': 'rgb(79 70 229)',
                  } as React.CSSProperties}
                />
                <Input
                  type="number"
                  value={breadth}
                  onChange={(e) => {
                    const value = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                    setBreadth(value.toString());
                  }}
                  className="w-16 text-center bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-slate-100"
                  min={1}
                  max={5}
                />
              </div>
             
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-indigo-500">
                Research Depth (thoroughness of sources)
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[parseInt(depth)]}
                  onValueChange={(value) => setDepth(value[0].toString())}
                  min={3}
                  max={6}
                  step={1}
                  className="flex-1"
                  style={{
                    '--slider-track': 'rgb(199 210 254)',
                    '--slider-range': 'rgb(79 70 229)',
                    '--slider-thumb': 'rgb(79 70 229)',
                  } as React.CSSProperties}
                />
                <Input
                  type="number"
                  value={depth}
                  onChange={(e) => {
                    const value = Math.min(10, Math.max(3, parseInt(e.target.value) || 3));
                    setDepth(value.toString());
                  }}
                  className="w-16 text-center bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-slate-100"
                  min={3}
                  max={10}
                />
              </div>
              
            </div>
          </div>

          <Button 
            type="submit"
            disabled={!query || status.stage !== 'idle'}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
          >
            Start your Research
          </Button>
        </form>

        {status.message && (
          <div className="mt-6">
            {(status.stage === 'researching' || 
              (status.stage === 'collecting-feedback' && followUpQuestions.length === 0)) ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <CircularProgress />
                <p className="text-blue-500">{status.message}</p>
              </div>
            ) : (
              <>
                <p className="text-blue-500">{status.message}</p>
                {status.progress && (
                  <div className="mt-2">
                    <div className="h-2 bg-indigo-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                        style={{
                          width: `${(status.progress.current / status.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {report && (
        <Button
          variant="destructive"
          onClick={handleReset}
          className="mt-4 ml-4"
        >
          Reset Research
        </Button>
      )}
        {followUpQuestions.length > 0 && status.stage === 'collecting-feedback' && (
          <div className="mt-8 space-y-6 border-t border-indigo-900 pt-6">
            <h3 className="text-lg font-medium text-indigo-500">Additional Questions</h3>
            {followUpQuestions.map((question, index) => (
              <div key={index} className="space-y-2">
                <p className="text-indigo-500">{question}</p>
                <Input
                  value={answers[index] || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            ))}
            <Button
              onClick={handleAnswerSubmit}
              disabled={answers.length !== followUpQuestions.length}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
            >
             Continue your Research
            </Button>
          </div>
        )}
      </Card>

      {report && (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 p-8 rounded-xl shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">Your Final Report</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleCopy(report, 'full')}
                variant="outline"
                className="border-indigo-500 text-indigo-500 hover:bg-indigo-500/10"
              >
                {copyStatus['full'] ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copyStatus['full'] ? 'Copied!' : 'Copy Full Report'}</span>
              </Button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-indigo-500/20">
              <Markdown content={report} />
            </div>
          </div>

          {report.includes('## Sources') && (
            <div className="mt-8 pt-6 border-t border-indigo-900">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-medium text-indigo-500">List of Sources</h3>
                <Button
                  onClick={() => handleCopy(
                    report.split('## Sources')[1].trim(),
                    'sources'
                  )}
                  variant="outline"
                  size="sm"
                  className="border-indigo-500 text-indigo-500 hover:bg-indigo-500/10"
                >
                  {copyStatus['sources'] ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copyStatus['sources'] ? 'Copied!' : 'Copy Sources'}</span>
                </Button>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-indigo-500/20">
                <Markdown content={`## Sources${report.split('## Sources')[1]}`} />
              </div>
            </div>
          )}
        </Card>
      )}

    </div>
  );
} 
