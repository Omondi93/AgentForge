import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Lock, Unlock, Globe, Code2, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { ContractSchema, WorkerTask } from '../types/agentforge';
import { ArchitectureVisualizer } from './ArchitectureVisualizer';

interface ContractSchemaViewerProps {
  contract: ContractSchema;
  onApproveAndFreeze?: () => void;
  tasks?: WorkerTask[];
}

export const ContractSchemaViewer: React.FC<ContractSchemaViewerProps> = ({
  contract,
  onApproveAndFreeze,
  tasks = [],
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [subView, setSubView] = useState<'visualize' | 'types' | 'props' | 'routes'>('visualize');

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(contract.checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(
      `${contract.typesDefinition}\n\n${contract.componentProps || ''}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-sky-300 bg-sky-950/70 border-sky-700/60';
      case 'POST':
        return 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60';
      case 'PUT':
      case 'PATCH':
        return 'text-amber-300 bg-amber-950/70 border-amber-700/60';
      case 'DELETE':
        return 'text-rose-300 bg-rose-950/70 border-rose-700/60';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Gate 3 Draft Alert & Invariant Lock Banner (if unfrozen) */}
      {!contract.frozen && (
        <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-amber-200">
                Gate 3 Invariant: Contract Pending Freeze
              </span>
              <span className="text-[11px] text-amber-300/80">
                Functional workers are strictly blocked from writing code until you approve and freeze this contract.
              </span>
            </div>
          </div>

          {onApproveAndFreeze && (
            <button
              type="button"
              onClick={onApproveAndFreeze}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-lg shadow-sm shadow-amber-900/30 transition-all whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Approve & Freeze Contract</span>
            </button>
          )}
        </div>
      )}

      {/* Contract Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-md border ${
              contract.frozen
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">{contract.version}</span>
              {contract.frozen ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Frozen & Immutable</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/40">
                  <Unlock className="w-2.5 h-2.5" />
                  <span>Draft (Unfrozen)</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-[320px]">
                {contract.checksum}
              </span>
              <button
                type="button"
                onClick={handleCopyChecksum}
                title="Copy SHA256 Checksum"
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* View Switcher: Visualize vs DTOs vs Component Props vs OpenAPI Routes */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSubView('visualize')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              subView === 'visualize'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visualize Architecture</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('types')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              subView === 'types'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>DTOs</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('props')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              subView === 'props'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Props</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('routes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              subView === 'routes'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>OpenAPI ({contract.apiEndpoints.length})</span>
          </button>
        </div>
      </div>

      {/* Main Subview Area */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {subView === 'visualize' ? (
          <ArchitectureVisualizer contract={contract} tasks={tasks} isInline />
        ) : subView === 'types' ? (
          <div className="relative">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy TypeScript</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 text-slate-200 leading-relaxed overflow-x-auto text-[12px]">
              {contract.typesDefinition}
            </pre>
          </div>
        ) : subView === 'props' ? (
          <div className="relative">
            <pre className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 text-slate-200 leading-relaxed overflow-x-auto text-[12px]">
              {contract.componentProps || `/**
 * No dedicated component prop interfaces specified.
 * Shared DTOs in types/contracts.ts govern all component data contracts.
 */`}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xs font-sans text-slate-400">
              Contract specifications enforced across backend routes and client consumers:
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint Path</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Request Payload</th>
                    <th className="py-2.5 px-3">Response Envelope</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {contract.apiEndpoints.map((ep, i) => (
                    <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{ep.path}</span>
                          <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                            {ep.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">
                        {ep.requestType ? (
                          <span className="text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/30">
                            {ep.requestType}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-emerald-300">
                        <span className="bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
                          {ep.responseType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">
                        {ep.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Footer CTA if Unfrozen */}
      {!contract.frozen && onApproveAndFreeze && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-sans">
            Ready to dispatch workers? Freezing the contract enforces schema immutability.
          </div>
          <button
            type="button"
            onClick={onApproveAndFreeze}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Approve & Freeze Contract (Clear Gate 3)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
