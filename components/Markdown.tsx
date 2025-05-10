"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Custom table parser function
function parseTableFromMarkdown(markdown: string): {
  tables: string[][];
  content: string;
} {
  const tables: string[][] = [];

  // Find table sections and extract them
  const tableRegex =
    /(\|[^\n]+\|\r?\n\|[\s:|-]+\|\r?\n(?:\|[^\n]+\|\r?\n)*)/g;
  const contentWithoutTables = markdown.replace(
    tableRegex,
    (match) => {
      const tableLines = match.trim().split("\n");
      const rows = tableLines.map((line) => {
        // Extract cells from each line
        const cells = line
          .trim()
          .split("|")
          .filter((cell) => cell) // Remove empty elements from start/end
          .map((cell) => cell.trim());
        return cells;
      });

      // Remove delimiter row (the ---|--- row)
      if (rows.length >= 2) {
        const headerRow = rows[0];
        const contentRows = rows.slice(2);
        tables.push([headerRow, ...contentRows]);
      }

      // Replace with placeholder to be processed later
      return `{{TABLE_PLACEHOLDER_${tables.length - 1}}}`;
    }
  );

  return { tables, content: contentWithoutTables };
}

// Custom Table component that doesn't rely on the problematic parser
function CustomTable({ data }: { data: string[][] }) {
  if (!data || data.length === 0) return null;

  const headers = data[0];
  const rows = data.slice(1);

  return (
    <div className="overflow-x-auto my-6 rounded-lg border border-border">
      <table className="w-full border-collapse table-auto">
        <thead className="bg-muted/80">
          <tr className="transition-colors hover:bg-muted/30">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr
              key={i}
              className="transition-colors hover:bg-muted/30"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm border-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Define components for markdown with proper TypeScript types
const MarkdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-2">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary hover:underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-6 border-border" />,
  code: ({ inline, className, children }) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-sm">
        {children}
      </code>
    ) : (
      <code className="block p-4 rounded bg-muted text-foreground font-mono text-sm overflow-x-auto">
        {children}
      </code>
    ),
  // Intentionally not defining table components here to avoid the bug
};

interface ClientMarkdownProps {
  content: string;
  className?: string;
}

export function ClientMarkdown({
  content,
  className,
}: ClientMarkdownProps) {
  const { processedContent, extractedTables } = useMemo(() => {
    if (typeof content !== "string" || !content) {
      console.warn(
        "ClientMarkdown: 'content' prop is not a valid string or is empty. Received:",
        content
      );
      return { processedContent: "", extractedTables: [] };
    }

    // Extract tables from content before passing to ReactMarkdown
    const { tables, content: contentWithoutTables } =
      parseTableFromMarkdown(content.trim());

    return {
      processedContent: contentWithoutTables,
      extractedTables: tables,
    };
  }, [content]);

  // Function to replace table placeholders with rendered tables
  const renderContent = useMemo(() => {
    if (!processedContent) return null;

    // Split by table placeholders
    const parts = processedContent.split(
      /{{TABLE_PLACEHOLDER_(\d+)}}/
    );

    return parts.map((part, index) => {
      // Even indexes are text content
      if (index % 2 === 0) {
        return part ? (
          <ReactMarkdown
            key={`content-${index}`}
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponents}
          >
            {part}
          </ReactMarkdown>
        ) : null;
      }
      // Odd indexes are table placeholders
      else {
        const tableIndex = parseInt(part, 10);
        return extractedTables[tableIndex] ? (
          <CustomTable
            key={`table-${tableIndex}`}
            data={extractedTables[tableIndex]}
          />
        ) : null;
      }
    });
  }, [processedContent, extractedTables]);

  return (
    <div
      className={cn(
        "prose prose-lg max-w-none dark:prose-invert",
        "prose-table:rounded-lg prose-table:overflow-hidden prose-table:border-border",
        "prose-td:border-0 prose-th:border-b",
        className
      )}
    >
      {renderContent}
    </div>
  );
}
