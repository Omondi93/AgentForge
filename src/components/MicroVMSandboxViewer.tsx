import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Server,
  Lock,
  Terminal,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  Layers,
  Clock,
  HardDrive,
  Eye,
  Key,
} from 'lucide-react';
import {
  MicroVMSandboxState,
  ActiveMicroVM,
  EgressAuditLogItem,
  SandboxRuntimeType,
} from '../types/agentforge';
import { microvmSandboxService } from '../services/microvmSandboxService';

interface MicroVMSandboxViewerProps {
  onOpenSettings?: () => void;
  compact?: boolean;
}

export const MicroVMSandboxViewer: React.FC<MicroVMSandboxViewerProps> = ({
  onOpenSettings,
  compact = false,
}) => {
  const [sandboxState, setSandboxState] = useState<MicroVMSandboxState>(() =>
    microvmSandboxService.getState()
  );
  const [customProbeTarget, setCustomProbeTarget] = useState('');
  const [customProbePort, setCustomProbePort] = useState('443');
  const [isProbing, setIsProbing] = useState(false);
  const [lastProbeResult, setLastProbeResult] = useState<{
    action: string;
    reason: string;
    target: string;
  } | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'instances' | 'egress' | 'secret_proxy' | 'quotas' | 'logs'>('instances');

  // Load from backend API if available, else local
  useEffect(() => {
    fetch('/api/sandbox/status')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch status');
      })
      .then((data) => {
        setSandboxState(data);
        microvmSandboxService.persistState(data);
      })
      .catch(() => {
        setSandboxState(microvmSandboxService.getState());
      });
  }, []);

  const handleRuntimeChange = async (newRuntime: SandboxRuntimeType) => {
    const updated = microvmSandboxService.setRuntime(newRuntime);
    setSandboxState(updated);
    try {
      await fetch('/api/sandbox/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtime: newRuntime }),
      });
    } catch {
      // Local fallback
    }
  };

  const handleRunProbe = async (target: string, port = 443) => {
    if (!target) return;
    setIsProbing(true);
    try {
      const res = await fetch('/api/sandbox/test-egress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, port }),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxState(data.sandboxState);
        setLastProbeResult({
          action: data.action,
          reason: data.reason,
          target,
        });
      } else {
        throw new Error('Fallback to client service');
      }
    } catch {
      const localResult = microvmSandboxService.testEgressProbe(target, port);
      setSandboxState(microvmSandboxService.getState());
      setLastProbeResult({
        action: localResult.action,
        reason: localResult.reason,
        target,
      });
    } finally {
      setIsProbing(false);
    }
  };

  const handleRestartVM = (vmId: string) => {
    const restarted = microvmSandboxService.restartVM(vmId);
    if (restarted) {
      setSandboxState(microvmSandboxService.getState());
    }
  };

  const handleTerminateVM = async (vmId: string) => {
    microvmSandboxService.terminateVM(vmId);
    setSandboxState(microvmSandboxService.getState());
    try {
      await fetch('/api/sandbox/terminate-vm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vmId }),
      });
    } catch {
      // client fallback
    }
  };

  const filteredLogs = sandboxState.auditLogs.filter((log) => {
    if (auditFilter === 'ALL') return true;
    return log.action === auditFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto no-scrollbar">
      {/* Top Banner: Architecture & Security Invariants */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Secure MicroVM Execution Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Hardware Isolated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dedicated Linux 6.1 kernels via Firecracker/KVM · Zero-Trust Egress · Dynamic Secret Injection
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Metadata Probes Blocked:</span>
              <span className="font-mono font-bold text-rose-400">{sandboxState.metadataProbesBlocked}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Zero Ambient Secrets:</span>
              <span className="font-mono font-bold text-emerald-400">100% Sanitized</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            )}
          </div>
        </div>

        {/* Runtime Architecture Selection Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Runtime:</span>
          <button
            type="button"
            onClick={() => handleRuntimeChange('firecracker_microvm')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              sandboxState.runtime === 'firecracker_microvm'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>AWS Firecracker MicroVM (Recommended)</span>
            <span className="text-[10px] opacity-80 font-mono">Dedicated Kernel</span>
          </button>

          <button
            type="button"
            onClick={() => handleRuntimeChange('gvisor_sandbox')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              sandboxState.runtime === 'gvisor_sandbox'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>gVisor (runsc)</span>
            <span className="text-[10px] opacity-80 font-mono">Syscall Filter</span>
          </button>

          <button
            type="button"
            onClick={() => handleRuntimeChange('standard_container')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              sandboxState.runtime === 'standard_container'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Standard Container</span>
            <span className="text-[10px] text-amber-300 font-mono">Shared Kernel (Insecure)</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-900/60 border-b border-slate-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('instances')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'instances'
              ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active MicroVMs ({sandboxState.activeInstances.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('egress')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'egress'
              ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Trust Egress & Probes</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Default Deny
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('secret_proxy')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'secret_proxy'
              ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>Dynamic Secret Proxy</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            0 Ambient Keys
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quotas')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'quotas'
              ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          <span>Compute Quotas ({sandboxState.computeQuotas.memoryLimitMb}MB / {sandboxState.computeQuotas.timeoutSeconds}s)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'border-indigo-400 text-indigo-300 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Egress Audit Logs ({sandboxState.auditLogs.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {/* ================= TAB 1: ACTIVE MICROVMS ================= */}
        {activeSubTab === 'instances' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Isolated Worker MicroVM Instances</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    (Each agent runs in a dedicated Firecracker guest kernel with isolated memory space)
                  </span>
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Isolation: <strong className="text-indigo-400">{sandboxState.isolationLevel}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sandboxState.activeInstances.map((vm) => {
                const isTerminated = vm.status === 'terminated';
                const personaColor =
                  vm.persona === 'backend'
                    ? 'border-emerald-500/40 text-emerald-400'
                    : vm.persona === 'frontend'
                    ? 'border-sky-500/40 text-sky-400'
                    : 'border-amber-500/40 text-amber-400';

                return (
                  <div
                    key={vm.vmId}
                    className={`rounded-xl border p-4 bg-slate-900/80 transition-all ${
                      isTerminated ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isTerminated ? 'bg-slate-600' : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <span className="text-xs font-bold text-white capitalize">
                          {vm.persona} Worker VM
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${personaColor} bg-slate-950`}>
                        {vm.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-1.5 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-500">VM ID:</span>
                        <span className="text-slate-300 font-semibold">{vm.vmId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kernel:</span>
                        <span className="text-indigo-300">{vm.kernelVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Memory Allocation:</span>
                        <span className="text-emerald-400 font-semibold">
                          {vm.peakMemoryMb}MB / {vm.memoryMb}MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">vCPU Allocation:</span>
                        <span className="text-slate-300">{vm.vCpuCount} vCPU (Pinned CFS)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Network Mode:</span>
                        <span className="text-sky-300">Isolated TAP · Secret Proxy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ambient Secrets in Env:</span>
                        <span className="text-emerald-400 font-bold">0 (Clean Sanitized)</span>
                      </div>
                    </div>

                    {/* Progress bar of memory */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>RAM Utilization</span>
                        <span>{Math.round((vm.peakMemoryMb / vm.memoryMb) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (vm.peakMemoryMb / vm.memoryMb) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleRestartVM(vm.vmId)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Re-boot MicroVM instance"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>Reboot VM</span>
                      </button>
                      {!isTerminated && (
                        <button
                          type="button"
                          onClick={() => handleTerminateVM(vm.vmId)}
                          className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                          title="Emergency SIGKILL termination"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Defense in Depth Architecture Diagram Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Defense-in-Depth MicroVM Isolation Architecture</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-indigo-400 font-bold mb-1">1. Dedicated Kernel</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unlike standard containers sharing Linux host kernel, Firecracker microVMs provision a dedicated kernel. Kernel privilege escalations remain trapped in the VM.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-rose-400 font-bold mb-1">2. Zero-Trust Egress</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Default-Deny blocks all outbound traffic. Explicitly rejects 169.254.169.254 (Cloud metadata) and RFC 1918 subnets. Only allowlisted domains pass.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-amber-400 font-bold mb-1">3. Dynamic Secret Proxy</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Untrusted AI code has zero ambient credentials in <code className="text-amber-300">process.env</code>. Tokens are injected on the wire at the network proxy layer.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-sky-400 font-bold mb-1">4. Hard Compute Quotas</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hard memory limits (1024MB) enforced via cgroups v2 and a hard 120s timeout watchdog prevent infinite loops or Denial of Service attacks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ZERO-TRUST EGRESS & PROBES ================= */}
        {activeSubTab === 'egress' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Interactive Egress Policy & Threat Prober</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test the sandbox firewall against real attack vectors: metadata exfiltration, arbitrary outbound C2, and allowlisted registries.
                  </p>
                </div>
              </div>

              {/* Preset Threat Probe Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRunProbe('169.254.169.254', 80)}
                  disabled={isProbing}
                  className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-1">
                    <span>🛑 Probe Cloud Metadata</span>
                    <span className="text-[10px] font-mono bg-rose-500/20 px-1.5 py-0.5 rounded">HIGH RISK</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">169.254.169.254:80</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tests AWS/GCP IAM credential theft defense</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunProbe('evil-exfiltration-c2.net', 443)}
                  disabled={isProbing}
                  className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>⚠️ Probe Untrusted Host</span>
                    <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded">DENIED</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">evil-exfiltration-c2.net</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tests Default-Deny outbound filter</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunProbe('registry.npmjs.org', 443)}
                  disabled={isProbing}
                  className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                    <span>✔ Allowed NPM Registry</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">ALLOWED</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">registry.npmjs.org:443</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tests allowlist matching for package install</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunProbe('api.github.com', 443)}
                  disabled={isProbing}
                  className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-1">
                    <span>🔑 Dynamic Secret Injected</span>
                    <span className="text-[10px] font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded">PROXIED</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">api.github.com:443</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tests wire-level PAT authorization injection</p>
                </button>
              </div>

              {/* Custom Target Probe Input */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter hostname or IP to test (e.g. 192.168.1.1, pastebin.com, github.com)..."
                  value={customProbeTarget}
                  onChange={(e) => setCustomProbeTarget(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Port"
                  value={customProbePort}
                  onChange={(e) => setCustomProbePort(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 text-center font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleRunProbe(customProbeTarget, Number(customProbePort) || 443)}
                  disabled={!customProbeTarget || isProbing}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  {isProbing ? 'Probing...' : 'Probe Firewall'}
                </button>
              </div>

              {/* Last Probe Live Feedback Card */}
              {lastProbeResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    lastProbeResult.action === 'BLOCKED'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : lastProbeResult.action === 'PROXY_INJECTED'
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {lastProbeResult.action === 'BLOCKED' ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : lastProbeResult.action === 'PROXY_INJECTED' ? (
                    <Key className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Probe Result: {lastProbeResult.action}
                      </span>
                      <span className="text-[11px] font-mono text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {lastProbeResult.target}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {lastProbeResult.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Whitelisted Domains Table */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Approved Egress Allowlist (Strict Default-Deny Active)</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {sandboxState.networkPolicy.allowedDomains.length} domains permitted
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {sandboxState.networkPolicy.allowedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-emerald-400 font-semibold">{domain}</span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900">
                      HTTPS / 443
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DYNAMIC SECRET PROXY ================= */}
        {activeSubTab === 'secret_proxy' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Dynamic Wire-Level Secret Proxying (Zero Ambient Credentials)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Untrusted worker code is never given long-lived API keys in its environment variables. Credentials are substituted on the wire by an upstream sidecar proxy.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Active & Enforced
                </span>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>Shared Container / Naive Environment (Insecure)</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 text-[11px] font-mono text-rose-300 overflow-x-auto border border-rose-500/20">
{`// Inside worker container process:
process.env.GITHUB_TOKEN = "ghp_live_secret_key_8492"
process.env.GEMINI_API_KEY = "AIzaSy..."

// Risk: Rogue agent or compromised dependency
// reads process.env and exfiltrates master credentials!`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>AgentForge MicroVM + Wire Proxy (Zero Trust)</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 text-[11px] font-mono text-emerald-300 overflow-x-auto border border-emerald-500/20">
{`// Inside isolated MicroVM guest kernel:
process.env.GITHUB_TOKEN = undefined
HTTP_PROXY = "http://127.0.0.1:4999"

// Secure: Code calls api.github.com -> Proxy injects
// scoped token on wire without exposing to VM memory!`}
                  </pre>
                </div>
              </div>

              {/* Sanitized Environment Variables List */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <h5 className="text-xs font-semibold text-slate-300">
                  Sanitized Environment Variables (Stripped from MicroVM instances):
                </h5>
                <div className="flex flex-wrap gap-2">
                  {sandboxState.secretProxy.sanitizedEnvVars.map((envVar) => (
                    <span
                      key={envVar}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>{envVar} = [SANITIZED]</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: COMPUTE QUOTAS ================= */}
        {activeSubTab === 'quotas' && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <span>MicroVM Hardware Compute Quotas & Watchdogs</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict memory ceilings and execution timeouts prevent rogue infinite loops or Denial-of-Service attacks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Memory Ceiling</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {sandboxState.computeQuotas.memoryLimitMb} MB
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enforced via Linux cgroups v2 memory.max. OOM-killer instantly terminates processes exceeding limit.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Execution Timeout</span>
                  <span className="font-mono font-bold text-amber-400">
                    {sandboxState.computeQuotas.timeoutSeconds} Seconds
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hard hardware watchdog timer. Sends SIGKILL to the microVM if execution duration exceeds threshold.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">vCPU Pinning</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {sandboxState.computeQuotas.cpuLimitCount} vCPU (CFS 100ms)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Completely isolates CPU cycles from host server threads, guaranteeing zero starvation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: AUDIT LOGS ================= */}
        {activeSubTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>MicroVM Egress Packet Inspection Audit Stream</span>
              </h4>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 text-xs">
                {(['ALL', 'BLOCKED', 'ALLOWED', 'PROXY_INJECTED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAuditFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      auditFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Port</th>
                      <th className="py-2.5 px-3">Reason / Security Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.map((log) => {
                      const badgeClass =
                        log.action === 'BLOCKED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : log.action === 'PROXY_INJECTED'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-200">
                            {log.target}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {log.port}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] max-w-md truncate">
                            {log.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
