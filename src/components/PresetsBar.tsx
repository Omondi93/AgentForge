import React, { useState } from 'react';
import {
  KeyRound,
  CreditCard,
  Shield,
  Calculator,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface PresetsBarProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  defaultCollapsed?: boolean;
}

export const PresetsBar: React.FC<PresetsBarProps> = ({
  selectedPresetId,
  onSelectPreset,
  defaultCollapsed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!defaultCollapsed);

  const suggestions = [
    {
      id: 'auth',
      promptText: '“How about building a User Auth system?”',
      featureTag: 'Sessions & JWT Cookies',
      icon: KeyRound,
      color: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
    },
    {
      id: 'stripe',
      promptText: '“Want to add Stripe Subscriptions?”',
      featureTag: 'Checkout & Webhooks',
      icon: CreditCard,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    },
    {
      id: 'rbac',
      promptText: '“Need Team RBAC & Permissions?”',
      featureTag: 'Hierarchical Role Matrix',
      icon: Shield,
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
    },
    {
      id: 'calculator',
      promptText: '“How about a Modern Calculator?”',
      featureTag: 'Keypad & Expression History',
      icon: Calculator,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    },
  ];

  return (
    <div className="flex flex-col gap-2 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-2.5 transition-all">
      {/* Header with Collapsible Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Architectural Suggestions
            </span>
          </div>

          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {suggestions.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Conversational starting points
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Collapse suggestions' : 'Expand suggestions'}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md transition-all cursor-pointer shadow-2xs"
          >
            <span>Suggestions [{isExpanded ? 'Hide' : 'Show'}]</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Horizontally scrollable single-row carousel when expanded */}
      {isExpanded && (
        <div className="relative pt-1 animate-fade-in">
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x">
            {suggestions.map((suggestion) => {
              const isSelected = selectedPresetId === suggestion.id;
              const Icon = suggestion.icon;

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSelectPreset(suggestion.id)}
                  className={`flex-none w-[240px] sm:w-[260px] snap-start flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer group relative overflow-hidden select-none ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-500 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium leading-snug line-clamp-2 ${
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}
                    >
                      {suggestion.promptText}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center gap-1 truncate">
                      <span className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                      <span className="truncate">{suggestion.featureTag}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
