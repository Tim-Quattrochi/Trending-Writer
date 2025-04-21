"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const MarkdownComponents = {
  h1: ({ node, ...props }: { node: any; [key: string]: any }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
  ),
  h2: ({ node, ...props }: { node: any; [key: string]: any }) => (
    <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />
  ),
  h3: ({ node, ...props }: { node: any; [key: string]: any }) => (
    <h3 className="text-xl font-bold mt-5 mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="my-4 leading-relaxed" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 my-4 space-y-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
  ),
  li: ({ node, ...props }) => <li className="pl-2" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-primary hover:underline font-medium"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/30 pl-4 italic my-4"
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table
        className="min-w-full divide-y divide-border rounded-md"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-muted" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="divide-y divide-border" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="transition-colors hover:bg-muted/50" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-foreground"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  hr: ({ node, ...props }) => (
    <hr className="my-6 border-border" {...props} />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-sm"
        {...props}
      />
    ) : (
      <code
        className="block p-4 rounded bg-muted text-foreground font-mono text-sm overflow-x-auto"
        {...props}
      />
    ),
};

interface ClientMarkdownProps {
  content: string;
  className?: string;
}

export function ClientMarkdown({
  content,
  className,
}: ClientMarkdownProps) {
  const markdownContent = useMemo(() => {
    if (!content) return "";
    return content;
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-lg max-w-none dark:prose-invert",
        className
      )}
    >
      <ReactMarkdown components={MarkdownComponents}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}
