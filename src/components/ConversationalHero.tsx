import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Paperclip,
  Mic,
  MicOff,
  ArrowUp,
  Sparkles,
  FileCode2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface ConversationalHeroProps {
  onStartSession: (prompt: string, presetId?: string) => void;
  isSending?: boolean;
}

export const ConversationalHero: React.FC<ConversationalHeroProps> = ({
  onStartSession,
  isSending = false,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showAttachmentHint, setShowAttachmentHint] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestion chips matching the user prompt
  const suggestionChips = [
    {
      id: 'auth',
      label: '🔐 User Auth & Sessions',
      prompt:
        'Implement secure user authentication with JWT/session cookies, login form validation, session provider hook, and integration tests adhering to contract v1.4.0.',
    },
    {
      id: 'stripe',
      label: '💳 Stripe Checkout Flow',
      prompt:
        'Build a Stripe checkout subscription system with webhook handling, idempotency verification, customer billing portal, and tiered plan schemas.',
    },
    {
      id: 'rbac',
      label: '🛡️ Team RBAC Matrix',
      prompt:
        'Architect a hierarchical Team RBAC & Permissions matrix with granular role gates, organization scoping, and audit logs.',
    },
    {
      id: 'analytics',
      label: '📊 Real-time Analytics API',
      prompt:
        'Design a high-throughput Real-time Analytics API with time-series aggregation, Webhook event ingestion, and query rate limiting.',
    },
  ];

  // Check speech recognition support
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSend = () => {
    const trimmed = promptText.trim();
    if (!trimmed || isSending) return;
    onStartSession(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (chip: (typeof suggestionChips)[0]) => {
    if (chip.id === 'auth' || chip.id === 'stripe' || chip.id === 'rbac') {
      onStartSession(chip.prompt, chip.id);
    } else {
      onStartSession(chip.prompt);
    }
  };

  // Toggle Voice / Mic
  const toggleListening = () => {
    if (!speechSupported) {
      // Simulate quick voice transcript fallback
      setIsListening(true);
      setTimeout(() => {
        setPromptText(
          (prev) =>
            (prev ? prev + ' ' : '') +
            'Architect a production-ready microservices API with contract validation.'
        );
        setIsListening(false);
      }, 1200);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPromptText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const names = Array.from(files).map((f) => f.name);
      setAttachedFiles((prev) => [...prev, ...names]);
      setShowAttachmentHint(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] px-4 sm:px-6 py-8 md:py-12 transition-all">
      <div className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center text-center gap-6 sm:gap-8 animate-fade-in">
        {/* 1. Top Center: AgentForge Wordmark/Logo & Clean Greeting */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-1 ring-indigo-400/40 transform transition-transform group-hover:scale-105 duration-200">
              <Layers className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 group-hover:bg-indigo-500/30 transition-all" />
          </div>

          <div className="flex flex-col items-center gap-2 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              What do you want to build today?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Discuss your architecture with Alex Vance, freeze contracts, and dispatch specialist
              workers.
            </p>
          </div>
        </div>

        {/* 2. Center Input Box: Sleek rounded modern prompt container */}
        <div className="w-full relative">
          <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-indigo-950/20 p-2 sm:p-3 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            {/* Optional Attached Files list */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 pt-1 pb-2">
                {attachedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                  >
                    <FileCode2 className="w-3 h-3 text-indigo-500" />
                    <span className="truncate max-w-[140px]">{file}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="hover:text-rose-500 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 px-2 py-1">
              {/* Attachment / Mode Icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach architecture specs, OpenAPI schema, or context file"
                  className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept=".json,.yaml,.yml,.md,.ts,.js,.txt"
                />
              </div>

              {/* Main Prompt Textarea */}
              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, describe a feature, or architect an app..."
                rows={1}
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none py-2 px-1 max-h-36 min-h-[40px] overflow-y-auto leading-relaxed"
                style={{
                  height: textareaRef.current
                    ? `${Math.min(textareaRef.current.scrollHeight, 140)}px`
                    : 'auto',
                }}
              />

              {/* Action Buttons: Voice/Mic & Send */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pb-0.5">
                {/* Voice / Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? 'Listening...' : 'Voice Input (Speech-to-Text)'}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 animate-pulse ring-1 ring-rose-500/40'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!promptText.trim() || isSending}
                  title="Send to Lead Architect Alex (Enter)"
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    promptText.trim() && !isSending
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Subtle Enter key hint */}
            <div className="flex items-center justify-between px-3 pt-1 text-[11px] text-slate-400 font-mono select-none">
              <span className="hidden sm:inline">Lead Architect Alex Vance · Gate 1 Discovery</span>
              <span className="ml-auto">Press Enter ↵ to send</span>
            </div>
          </div>
        </div>

        {/* 3. Suggestion Chips Below Input */}
        <div className="w-full flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Suggested starting architectures:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-2xl">
            {suggestionChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-slate-900/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
