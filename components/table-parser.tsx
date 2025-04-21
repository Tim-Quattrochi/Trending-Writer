"use client";

import { useMemo } from "react";

interface TableParserProps {
  content: string;
}

export function TableParser({ content }: TableParserProps) {
  const tableData = useMemo(() => {
    const tableMatch = content.match(
      /\|(.+\|)+\n\|([\s-]+\|)+\n(\|(.+\|)+\n)+/g
    );

    if (!tableMatch) return null;

    const tableContent = tableMatch[0];
    const rows = tableContent.trim().split("\n");

    // Extract headers
    const headers = rows[0]
      .split("|")
      .filter((cell) => cell.trim() !== "")
      .map((cell) => cell.trim());

    const dataRows = rows.slice(2).map((row) =>
      row
        .split("|")
        .filter((cell) => cell.trim() !== "")
        .map((cell) => cell.trim())
    );

    return { headers, dataRows };
  }, [content]);

  if (!tableData) return null;

  return (
    <div className="my-8 overflow-x-auto">
      <table className="min-w-full border border-border rounded-md">
        <thead className="bg-muted">
          <tr>
            {tableData.headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tableData.dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm">
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
