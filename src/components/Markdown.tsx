'use client';

import ReactMarkdown from 'react-markdown';
import { Link, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Markdown({ content }: { content: string }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopySection = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => {
            const id = typeof children === 'string' ? children : '';
            return (
              <div className="flex items-center justify-between gap-4 group">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-200 dark:border-indigo-800 pb-2" {...props}>
                  {children}
                </h1>
                <Button
                  onClick={() => handleCopySection(id, id)}
                  variant="outline"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 border-indigo-500 text-indigo-500 hover:bg-indigo-500/10"
                >
                  {copiedSection === id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            );
          },
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mt-8 mb-4">
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center gap-1"
            >
              {children}
              <Link className="w-3 h-3 shrink-0" />
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-none space-y-2 text-indigo-300 mb-4">
              {children}
            </ul>
          ),
          li: ({ children }) => {
            // Extract the actual text content from children
            const getTextContent = (children: React.ReactNode): string => {
              if (typeof children === 'string') {
                return children;
              }
              if (Array.isArray(children)) {
                return children.map(getTextContent).join('');
              }
              if (children && typeof children === 'object' && 'props' in children) {
                const element = children as React.ReactElement<{ children?: React.ReactNode }>;
                return getTextContent(element.props.children);
              }
              return '';
            };

            const content = getTextContent(children);
            const isUrl = content.trim().startsWith('http');
            
            return (
              <li className="text-indigo-600 break-all">
                {isUrl ? (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-2 hover:text-indigo-400 group"
                  >
                    <span className="shrink-0 mt-1">•</span>
                    <span className="underline-offset-4 group-hover:underline">{content}</span>
                    <Link className="w-3 h-3 shrink-0 mt-1" />
                  </a>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">•</span>
                    <span>{content}</span>
                  </div>
                )}
              </li>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 