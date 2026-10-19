import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: string;
  filePath?: string;
}

// Tokenize a single line into stylized syntax tokens
function tokenizeLine(line: string): React.ReactNode[] {
  // If line is empty
  if (line.length === 0) {
    return [<span key="empty">&nbsp;</span>];
  }

  // Comments (// or /* or *)
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return [
      <span key="comment" className="text-slate-500 italic">
        {line}
      </span>,
    ];
  }

  // Regex tokenizer for TypeScript / JS / TSX / JSON
  const tokenRegex =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:import|export|from|default|const|let|var|function|return|async|await|interface|type|class|extends|implements|try|catch|finally|throw|if|else|switch|case|new|typeof|instanceof|void|as|true|false|null|undefined)\b)|(\b(?:NextRequest|NextResponse|React|FC|Promise|Record|string|number|boolean|any|unknown|never|Array|Date|Error)\b)|(<\/?[a-zA-Z0-9_]+|[/>])|(\b\d+(?:\.\d+)?\b)|(\/\/.*$)|([{}()[\].,;:?!=<>+\-*/%&|^~])/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    // Plain text before token
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`} className="text-slate-300">
          {line.substring(lastIndex, match.index)}
        </span>
      );
    }

    const [
      token,
      strLiteral,
      keyword,
      builtinType,
      jsxTag,
      numLiteral,
      comment,
      punctuation,
    ] = match;

    const key = `tok-${match.index}`;

    if (strLiteral) {
      elements.push(
        <span key={key} className="text-emerald-400 font-mono">
          {token}
        </span>
      );
    } else if (keyword) {
      elements.push(
        <span key={key} className="text-purple-400 font-semibold font-mono">
          {token}
        </span>
      );
    } else if (builtinType) {
      elements.push(
        <span key={key} className="text-cyan-300 font-medium font-mono">
          {token}
        </span>
      );
    } else if (jsxTag) {
      elements.push(
        <span key={key} className="text-sky-400 font-semibold font-mono">
          {token}
        </span>
      );
    } else if (numLiteral) {
      elements.push(
        <span key={key} className="text-amber-300 font-mono">
          {token}
        </span>
      );
    } else if (comment) {
      elements.push(
        <span key={key} className="text-slate-500 italic font-mono">
          {token}
        </span>
      );
    } else if (punctuation) {
      elements.push(
        <span key={key} className="text-slate-400 font-mono">
          {token}
        </span>
      );
    } else {
      elements.push(
        <span key={key} className="text-slate-200 font-mono">
          {token}
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Trailing text
  if (lastIndex < line.length) {
    elements.push(
      <span key={`tail-${lastIndex}`} className="text-slate-300 font-mono">
        {line.substring(lastIndex)}
      </span>
    );
  }

  return elements.length > 0 ? elements : [<span key="fallback">{line}</span>];
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = 'none',
  filePath,
}) => {
  const [copied, setCopied] = useState(false);

  const lines = React.useMemo(() => {
    return code ? code.split('\n') : [];
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group flex flex-col w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 font-mono text-xs shadow-inner">
      {/* Top micro toolbar if filePath is provided */}
      {filePath && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
          <span className="truncate font-mono text-slate-300 font-medium">
            {filePath}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {language}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {lines.length} lines
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors cursor-pointer"
              title="Copy file contents"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating copy button when no filePath bar */}
      {!filePath && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 shadow-md cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      )}

      {/* Code body with line gutters */}
      <div
        className="overflow-auto divide-y divide-transparent select-text"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines.includes(lineNum);

              return (
                <tr
                  key={lineNum}
                  className={`hover:bg-slate-900/60 transition-colors ${
                    isHighlighted ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  {showLineNumbers && (
                    <td className="w-12 py-0.5 px-2.5 text-right font-mono text-[11px] text-slate-600 select-none border-r border-slate-900 shrink-0">
                      {lineNum}
                    </td>
                  )}
                  <td className="py-0.5 px-3.5 whitespace-pre font-mono text-[12px] leading-relaxed">
                    {tokenizeLine(lineText)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
