import {
  MicroVMSandboxState,
  SandboxRuntimeType,
  NetworkEgressPolicy,
  SecretProxyConfig,
  ComputeQuotas,
  EgressAuditLogItem,
  ActiveMicroVM,
  AgentPersona,
} from '../types/agentforge';

const SANDBOX_STATE_STORAGE_KEY = 'agentforge_microvm_sandbox_state';

export const DEFAULT_NETWORK_EGRESS_POLICY: NetworkEgressPolicy = {
  defaultPolicy: 'DENY',
  allowedDomains: [
    'registry.npmjs.org',
    'github.com',
    'api.github.com',
    'raw.githubusercontent.com',
    'esm.sh',
  ],
  blockCloudMetadata: true,
  blockPrivateSubnets: true,
};

export const DEFAULT_SECRET_PROXY_CONFIG: SecretProxyConfig = {
  enabled: true,
  sanitizedEnvVars: [
    'GITHUB_TOKEN',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GCP_SERVICE_ACCOUNT_KEY',
  ],
  proxyEndpoint: 'http://127.0.0.1:4999/proxy/v1',
  maskedSecretsCount: 4,
};

export const DEFAULT_COMPUTE_QUOTAS: ComputeQuotas = {
  memoryLimitMb: 1024,
  cpuLimitCount: 1,
  timeoutSeconds: 120,
  diskLimitMb: 2048,
};

export const INITIAL_ACTIVE_MICROVMS: ActiveMicroVM[] = [
  {
    vmId: 'vm-fc-backend-mblake-8841',
    persona: 'backend',
    kernelVersion: 'Linux 6.1.102-microvm-fc3 (KVM)',
    memoryMb: 1024,
    peakMemoryMb: 248,
    vCpuCount: 1,
    uptimeSec: 340,
    status: 'running',
    networkStatus: 'proxied',
  },
  {
    vmId: 'vm-fc-frontend-schen-9120',
    persona: 'frontend',
    kernelVersion: 'Linux 6.1.102-microvm-fc3 (KVM)',
    memoryMb: 1024,
    peakMemoryMb: 312,
    vCpuCount: 1,
    uptimeSec: 320,
    status: 'running',
    networkStatus: 'proxied',
  },
  {
    vmId: 'vm-fc-qa-erostova-4019',
    persona: 'qa',
    kernelVersion: 'Linux 6.1.102-microvm-fc3 (KVM)',
    memoryMb: 1024,
    peakMemoryMb: 184,
    vCpuCount: 1,
    uptimeSec: 290,
    status: 'running',
    networkStatus: 'proxied',
  },
];

export const INITIAL_AUDIT_LOGS: EgressAuditLogItem[] = [
  {
    id: 'egress-init-1',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    target: '169.254.169.254',
    port: 80,
    action: 'BLOCKED',
    reason: 'Cloud Metadata Protection: Blocked attempt to query AWS/GCP instance credentials (RFC 3927 link-local address)',
  },
  {
    id: 'egress-init-2',
    timestamp: new Date(Date.now() - 280000).toISOString(),
    target: 'evil-telemetry-exfiltration.io',
    port: 443,
    action: 'BLOCKED',
    reason: 'Zero-Trust Default Deny: Domain not present in allowedDomains whitelist',
  },
  {
    id: 'egress-init-3',
    timestamp: new Date(Date.now() - 190000).toISOString(),
    target: 'registry.npmjs.org',
    port: 443,
    action: 'ALLOWED',
    reason: 'Allowlisted package registry: Verified SHA-512 package tarball checksum',
  },
  {
    id: 'egress-init-4',
    timestamp: new Date(Date.now() - 110000).toISOString(),
    target: 'api.github.com',
    port: 443,
    action: 'PROXY_INJECTED',
    reason: 'Dynamic Secret Injection: Upstream proxy injected short-lived scoped PAT header without leaking to VM memory',
  },
  {
    id: 'egress-init-5',
    timestamp: new Date(Date.now() - 40000).toISOString(),
    target: '192.168.1.100',
    port: 22,
    action: 'BLOCKED',
    reason: 'Private Subnet Protection: Blocked RFC 1918 internal network probe from worker container',
  },
];

export class MicroVMSandboxService {
  private state: MicroVMSandboxState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): MicroVMSandboxState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SANDBOX_STATE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...this.getDefaultState(),
            ...parsed,
            networkPolicy: { ...DEFAULT_NETWORK_EGRESS_POLICY, ...parsed.networkPolicy },
            secretProxy: { ...DEFAULT_SECRET_PROXY_CONFIG, ...parsed.secretProxy },
            computeQuotas: { ...DEFAULT_COMPUTE_QUOTAS, ...parsed.computeQuotas },
          };
        }
      } catch (err) {
        console.warn('Failed to load sandbox state from localStorage:', err);
      }
    }
    return this.getDefaultState();
  }

  public getDefaultState(): MicroVMSandboxState {
    return {
      runtime: 'firecracker_microvm',
      guestKernelVersion: 'Linux 6.1.102-microvm-fc3',
      isolationLevel: 'Hardware MicroVM (Dedicated Kernel)',
      activeInstances: INITIAL_ACTIVE_MICROVMS,
      networkPolicy: DEFAULT_NETWORK_EGRESS_POLICY,
      secretProxy: DEFAULT_SECRET_PROXY_CONFIG,
      computeQuotas: DEFAULT_COMPUTE_QUOTAS,
      auditLogs: INITIAL_AUDIT_LOGS,
      metadataProbesBlocked: 14,
      egressViolationsBlocked: 29,
      tokensSanitized: 6,
    };
  }

  public getState(): MicroVMSandboxState {
    return { ...this.state };
  }

  public persistState(newState: Partial<MicroVMSandboxState>): MicroVMSandboxState {
    this.state = {
      ...this.state,
      ...newState,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SANDBOX_STATE_STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error('Failed to persist sandbox state:', err);
      }
    }
    return { ...this.state };
  }

  public setRuntime(runtime: SandboxRuntimeType): MicroVMSandboxState {
    let isolationLevel: MicroVMSandboxState['isolationLevel'] = 'Hardware MicroVM (Dedicated Kernel)';
    let kernel = 'Linux 6.1.102-microvm-fc3';

    if (runtime === 'gvisor_sandbox') {
      isolationLevel = 'User-space Syscall Interception';
      kernel = 'gVisor runsc (Syscall Filter)';
    } else if (runtime === 'standard_container') {
      isolationLevel = 'Shared Host Kernel (Legacy)';
      kernel = 'Linux Host Kernel (Shared)';
    }

    return this.persistState({
      runtime,
      isolationLevel,
      guestKernelVersion: kernel,
    });
  }

  public updateQuotas(quotas: Partial<ComputeQuotas>): MicroVMSandboxState {
    const updated = {
      ...this.state.computeQuotas,
      ...quotas,
    };
    return this.persistState({ computeQuotas: updated });
  }

  public updateNetworkPolicy(policy: Partial<NetworkEgressPolicy>): MicroVMSandboxState {
    const updated = {
      ...this.state.networkPolicy,
      ...policy,
    };
    return this.persistState({ networkPolicy: updated });
  }

  public updateSecretProxy(proxy: Partial<SecretProxyConfig>): MicroVMSandboxState {
    const updated = {
      ...this.state.secretProxy,
      ...proxy,
    };
    return this.persistState({ secretProxy: updated });
  }

  /**
   * Test an egress destination against current firewall and zero-trust policies
   */
  public testEgressProbe(target: string, port = 443): {
    action: 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED';
    reason: string;
    logItem: EgressAuditLogItem;
  } {
    const cleanTarget = target.trim().toLowerCase();
    let action: 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED' = 'ALLOWED';
    let reason = '';

    // Check Cloud Metadata Protection
    if (
      this.state.networkPolicy.blockCloudMetadata &&
      (cleanTarget === '169.254.169.254' ||
        cleanTarget.startsWith('169.254.') ||
        cleanTarget.includes('metadata.google.internal'))
    ) {
      action = 'BLOCKED';
      reason = 'Cloud Metadata Protection: Blocked attempt to query AWS/GCP instance credentials (RFC 3927 link-local address)';
      this.state.metadataProbesBlocked += 1;
    }
    // Check Private Subnets
    else if (
      this.state.networkPolicy.blockPrivateSubnets &&
      (cleanTarget.startsWith('10.') ||
        cleanTarget.startsWith('192.168.') ||
        cleanTarget.startsWith('172.16.') ||
        cleanTarget === '127.0.0.1' ||
        cleanTarget === 'localhost')
    ) {
      action = 'BLOCKED';
      reason = 'Private Subnet Protection: Blocked internal network scan towards RFC 1918 / loopback address';
      this.state.egressViolationsBlocked += 1;
    }
    // Check Domain Allowlist
    else {
      const isAllowed = this.state.networkPolicy.allowedDomains.some(
        (domain) => cleanTarget === domain || cleanTarget.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        if (this.state.networkPolicy.defaultPolicy === 'DENY') {
          action = 'BLOCKED';
          reason = `Zero-Trust Default Deny: Domain '${cleanTarget}' is not in the approved whitelist`;
          this.state.egressViolationsBlocked += 1;
        } else {
          action = 'ALLOWED';
          reason = 'Permitted by permissive egress policy (Warning: Default Deny recommended)';
        }
      } else {
        // Domain is allowed - check if secret proxy applies
        if (
          this.state.secretProxy.enabled &&
          (cleanTarget === 'api.github.com' || cleanTarget.includes('github.com'))
        ) {
          action = 'PROXY_INJECTED';
          reason = 'Dynamic Secret Injection: Forward proxy injected short-lived scoped PAT; zero ambient credentials in VM environment';
        } else {
          action = 'ALLOWED';
          reason = `Whitelisted Domain: Outbound HTTPS connection permitted through isolated microVM TAP interface`;
        }
      }
    }

    const logItem: EgressAuditLogItem = {
      id: `egress-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      target: cleanTarget,
      port,
      action,
      reason,
    };

    const updatedLogs = [logItem, ...this.state.auditLogs.slice(0, 49)];
    this.persistState({
      auditLogs: updatedLogs,
      metadataProbesBlocked: this.state.metadataProbesBlocked,
      egressViolationsBlocked: this.state.egressViolationsBlocked,
    });

    return { action, reason, logItem };
  }

  /**
   * Spawns or updates a dedicated worker microVM instance
   */
  public provisionWorkerVM(persona: AgentPersona | string): ActiveMicroVM {
    const existingIdx = this.state.activeInstances.findIndex((v) => v.persona === persona);
    const newVm: ActiveMicroVM = {
      vmId: `vm-fc-${persona}-${Math.random().toString(36).substring(2, 7)}`,
      persona,
      kernelVersion: this.state.guestKernelVersion,
      memoryMb: this.state.computeQuotas.memoryLimitMb,
      peakMemoryMb: Math.round(180 + Math.random() * 120),
      vCpuCount: this.state.computeQuotas.cpuLimitCount,
      uptimeSec: 1,
      status: 'running',
      networkStatus: this.state.secretProxy.enabled ? 'proxied' : 'isolated',
    };

    let updatedList = [...this.state.activeInstances];
    if (existingIdx >= 0) {
      updatedList[existingIdx] = newVm;
    } else {
      updatedList.push(newVm);
    }

    this.persistState({ activeInstances: updatedList });
    return newVm;
  }

  /**
   * Terminate a specific microVM
   */
  public terminateVM(vmId: string): void {
    const updatedList = this.state.activeInstances.map((v) => {
      if (v.vmId === vmId) {
        return { ...v, status: 'terminated' as const, uptimeSec: 0 };
      }
      return v;
    });
    this.persistState({ activeInstances: updatedList });
  }

  /**
   * Restart a specific microVM
   */
  public restartVM(vmId: string): ActiveMicroVM | undefined {
    const vm = this.state.activeInstances.find((v) => v.vmId === vmId);
    if (!vm) return undefined;
    return this.provisionWorkerVM(vm.persona);
  }
}

export const microvmSandboxService = new MicroVMSandboxService();
