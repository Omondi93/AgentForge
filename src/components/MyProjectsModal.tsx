import React, { useEffect, useState } from 'react';
import {
  X,
  FolderGit2,
  ExternalLink,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  Layers,
  RefreshCw,
  Rocket,
  BookmarkPlus,
  Loader2,
} from 'lucide-react';
import {
  SavedProjectRecord,
  fetchUserProjects,
  deleteProjectFromStorage,
} from '../services/projectStorageService';
import { useAuth } from '../context/AuthContext';

interface MyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: SavedProjectRecord) => void;
  onSaveCurrentState?: () => Promise<void>;
  isSavingCurrent?: boolean;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onSaveCurrentState,
  isSavingCurrent = false,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    const userId = user?.id || 'anonymous_architect';
    const list = await fetchUserProjects(userId);
    setProjects(list);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved project?')) return;
    setDeletingId(projectId);
    await deleteProjectFromStorage(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  My Projects
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  {projects.length} saved
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Archived snapshots from Cloud Firestore · Reload past builds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSaveCurrentState && (
              <button
                type="button"
                onClick={onSaveCurrentState}
                disabled={isSavingCurrent}
                title="Save current pipeline snapshot now"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
                <span>Save Current</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadProjects}
              title="Refresh project list"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-mono">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span>Fetching project ledger from Firestore...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <Layers className="w-6 h-6" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Saved Projects Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Every time a pipeline reaches <strong className="text-indigo-600 dark:text-indigo-400">Stage 5: Published Live</strong> or is deployed to production, its Requirements Baseline, Frozen Contract, and Component references are automatically stored to your Firestore account.
                </p>
              </div>
            </div>
          ) : (
            projects.map((proj) => {
              const formattedDate = new Date(proj.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/70 dark:hover:border-indigo-500/80 bg-white dark:bg-slate-950/70 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-all cursor-pointer shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Rocket className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {proj.name}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Stage 5: Published Live</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Contract {proj.contractVersion || 'v1.4.0'}
                        </span>
                      </div>

                      {proj.featurePrompt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-sans">
                          &ldquo;{proj.featurePrompt}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>
                        {proj.productionUrl && (
                          <span className="flex items-center gap-1 text-sky-500 hover:underline">
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{proj.productionUrl}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, proj.id)}
                      disabled={deletingId === proj.id}
                      title="Delete project snapshot"
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors group-hover:bg-indigo-500">
                      <span>Load & Pick Up</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Clicking any saved project reloads its live preview and architect conversation.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
