import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, ArrowDownCircle, Copy, Check, Search } from 'lucide-react';
import { ActivityEvent, AgentPersona } from '../types/agentforge';
import { useAgentPersonas } from '../context/AgentPersonaContext';

interface ActivityLogTerminalProps {
  events: ActivityEvent[];
  filterPersona: AgentPersona | 'all' | 'system';
  onFilterChange: (p: AgentPersona | 'all' | 'system') => void;
  autoScroll: boolean;
  onToggleAutoScroll: (val: boolean) => void;
  onClearLogs: () => void;
}

const AGENT_COLORS: Record<string, { badge: string; text: string }> = {
  system: { badge: 'bg-slate-800 text-slate-300 border-slate-700', text: 'text-slate-300' },
  lead: { badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/50', text: 'text-indigo-200' },
  backend: { badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50', text: 'text-emerald-200' },
  frontend: { badge: 'bg-sky-950/70 text-sky-300 border-sky-700/50', text: 'text-sky-200' },
  qa: { badge: 'bg-amber-950/70 text-amber-300 border-amber-700/50', text: 'text-amber-200' },
  webhook: { badge: 'bg-purple-950/70 text-purple-300 border-purple-700/50', text: 'text-purple-200' },
};

export const ActivityLogTerminal: React.FC<ActivityLogTerminalProps> = ({
  events,
  filterPersona,
  onFilterChange,
  autoScroll,
  onToggleAutoScroll,
  onClearLogs,
}) => {
  const { getPersonaName } = useAgentPersonas();
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((evt) => {
    const matchesPersona = filterPersona === 'all' || evt.agent === filterPersona;
    const matchesSearch =
      searchQuery === '' ||
      evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.agent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPersona && matchesSearch;
  });

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleCopy = () => {
    const fullText = filteredEvents
      .map((e) => `[${e.timestamp}] [${e.agent.toUpperCase()}] ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const personaFilters: Array<{ id: AgentPersona | 'all' | 'system'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'lead', label: 'Lead' },
    { id: 'backend', label: 'Backend' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'qa', label: 'QA' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="flex flex-col bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Streaming Orchestration Log
          </span>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            ({filteredEvents.length} events)
          </span>
        </div>

        {/* Persona Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800/80">
          {personaFilters.map((p) => {
            const isActive = filterPersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onFilterChange(p.id)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick search input */}
          <div className="relative hidden sm:block">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="w-24 focus:w-36 text-[11px] font-mono bg-slate-950 text-slate-200 pl-6 pr-2 py-0.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <button
            type="button"
            onClick={() => onToggleAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            className={`p-1 rounded text-xs transition-colors ${
              autoScroll ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy logs"
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            title="Clear terminal"
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={containerRef}
        className="h-64 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 scroll-smooth"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-slate-600 text-center py-8">
            No events logged for current filter criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const personaStyle = AGENT_COLORS[evt.agent] || AGENT_COLORS.system;
            const isError = evt.metadata?.level === 'error';
            const isSuccess = evt.metadata?.level === 'success';

            return (
              <div
                key={evt.id}
                className={`flex items-start gap-2 py-0.5 px-1.5 rounded transition-colors hover:bg-slate-900/60 ${
                  isError ? 'bg-rose-950/20 text-rose-300' : ''
                }`}
              >
                {/* Timestamp */}
                <span className="text-slate-500 tabular-nums shrink-0 select-none">
                  [{evt.timestamp}]
                </span>

                {/* Agent Tag */}
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 border ${personaStyle.badge}`}
                >
                  {getPersonaName(evt.agent)}
                </span>

                {/* Log message */}
                <span
                  className={`flex-1 break-words ${
                    isError
                      ? 'text-rose-300 font-medium'
                      : isSuccess
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                  }`}
                >
                  {evt.message}
                </span>

                {/* Metadata branch chip */}
                {evt.metadata?.branch && (
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden md:inline">
                    {evt.metadata.branch}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
