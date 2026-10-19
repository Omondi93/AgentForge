import React, { useState } from 'react';
import {
  X,
  Layers,
  ShieldCheck,
  GitPullRequest,
  GitMerge,
  FileCode,
  CheckCircle2,
  Lock,
  Cpu,
  Globe,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Terminal,
  Zap,
  Server,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface ArchitecturePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitecturePipelineModal: React.FC<ArchitecturePipelineModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<'pipeline' | 'microvm' | 'invariants' | 'stack'>('pipeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AgentForge Architecture & Pipeline Blueprint
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  v2.5 Invariant Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous multi-agent orchestration within zero-trust, hardware-isolated microVM sandboxes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-900/60 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSection('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'pipeline'
                ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
            <span>5 Gated Pipeline Stages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('microvm')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'microvm'
                ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>MicroVM Isolation Model</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              Zero Trust
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('invariants')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'invariants'
                ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Security Threat Invariants</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('stack')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'stack'
                ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Tech Stack & System Specs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= SECTION 1: 5 PIPELINE STAGES ================= */}
          {activeSection === 'pipeline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Stage 1: Conversational Discovery & Gate 1 (RFC Alignment)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      Lead Architect (Alex Vance)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Natural language collaboration to explore requirements. Alex Vance synthesizes technical clarifications across three distinct tiers: Mandatory Security Invariants, Architectural Trade-offs, and Edge Case Error Budgets. Upon review, generates a locked <strong>Requirements Baseline</strong> at Gate 1.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Stage 2: Task Decomposition & Gate 2 (Fleet Crew Allocation)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Blast Radius Scopes
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Decomposes baseline into parallelizable workstreams bounded by explicit file glob scopes (e.g. <code className="text-emerald-300 font-mono">app/api/auth/*</code> for Backend, <code className="text-sky-300 font-mono">components/auth/*</code> for Frontend). Supports custom specialist personas and token-saving <strong>Dormant Toggles</strong>.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Stage 3: Frozen Contract Schema & Gate 3 (Immutable Interface Lock)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      SHA-256 Checksum Seal
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Compiles and freezes strongly typed TypeScript AST models and OpenAPI endpoints. Any drift triggers automated compiler failure. Gate 3 approval locks the contract and unlocks the parallel microVM worker fleet.
                  </p>
                </div>

                {/* Stage 4 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs">
                        4
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Stage 4: Hardware MicroVM Worker Execution & Isolated Git PRs
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Dedicated Linux 6.1 Kernel
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Active workers run inside dedicated AWS Firecracker microVMs with Default-Deny networking, wire-level dynamic secret proxying, and 1024 MB cgroup limits. Workers commit code exclusively to isolated Git branches.
                  </p>
                </div>

                {/* Stage 5 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs">
                        5
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        Stage 5: CI Pipeline Checks, Human Review & Production Release
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      Fast-Forward Merge & Deploy
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Automated 3-step CI verification (<code className="text-purple-300 font-mono">npm lint</code>, <code className="text-purple-300 font-mono">tsc --noEmit</code>, <code className="text-purple-300 font-mono">vitest</code>) with 1-click triage auto-repair. Once green, provides interactive diff viewing, live app preview, merge to main, and instant Vercel/Cloudflare deployment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: MICROVM ISOLATION MODEL ================= */}
          {activeSection === 'microvm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hardware-Isolated MicroVM Defense-in-Depth</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike traditional containerized workflows where containers share the host Linux kernel, AgentForge launches each AI worker session inside an <strong>AWS Firecracker MicroVM</strong> powered by KVM hardware virtualization.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Dedicated Guest Kernel (Linux 6.1)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Kernel exploits or privilege escalations remain strictly trapped in the VM guest kernel without endangering the host.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Zero-Trust Default-Deny TAP Device</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      All outbound requests are rejected by default. Hard block on 169.254.169.254 prevents cloud IAM credential theft.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Dynamic Secret Proxy (Zero Ambient Keys)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Environment variables have zero credentials. Secrets are injected at the wire level when calling allowlisted GitHub/npm APIs.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Compute Watchdogs & Memory Max</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      1024 MB memory ceiling and 120s execution timer enforce hard hardware SIGKILL on infinite loops or DoS allocations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: SECURITY THREAT INVARIANTS ================= */}
          {activeSection === 'invariants' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Threat Vector</th>
                      <th className="py-2.5 px-3">Standard AI Platforms</th>
                      <th className="py-2.5 px-3 text-emerald-400">AgentForge Invariant Guard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Container Escape</td>
                      <td className="py-2.5 px-3 text-rose-400">Shared Linux host kernel</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">Firecracker MicroVM (Dedicated Kernel)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Credential Exfiltration</td>
                      <td className="py-2.5 px-3 text-rose-400">process.env.GITHUB_TOKEN readable</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">Wire-Level Dynamic Secret Proxy (0 Ambient Keys)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Cloud IAM Theft</td>
                      <td className="py-2.5 px-3 text-rose-400">Probes 169.254.169.254 metadata</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">RFC 3927 Link-Local Firewall Drop</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Arbitrary C2 Network</td>
                      <td className="py-2.5 px-3 text-rose-400">Permissive internet access</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">Default-Deny + Strict Domain Whitelist</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Infinite Loop / DoS</td>
                      <td className="py-2.5 px-3 text-rose-400">Consumes host memory/CPU</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">cgroups v2 1024MB RAM & 120s Timeout Watchdog</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-white">Blast Radius Drift</td>
                      <td className="py-2.5 px-3 text-rose-400">Agent overwrites random files</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">Permitted File Glob Pattern Guardrails</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 4: TECH STACK ================= */}
          {activeSection === 'stack' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-indigo-400">Core Runtime & Frontend</div>
                  <p className="text-slate-300 font-mono text-[11px]">
                    React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Motion (Framer Motion)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400">Backend Server & Middleware</div>
                  <p className="text-slate-300 font-mono text-[11px]">
                    Node.js v22, Express, TSX, Salted scrypt cryptographic authentication, session cookies
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400">AI SDK & Models</div>
                  <p className="text-slate-300 font-mono text-[11px]">
                    @google/genai SDK (Gemini 2.0 Flash / Pro), streaming, function calling, search grounding
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-sky-400">Sandboxing & Git Integration</div>
                  <p className="text-slate-300 font-mono text-[11px]">
                    AWS Firecracker MicroVM, gVisor runsc wrapper, Linux cgroups v2, Octokit REST API
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>AgentForge Invariant Engine · Ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
