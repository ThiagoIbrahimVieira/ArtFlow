import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

// Function to parse inline markdown (bold, italic, bold+italic, code, links)
const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  // Regex to match:
  // 1. `code`
  // 2. ***bold+italic*** or ___bold+italic___
  // 3. **bold** or __bold__
  // 4. *italic* or _italic_
  // 5. [link text](url)
  const pattern = /(`[^`]+`|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#181513] border border-[#3A332C] text-[#E5A93C] font-mono text-[11px] sm:text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold + Italic: ***text*** or ___text___
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      return (
        <strong key={index} className="font-bold italic text-[#FDF8F0]">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      // Recursively parse any nested italics inside bold
      return (
        <strong key={index} className="font-bold text-[#FDF8F0]">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-[#E2D5C3]">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D9B98D] underline underline-offset-2 hover:text-[#FDF8F0] transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Standard plain text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines to parse block elements
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code Block start / end: ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={`code-${i}`} className="my-2.5 overflow-hidden rounded-xl border border-[#3A332C] bg-[#141210]">
            {codeBlockLang && (
              <div className="bg-[#1C1815] px-3 py-1 text-[10px] font-mono uppercase text-[#A99D8E] border-b border-[#2E2823]">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-xs text-[#E5A93C] font-mono leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // 2. Empty line -> Spacing break
    if (!trimmed) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // 3. Horizontal Rule: --- or *** or ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-t border-[#3A332C]" />);
      continue;
    }

    // 4. Headings: #, ##, ###, ####
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-sm sm:text-base font-bold text-[#FDF8F0] tracking-tight mt-3 mb-1.5 border-b border-[#3A332C] pb-1"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-xs sm:text-sm font-bold text-[#D9B98D] tracking-tight mt-3 mb-1 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xs sm:text-sm font-semibold text-[#E5A93C] mt-2.5 mb-1 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-xs font-semibold text-[#E2D5C3] mt-2 mb-0.5"
        >
          {renderInlineMarkdown(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // 5. Blockquote: > text
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="pl-3 my-1.5 border-l-2 border-[#D9B98D] italic text-[#D8C7B5] bg-[#221E1B]/60 py-1 rounded-r-md text-xs leading-relaxed"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // 6. Bullet lists: * item, - item, + item
    const bulletMatch = trimmed.match(/^([*\-+])\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-0.5 text-xs sm:text-sm leading-relaxed text-[#F1E2CB]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9B98D] mt-2 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {renderInlineMarkdown(bulletMatch[2])}
          </div>
        </div>
      );
      continue;
    }

    // 7. Numbered lists: 1. item, 2. item
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-0.5 text-xs sm:text-sm leading-relaxed text-[#F1E2CB]">
          <span className="text-[#D9B98D] font-mono text-xs font-semibold select-none flex-shrink-0 min-w-[1rem]">
            {numberMatch[1]}.
          </span>
          <div className="flex-1 min-w-0">
            {renderInlineMarkdown(numberMatch[2])}
          </div>
        </div>
      );
      continue;
    }

    // 8. Normal paragraph with inline formatting
    elements.push(
      <p key={`p-${i}`} className="my-1 text-xs sm:text-sm leading-relaxed text-[#F1E2CB]">
        {renderInlineMarkdown(rawLine)}
      </p>
    );
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
};
