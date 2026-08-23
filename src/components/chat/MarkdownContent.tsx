import React from 'react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: string[] = [];

  const flushTable = (key: number) => {
    if (inTable && (tableHeader.length > 0 || tableRows.length > 0)) {
      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-none border border-mono-200">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeader.length > 0 && (
              <thead className="bg-mono-200/60 text-mono-900 font-semibold border-b border-mono-200">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="py-2 px-3">
                      {formatInlineText(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-mono-200 bg-mono-50/50">
              {tableRows.map((row, rIndex) => (
                <tr key={rIndex} className="hover:bg-mono-200/30 transition-colors">
                  {row.map((cell, cIndex) => (
                    <td key={cIndex} className="py-2 px-3 text-mono-800 font-mono">
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  const flushList = (key: number) => {
    if (inList && listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${key}`} className="my-2 space-y-1.5 text-sm text-mono-800 list-disc list-inside">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="my-2 space-y-1.5 text-sm text-mono-800 list-decimal list-inside">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {formatInlineText(item)}
              </li>
            ))}
          </ol>
        );
      }
      inList = false;
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(i);
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if it's separator line like | :--- | :--- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        // Just a delimiter
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable(i);
    }

    // Unordered list (* or -)
    if (/^[\*\-]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        flushList(i);
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[\*\-]\s+/, ''));
      continue;
    }

    // Ordered list (1. 2.)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList(i);
        inList = true;
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Not a list line
    flushList(i);

    if (!trimmed) {
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-mono-900 mt-3 mb-1.5 tracking-tight flex items-center gap-1.5">
          {formatInlineText(trimmed.substring(4))}
        </h3>
      );
      continue;
    }

    // Heading 4
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-mono-900 mt-2.5 mb-1 tracking-tight">
          {formatInlineText(trimmed.substring(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          className="my-2.5 border-l-2 border-mono-400 pl-3 py-1.5 text-xs text-mono-700 bg-mono-200/30 rounded-r-md"
        >
          {formatInlineText(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="my-1.5 text-sm text-mono-800 leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
  }

  flushTable(lines.length);
  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Парсер встроенных стилей: **жирный**, *курсив*, `код/числа`
 */
function formatInlineText(text: string): React.ReactNode {
  if (!text) return '';

  // Разбиваем по токенам: `code`, **bold**, *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining) {
    // Check for inline code `...`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyIdx++}
          className="font-mono text-[11px] bg-mono-200/70 text-mono-900 px-1.5 py-0.5 rounded border border-mono-300/40"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(codeMatch[0].length);
      continue;
    }

    // Check for bold **...**
    const boldMatch = remaining.match(/^\*\*([^\*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-mono-900">
          {formatInlineText(boldMatch[1])}
        </strong>
      );
      remaining = remaining.substring(boldMatch[0].length);
      continue;
    }

    // Check for italic *...*
    const italicMatch = remaining.match(/^\*([^\*]+)\*/);
    if (italicMatch) {
      parts.push(
        <em key={keyIdx++} className="italic text-mono-700">
          {formatInlineText(italicMatch[1])}
        </em>
      );
      remaining = remaining.substring(italicMatch[0].length);
      continue;
    }

    // Plain text until next special character
    const nextSpecial = remaining.search(/[`\*]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special char that didn't match pairs, consume single character
      parts.push(remaining[0]);
      remaining = remaining.substring(1);
    } else {
      parts.push(remaining.substring(0, nextSpecial));
      remaining = remaining.substring(nextSpecial);
    }
  }

  return <>{parts}</>;
}
