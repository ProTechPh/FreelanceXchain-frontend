'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Ensures collapsed single-line lists and tables (often emitted by LLMs) are converted
 * into proper markdown block elements with line breaks.
 */
function preprocessMarkdown(text: string): string {
  if (!text) return '';
  let res = text.replace(/\r\n/g, '\n');

  // Fix collapsed single-line lists
  res = res.replace(/([.:])\s+(\d+\.\s+(?:\*\*|[A-Z]))/g, '$1\n\n$2');
  res = res.replace(/([.:])\s+([•\-\*]\s+)/g, '$1\n\n$2');

  // Fix collapsed table rows: "| a | b | |---|---| | c | d |" or "|| c | d |"
  res = res.replace(/\|\s*\|\s*/g, '|\n|');

  // Ensure table starting line has a blank line before it if preceded by normal text
  const lines = res.split('\n');
  const output: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i]!;
    const inlineTableMatch = current.match(/^([^|\n]+?)\s*(\|[^\n]+\|.*)$/);
    if (inlineTableMatch && !/^\s*[-*#]/.test(inlineTableMatch[1]!)) {
      output.push(inlineTableMatch[1]!.trim());
      output.push('');
      output.push(inlineTableMatch[2]!.trim());
      continue;
    }

    const prev = output[output.length - 1];
    const isTableLine = /^\s*\|.*\|\s*$/.test(current);
    const prevIsTableLine = prev !== undefined && /^\s*\|.*\|\s*$/.test(prev);
    const prevIsBlank = !prev || prev.trim() === '';

    if (isTableLine && !prevIsTableLine && !prevIsBlank) {
      output.push('');
    }
    output.push(current);
  }

  return output.join('\n');
}

export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;

  const processedContent = preprocessMarkdown(content);

  return (
    <div
      className={cn(
        'min-w-0 max-w-full text-sm leading-relaxed text-muted-foreground space-y-3 break-words',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-foreground mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-foreground mt-3 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-2 my-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-2 max-w-full overflow-x-auto rounded-lg bg-muted/70 p-3 text-xs">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 w-full max-w-full overflow-x-auto rounded-lg border border-border bg-card/40">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70 text-foreground border-b border-border font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/60">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-2 font-medium text-foreground border-r border-border/50 last:border-r-0 sm:px-3">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-2 text-foreground/90 border-r border-border/40 last:border-r-0 align-top sm:px-3">
              {children}
            </td>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName && codeClassName.includes('language-');
            if (isBlock) {
              return (
                <code className="block font-mono text-xs whitespace-pre text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all text-foreground">
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
