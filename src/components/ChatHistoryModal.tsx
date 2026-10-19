import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Bot,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ArchitectChatMessage } from '../types/agentforge';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ArchitectChatMessage[];
  onFocusArchitectChat?: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  messages,
  onFocusArchitectChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = messages.filter((m) =>
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in select-text">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Chat History
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  {messages.length} messages
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transcript of architectural consultations with Lead Principal Architect
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFocusArchitectChat && (
              <button
                type="button"
                onClick={() => {
                  onFocusArchitectChat();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>Open Chat Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations by keywords (e.g., auth, rbac, cookie, contract)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              No matching messages found in current architectural session.
            </div>
          ) : (
            filtered.map((msg) => {
              const isLead = msg.sender === 'lead';
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                    isLead
                      ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          isLead
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {isLead ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {isLead ? 'Lead Principal Architect' : 'You (Product Builder)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{msg.timestamp}</span>
                    </span>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap line-clamp-4">
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Active Gemini-powered architectural dialogue transcript</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
