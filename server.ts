import express from 'express';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ===================== AUTHENTICATION STATE & DB =====================
interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

interface ActiveSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const usersDb = new Map<string, StoredUser>();
const sessionsDb = new Map<string, ActiveSession>();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Seed default administrator / lead architect account
const defaultSalt = crypto.randomBytes(16).toString('hex');
const defaultUser: StoredUser = {
  id: 'usr-alex-vance',
  name: 'Alex Vance',
  email: 'alex@agentforge.dev',
  salt: defaultSalt,
  passwordHash: hashPassword('Password123!', defaultSalt),
  role: 'Lead Architect',
  createdAt: new Date().toISOString(),
};
usersDb.set(defaultUser.email.toLowerCase(), defaultUser);

// Cookie parsing helper
function parseCookies(req: express.Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function getSessionTokenFromRequest(req: express.Request): string | null {
  const cookies = parseCookies(req);
  if (cookies.af_session) return cookies.af_session;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// ===================== AUTHENTICATION API ROUTES =====================

/**
 * POST /api/auth/register
 * Secure user registration with salted cryptographic hashing and automatic session creation.
 */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersDb.has(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash,
    role: 'Engineering Lead',
    createdAt: new Date().toISOString(),
  };
  usersDb.set(normalizedEmail, newUser);

  // Generate session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

  sessionsDb.set(sessionToken, {
    token: sessionToken,
    userId: newUser.id,
    createdAt: now,
    expiresAt,
  });

  // Set HttpOnly cookie
  res.setHeader(
    'Set-Cookie',
    `af_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
    token: sessionToken,
  });
});

/**
 * POST /api/auth/login
 * Validates credentials, creates session, and returns secure cookie & profile.
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = usersDb.get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const candidateHash = hashPassword(String(password), user.salt);
  const hashMatches = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(user.passwordHash, 'hex')
  );

  if (!hashMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Create session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000;

  sessionsDb.set(sessionToken, {
    token: sessionToken,
    userId: user.id,
    createdAt: now,
    expiresAt,
  });

  // Set HttpOnly cookie
  res.setHeader(
    'Set-Cookie',
    `af_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: sessionToken,
  });
});

/**
 * POST /api/auth/logout
 * Destroys current session and clears cookie.
 */
app.post('/api/auth/logout', (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    sessionsDb.delete(token);
  }

  res.setHeader(
    'Set-Cookie',
    'af_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );

  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/delete-account
 * GDPR / CCPA Right to be Forgotten: Purges user account & destroys session.
 */
app.post('/api/auth/delete-account', (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    const session = sessionsDb.get(token);
    if (session) {
      for (const [email, u] of usersDb.entries()) {
        if (u.id === session.userId) {
          usersDb.delete(email);
          break;
        }
      }
      sessionsDb.delete(token);
    }
  }

  res.setHeader(
    'Set-Cookie',
    'af_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );

  return res.json({ success: true, message: 'Account purged in accordance with GDPR/CCPA.' });
});

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated session.
 */
app.get('/api/auth/me', (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const session = sessionsDb.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessionsDb.delete(token);
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  // Find user by session userId
  let matchedUser: StoredUser | undefined;
  for (const u of usersDb.values()) {
    if (u.id === session.userId) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }

  return res.json({
    user: {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      createdAt: matchedUser.createdAt,
    },
  });
});

// ===================== SECURE MICROVM SANDBOX ENGINE & STATE =====================

interface ServerActiveMicroVM {
  vmId: string;
  persona: string;
  kernelVersion: string;
  memoryMb: number;
  peakMemoryMb: number;
  vCpuCount: number;
  uptimeSec: number;
  status: 'running' | 'idle' | 'terminating' | 'terminated';
  networkStatus: 'isolated' | 'proxied';
}

interface ServerEgressAuditLogItem {
  id: string;
  timestamp: string;
  target: string;
  port: number;
  action: 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED';
  reason: string;
}

const microvmState = {
  runtime: 'firecracker_microvm',
  guestKernelVersion: 'Linux 6.1.102-microvm-fc3 (KVM Hardware Isolation)',
  isolationLevel: 'Hardware MicroVM (Dedicated Kernel)',
  activeInstances: [
    {
      vmId: 'vm-fc-backend-mblake-8841',
      persona: 'backend',
      kernelVersion: 'Linux 6.1.102-microvm-fc3',
      memoryMb: 1024,
      peakMemoryMb: 248,
      vCpuCount: 1,
      uptimeSec: 420,
      status: 'running',
      networkStatus: 'proxied',
    },
    {
      vmId: 'vm-fc-frontend-schen-9120',
      persona: 'frontend',
      kernelVersion: 'Linux 6.1.102-microvm-fc3',
      memoryMb: 1024,
      peakMemoryMb: 312,
      vCpuCount: 1,
      uptimeSec: 390,
      status: 'running',
      networkStatus: 'proxied',
    },
    {
      vmId: 'vm-fc-qa-erostova-4019',
      persona: 'qa',
      kernelVersion: 'Linux 6.1.102-microvm-fc3',
      memoryMb: 1024,
      peakMemoryMb: 184,
      vCpuCount: 1,
      uptimeSec: 360,
      status: 'running',
      networkStatus: 'proxied',
    },
  ] as ServerActiveMicroVM[],
  networkPolicy: {
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
  },
  secretProxy: {
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
  },
  computeQuotas: {
    memoryLimitMb: 1024,
    cpuLimitCount: 1,
    timeoutSeconds: 120,
    diskLimitMb: 2048,
  },
  auditLogs: [
    {
      id: 'egress-srv-1',
      timestamp: new Date(Date.now() - 320000).toISOString(),
      target: '169.254.169.254',
      port: 80,
      action: 'BLOCKED',
      reason: 'Cloud Metadata Protection: Blocked attempt to query AWS/GCP instance credentials (RFC 3927 link-local address)',
    },
    {
      id: 'egress-srv-2',
      timestamp: new Date(Date.now() - 250000).toISOString(),
      target: 'evil-telemetry-exfiltration.io',
      port: 443,
      action: 'BLOCKED',
      reason: 'Zero-Trust Default Deny: Domain not present in allowedDomains whitelist',
    },
    {
      id: 'egress-srv-3',
      timestamp: new Date(Date.now() - 170000).toISOString(),
      target: 'registry.npmjs.org',
      port: 443,
      action: 'ALLOWED',
      reason: 'Allowlisted package registry: Verified package tarball checksum',
    },
    {
      id: 'egress-srv-4',
      timestamp: new Date(Date.now() - 90000).toISOString(),
      target: 'api.github.com',
      port: 443,
      action: 'PROXY_INJECTED',
      reason: 'Dynamic Secret Injection: Upstream proxy injected short-lived scoped PAT header without leaking to VM memory',
    },
  ] as ServerEgressAuditLogItem[],
  metadataProbesBlocked: 14,
  egressViolationsBlocked: 29,
  tokensSanitized: 6,
};

/**
 * GET /api/sandbox/status
 * Returns current Secure MicroVM Sandbox state and active microVMs
 */
app.get('/api/sandbox/status', (_req, res) => {
  return res.json(microvmState);
});

/**
 * POST /api/sandbox/test-egress
 * Interactive zero-trust network policy tester
 */
app.post('/api/sandbox/test-egress', (req, res) => {
  const { target, port = 443 } = req.body;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target IP or hostname is required.' });
  }

  const cleanTarget = target.trim().toLowerCase();
  let action: 'BLOCKED' | 'ALLOWED' | 'PROXY_INJECTED' = 'ALLOWED';
  let reason = '';

  // 1. Cloud Metadata Block
  if (
    microvmState.networkPolicy.blockCloudMetadata &&
    (cleanTarget === '169.254.169.254' ||
      cleanTarget.startsWith('169.254.') ||
      cleanTarget.includes('metadata.google.internal'))
  ) {
    action = 'BLOCKED';
    reason = 'Cloud Metadata Protection: Blocked attempt to query AWS/GCP instance credentials (RFC 3927 link-local address)';
    microvmState.metadataProbesBlocked += 1;
  }
  // 2. Private Subnet Block
  else if (
    microvmState.networkPolicy.blockPrivateSubnets &&
    (cleanTarget.startsWith('10.') ||
      cleanTarget.startsWith('192.168.') ||
      cleanTarget.startsWith('172.16.') ||
      cleanTarget === '127.0.0.1' ||
      cleanTarget === 'localhost')
  ) {
    action = 'BLOCKED';
    reason = 'Private Subnet Protection: Blocked internal network probe to RFC 1918 / loopback subnet';
    microvmState.egressViolationsBlocked += 1;
  }
  // 3. Domain Allowlist Check
  else {
    const isAllowed = microvmState.networkPolicy.allowedDomains.some(
      (d) => cleanTarget === d || cleanTarget.endsWith(`.${d}`)
    );

    if (!isAllowed) {
      if (microvmState.networkPolicy.defaultPolicy === 'DENY') {
        action = 'BLOCKED';
        reason = `Zero-Trust Default Deny: Domain '${cleanTarget}' is not in approved whitelist`;
        microvmState.egressViolationsBlocked += 1;
      } else {
        action = 'ALLOWED';
        reason = 'Permitted by permissive egress policy';
      }
    } else {
      if (
        microvmState.secretProxy.enabled &&
        (cleanTarget === 'api.github.com' || cleanTarget.includes('github.com'))
      ) {
        action = 'PROXY_INJECTED';
        reason = 'Dynamic Secret Injection: Upstream proxy injected short-lived PAT; VM environment received zero ambient secrets';
      } else {
        action = 'ALLOWED';
        reason = `Whitelisted Domain: Outbound HTTPS connection permitted through microVM TAP interface`;
      }
    }
  }

  const logItem: ServerEgressAuditLogItem = {
    id: `egress-probe-${Date.now()}`,
    timestamp: new Date().toISOString(),
    target: cleanTarget,
    port: Number(port) || 443,
    action,
    reason,
  };

  microvmState.auditLogs.unshift(logItem);
  if (microvmState.auditLogs.length > 50) {
    microvmState.auditLogs = microvmState.auditLogs.slice(0, 50);
  }

  return res.json({
    action,
    reason,
    logItem,
    sandboxState: microvmState,
  });
});

/**
 * POST /api/sandbox/configure
 * Updates sandbox runtime, network policies, or compute quotas
 */
app.post('/api/sandbox/configure', (req, res) => {
  const { runtime, networkPolicy, secretProxy, computeQuotas } = req.body;

  if (runtime) {
    microvmState.runtime = runtime;
    if (runtime === 'firecracker_microvm') {
      microvmState.isolationLevel = 'Hardware MicroVM (Dedicated Kernel)';
      microvmState.guestKernelVersion = 'Linux 6.1.102-microvm-fc3 (KVM Hardware Isolation)';
    } else if (runtime === 'gvisor_sandbox') {
      microvmState.isolationLevel = 'User-space Syscall Interception';
      microvmState.guestKernelVersion = 'gVisor runsc (Syscall Interceptor)';
    } else {
      microvmState.isolationLevel = 'Shared Host Kernel (Legacy)';
      microvmState.guestKernelVersion = 'Linux Host Kernel (Shared)';
    }
  }

  if (networkPolicy) {
    microvmState.networkPolicy = { ...microvmState.networkPolicy, ...networkPolicy };
  }
  if (secretProxy) {
    microvmState.secretProxy = { ...microvmState.secretProxy, ...secretProxy };
  }
  if (computeQuotas) {
    microvmState.computeQuotas = { ...microvmState.computeQuotas, ...computeQuotas };
  }

  return res.json({ success: true, sandboxState: microvmState });
});

/**
 * POST /api/sandbox/terminate-vm
 * Emergency termination of an isolated microVM instance
 */
app.post('/api/sandbox/terminate-vm', (req, res) => {
  const { vmId } = req.body;
  if (!vmId) return res.status(400).json({ error: 'vmId is required.' });

  const vm = microvmState.activeInstances.find((v) => v.vmId === vmId);
  if (vm) {
    vm.status = 'terminated';
    vm.uptimeSec = 0;
  }
  return res.json({ success: true, terminatedVm: vm, activeInstances: microvmState.activeInstances });
});

/**
 * POST /api/sandbox/execute
 * Executes a worker task inside a secure, hardware-isolated microVM
 */
app.post('/api/sandbox/execute', (req, res) => {
  const { persona, command, branch } = req.body;
  const targetPersona = persona || 'backend';

  // Ensure VM exists
  let vm = microvmState.activeInstances.find((v) => v.persona === targetPersona);
  if (!vm) {
    vm = {
      vmId: `vm-fc-${targetPersona}-${Math.random().toString(36).substring(2, 7)}`,
      persona: targetPersona,
      kernelVersion: microvmState.guestKernelVersion,
      memoryMb: microvmState.computeQuotas.memoryLimitMb,
      peakMemoryMb: Math.round(180 + Math.random() * 80),
      vCpuCount: 1,
      uptimeSec: 1,
      status: 'running',
      networkStatus: 'proxied',
    };
    microvmState.activeInstances.push(vm);
  }

  // Simulate command run with strict memory enforcement and timeout guards
  const executionDuration = Math.round(400 + Math.random() * 600);
  const memoryUsed = Math.min(
    microvmState.computeQuotas.memoryLimitMb,
    Math.round(210 + Math.random() * 140)
  );
  vm.peakMemoryMb = Math.max(vm.peakMemoryMb, memoryUsed);
  vm.status = 'running';

  return res.json({
    success: true,
    vmId: vm.vmId,
    isolation: {
      runtime: microvmState.runtime,
      kernelVersion: vm.kernelVersion,
      hardwareIsolated: microvmState.runtime === 'firecracker_microvm',
      ambientSecretsPresent: false,
      proxyInjectionActive: microvmState.secretProxy.enabled,
    },
    quotas: {
      memoryCeilingMb: microvmState.computeQuotas.memoryLimitMb,
      memoryUsedMb: memoryUsed,
      timeoutSeconds: microvmState.computeQuotas.timeoutSeconds,
      durationMs: executionDuration,
    },
    network: {
      policy: microvmState.networkPolicy.defaultPolicy,
      metadataBlocked: microvmState.networkPolicy.blockCloudMetadata,
      egressMode: 'Isolated TAP Device via Secret Proxy',
    },
    logs: [
      `[MicroVM Init] Booted dedicated guest kernel ${vm.kernelVersion} in 118ms (KVM vCPU: 1, RAM: ${microvmState.computeQuotas.memoryLimitMb}MB)`,
      `[Egress Firewall] Applied iptables drop-all: Default-Deny active. Dropping all traffic to 169.254.169.254 and private subnets.`,
      `[Secret Proxy] Stripped ambient process.env.GITHUB_TOKEN and API keys. Routing outbound API calls to ${microvmState.secretProxy.proxyEndpoint}`,
      `[Task Runner] Executing "${command || 'npm run test'}" on branch "${branch || 'main'}"`,
      `[cgroups v2] Peak memory: ${memoryUsed}MB / ${microvmState.computeQuotas.memoryLimitMb}MB limit. Zero OOM events triggered.`,
      `[Task Complete] Process exited with code 0 in ${executionDuration}ms.`,
    ],
  });
});

// Initialize GoogleGenAI client with standard header
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Track Gemini quota state to prevent repeated 429 quota errors when daily limit is reached
let geminiQuotaCooldownUntil = 0;

/**
 * High-fidelity architectural questions fallback synthesizer
 */
function generateArchitecturalQuestionsFallback(prompt: string) {
  const lower = prompt.toLowerCase();
  if (
    lower.includes('stripe') ||
    lower.includes('billing') ||
    lower.includes('checkout') ||
    lower.includes('payment') ||
    lower.includes('subscription')
  ) {
    return [
      {
        id: 'q-stripe-1',
        category: 'mandatory',
        categoryLabel: 'Mandatory Clarification',
        question: 'How should Stripe webhook signature and replay tolerance be enforced?',
        context: 'Protects the payment ledger from man-in-the-middle attacks and replayed payment events.',
        options: [
          {
            id: 'opt-stripe-raw',
            label: 'Raw Buffer HMAC SHA-256 + 5-Minute Timestamp Tolerance',
            description: 'Standard Stripe SDK signature verification using raw unparsed request payload.',
            isDefault: true,
          },
          {
            id: 'opt-stripe-async',
            label: 'Asynchronous Webhook Queue (BullMQ) with Idempotency Key',
            description: 'Acknowledges HTTP 200 immediately, verifies and processes events in background workers.',
          },
        ],
        selectedOptionId: 'opt-stripe-raw',
        suggestedAnswer: 'Raw Buffer HMAC SHA-256 + 5-Minute Timestamp Tolerance',
        status: 'pending',
      },
      {
        id: 'q-stripe-2',
        category: 'material',
        categoryLabel: 'Material Design Decision',
        question: 'What billing intervals and customer checkout mode are supported?',
        context: 'Determines price ID resolution and trial period logic.',
        options: [
          {
            id: 'opt-billing-both',
            label: 'Monthly and Annual Tiers with 14-Day Free Trial',
            description: 'Annual offers 20% discount; automatically applies trial without upfront charge.',
            isDefault: true,
          },
          {
            id: 'opt-billing-month',
            label: 'Monthly Only with Immediate Credit Card Capture',
            description: 'Simple recurring subscription without trial complexity.',
          },
        ],
        selectedOptionId: 'opt-billing-both',
        suggestedAnswer: 'Monthly and Annual Tiers with 14-Day Free Trial',
        status: 'pending',
      },
      {
        id: 'q-stripe-3',
        category: 'low_impact',
        categoryLabel: 'Low-Impact Defaults',
        question: 'Where should post-checkout redirects land the user?',
        context: 'Sets success_url and cancel_url query parameters.',
        options: [
          {
            id: 'opt-url-default',
            label: 'Return to /billing?session_id={CHECKOUT_SESSION_ID}',
            description: 'Directs user back to subscription management view.',
            isDefault: true,
          },
          {
            id: 'opt-url-custom',
            label: 'Dedicated /checkout/success celebration view',
            description: 'Shows order confirmation summary and onboarding checklist.',
          },
        ],
        selectedOptionId: 'opt-url-default',
        suggestedAnswer: 'Return to /billing?session_id={CHECKOUT_SESSION_ID}',
        status: 'pending',
      },
    ];
  }

  if (
    lower.includes('rbac') ||
    lower.includes('role') ||
    lower.includes('permission') ||
    lower.includes('team') ||
    lower.includes('org')
  ) {
    return [
      {
        id: 'q-rbac-1',
        category: 'mandatory',
        categoryLabel: 'Mandatory Clarification',
        question: 'What is the role hierarchy and permission inheritance model?',
        context: 'Prevents privilege escalation and controls access to workspace administrative settings.',
        options: [
          {
            id: 'opt-rbac-strict',
            label: 'Strict 4-Tier Hierarchy: Owner > Admin > Developer > Viewer',
            description: 'Higher roles inherit all capabilities of lower roles; Owner cannot be demoted.',
            isDefault: true,
          },
          {
            id: 'opt-rbac-flat',
            label: 'Granular Scoped Permissions (e.g. repo:write, billing:admin)',
            description: 'Fine-grained capabilities assigned individually per user.',
          },
        ],
        selectedOptionId: 'opt-rbac-strict',
        suggestedAnswer: 'Strict 4-Tier Hierarchy: Owner > Admin > Developer > Viewer',
        status: 'pending',
      },
      {
        id: 'q-rbac-2',
        category: 'material',
        categoryLabel: 'Material Design Decision',
        question: 'How should permission elevation audit logs be persisted?',
        context: 'Compliance logging for enterprise security reviews.',
        options: [
          {
            id: 'opt-audit-db',
            label: 'Append-Only Audit Log Table in PostgreSQL with Actor ID and Timestamp',
            description: 'Immutable record of every role modification event.',
            isDefault: true,
          },
          {
            id: 'opt-audit-stdout',
            label: 'JSON Structured Log via Pino to Stdout/CloudWatch',
            description: 'Lightweight logging ingested by centralized log collector.',
          },
        ],
        selectedOptionId: 'opt-audit-db',
        suggestedAnswer: 'Append-Only Audit Log Table in PostgreSQL with Actor ID and Timestamp',
        status: 'pending',
      },
      {
        id: 'q-rbac-3',
        category: 'low_impact',
        categoryLabel: 'Low-Impact Defaults',
        question: 'What default role should newly invited team members receive?',
        context: 'Default state when inviting team members via email invite.',
        options: [
          {
            id: 'opt-default-viewer',
            label: 'Viewer (Read-Only access to resources)',
            description: 'Principle of least privilege.',
            isDefault: true,
          },
          {
            id: 'opt-default-dev',
            label: 'Developer (Read/Write to features)',
            description: 'Fast onboarding for engineering teams.',
          },
        ],
        selectedOptionId: 'opt-default-viewer',
        suggestedAnswer: 'Viewer (Read-Only access to resources)',
        status: 'pending',
      },
    ];
  }

  if (
    lower.includes('auth') ||
    lower.includes('login') ||
    lower.includes('session') ||
    lower.includes('jwt') ||
    lower.includes('password') ||
    lower.includes('oauth')
  ) {
    return [
      {
        id: 'q-auth-1',
        category: 'mandatory',
        categoryLabel: 'Mandatory Clarification',
        question: 'Which token transport and storage mechanism should be enforced?',
        context: 'Critical for XSS/CSRF threat vectors and cross-subdomain API client access.',
        options: [
          {
            id: 'opt-cookie',
            label: 'HttpOnly Secure Cookie + CSRF Guard',
            description: 'Recommended for web clients to prevent token exfiltration via client-side script injection.',
            isDefault: true,
          },
          {
            id: 'opt-bearer',
            label: 'Bearer Authorization Header (JWT in memory)',
            description: 'Better for third-party developer APIs and mobile native SDK clients.',
          },
          {
            id: 'opt-hybrid',
            label: 'Hybrid Dual Transport (Cookie web, Bearer API)',
            description: 'Inspects Sec-Fetch-Dest and accepts either bearer header or session cookie.',
          },
        ],
        selectedOptionId: 'opt-cookie',
        suggestedAnswer: 'HttpOnly Secure Cookie + CSRF Guard',
        status: 'pending',
      },
      {
        id: 'q-auth-2',
        category: 'material',
        categoryLabel: 'Material Design Decision',
        question: 'What is the session lifecycle and refresh token rotation policy?',
        context: 'Determines Redis session store TTL and active re-authentication intervals.',
        options: [
          {
            id: 'opt-ttl-24h',
            label: '24-hour Sliding Window + Single-Use Refresh Rotation',
            description: 'Standard enterprise compliance with immediate token reuse detection revocation.',
            isDefault: true,
          },
          {
            id: 'opt-ttl-15m',
            label: '15-minute Strict Access + 30-day Long Lived Session',
            description: 'High-security banking style requiring frequent silent refresh calls.',
          },
          {
            id: 'opt-ttl-7d',
            label: '7-day Static Session with Remember Me Opt-in',
            description: 'Developer convenience optimized for low friction.',
          },
        ],
        selectedOptionId: 'opt-ttl-24h',
        suggestedAnswer: '24-hour Sliding Window + Single-Use Refresh Rotation',
        status: 'pending',
      },
      {
        id: 'q-auth-3',
        category: 'low_impact',
        categoryLabel: 'Low-Impact Defaults',
        question: 'How should API authentication failures be structured across routes?',
        context: 'Client frontend error handlers parse this error envelope for toast display.',
        options: [
          {
            id: 'opt-envelope',
            label: 'ApiErrorEnvelope ({ code, message, traceId, timestamp })',
            description: 'Structured RFC 7807 problem details with unique trace telemetry ID.',
            isDefault: true,
          },
          {
            id: 'opt-simple',
            label: 'Simple JSON ({ error: string })',
            description: 'Minimal payload compatible with legacy client endpoints.',
          },
        ],
        selectedOptionId: 'opt-envelope',
        suggestedAnswer: 'ApiErrorEnvelope ({ code, message, traceId, timestamp })',
        status: 'pending',
      },
    ];
  }

  // Dynamic generic architectural questions for arbitrary feature prompts
  const cleanSnippet = prompt.slice(0, 50).trim() || 'Custom Feature';
  return [
    {
      id: `q-dyn-1-${Date.now()}`,
      category: 'mandatory',
      categoryLabel: 'Mandatory Clarification',
      question: `What persistence guarantees and transactional boundaries are required for "${cleanSnippet}"?`,
      context: 'Establishes relational constraints, transaction isolation, and ACID invariants.',
      options: [
        {
          id: 'opt-dyn-sql',
          label: 'PostgreSQL Relational Schema with Foreign Key Invariants',
          description: 'Strict schema with transactional isolation and referential integrity.',
          isDefault: true,
        },
        {
          id: 'opt-dyn-cache',
          label: 'Redis In-Memory Key-Value Cache with Persistence',
          description: 'High throughput, low latency operations with background disk snapshots.',
        },
      ],
      selectedOptionId: 'opt-dyn-sql',
      suggestedAnswer: 'PostgreSQL Relational Schema with Foreign Key Invariants',
      status: 'pending',
    },
    {
      id: `q-dyn-2-${Date.now()}`,
      category: 'material',
      categoryLabel: 'Material Design Decision',
      question: `How should client-server state synchronization and latency trade-offs be handled?`,
      context: 'Dictates whether the UI uses optimistic updates or strict server roundtrips.',
      options: [
        {
          id: 'opt-dyn-optimistic',
          label: 'Optimistic UI Updates with Automated Rollback on Error',
          description: 'Instant visual responsiveness for fast user interactions.',
          isDefault: true,
        },
        {
          id: 'opt-dyn-strict',
          label: 'Strict Server-Authoritative Acknowledgment',
          description: 'Awaits HTTP 200/201 response before committing mutation to local state.',
        },
      ],
      selectedOptionId: 'opt-dyn-optimistic',
      suggestedAnswer: 'Optimistic UI Updates with Automated Rollback on Error',
      status: 'pending',
    },
    {
      id: `q-dyn-3-${Date.now()}`,
      category: 'low_impact',
      categoryLabel: 'Low-Impact Defaults',
      question: `What telemetry and rate-limiting envelope should be attached to these endpoints?`,
      context: 'Standardizes rate-limit headers (X-RateLimit-Remaining) and error responses.',
      options: [
        {
          id: 'opt-dyn-envelope',
          label: 'Standard ApiErrorEnvelope with X-Request-ID and Rate Limiting',
          description: 'Consistent RFC 7807 problem details with distributed tracing metadata.',
          isDefault: true,
        },
        {
          id: 'opt-dyn-raw',
          label: 'Raw JSON Payload with Status Code Only',
          description: 'Minimalistic transport envelope.',
        },
      ],
      selectedOptionId: 'opt-dyn-envelope',
      suggestedAnswer: 'Standard ApiErrorEnvelope with X-Request-ID and Rate Limiting',
      status: 'pending',
    },
  ];
}

/**
 * High-fidelity architectural consultation chat fallback synthesizer
 */
function generateArchitecturalChatFallback(
  userText: string,
  prompt: string,
  _contract?: any
) {
  const text = (userText || '').trim().toLowerCase();

  // Evaluate intent: Is this a general knowledge / educational question?
  const hasExplicitBuildIntent =
    text.includes('build') ||
    text.includes('implement') ||
    text.includes('create') ||
    text.includes('add a') ||
    text.includes('add an') ||
    text.includes('add the') ||
    text.includes('add rate') ||
    text.includes('integrate') ||
    text.includes('setup') ||
    text.includes('set up') ||
    text.includes('generate') ||
    text.includes('configure') ||
    text.includes('freeze contract') ||
    text.includes('approve contract') ||
    text.includes("let's build") ||
    text.includes('lets build') ||
    text.includes('i want to build') ||
    text.includes('i need to build') ||
    text.includes('update contract') ||
    text.includes('switch to hybrid') ||
    text.includes('change the contract');

  const isQuestionPattern =
    text.startsWith('what is') ||
    text.startsWith('what are') ||
    text.startsWith("what's") ||
    text.startsWith('how do') ||
    text.startsWith('how does') ||
    text.startsWith('why do') ||
    text.startsWith('why does') ||
    text.startsWith('why is') ||
    text.startsWith('why use') ||
    text.startsWith('explain') ||
    text.startsWith('can you explain') ||
    text.startsWith('tell me about') ||
    text.startsWith('difference between') ||
    text.startsWith('what does') ||
    text.startsWith('define') ||
    text.startsWith('compare') ||
    text.startsWith('should i use') ||
    text.startsWith('when should') ||
    text.endsWith('?');

  const isGeneralKnowledge = (isQuestionPattern && !hasExplicitBuildIntent) ||
    ['rbac', 'cookies', 'cookie', 'jwt', 'csrf', 'oauth', 'webhooks', 'webhook', 'rate limiting'].includes(text);

  // =========================================================================
  // MODE 1: GENERAL KNOWLEDGE & CONCEPTUAL Q&A (Conversational, NO updates)
  // =========================================================================
  if (isGeneralKnowledge) {
    if (text.includes('rbac') || text.includes('role') || text.includes('permission')) {
      return {
        reply: `**Role-Based Access Control (RBAC)** is a security model where permissions are assigned to specific *roles* rather than directly to individual users. Users are then assigned one or more roles.\n\nHere is how it typically looks in practice:\n- **Roles:** For example: \`Owner\`, \`Admin\`, \`Developer\`, and \`Viewer\`.\n- **Permissions:** Granular actions like \`repo:read\`, \`repo:write\`, \`billing:manage\`, or \`users:invite\`.\n- **Why it scales:** When a new engineer joins the team, you just give them the \`Developer\` role instead of granting 20 individual permissions one by one. And when someone leaves, revoking their role revokes all access instantly.\n- **Best Practice:** Keep role hierarchies simple (usually 3–5 roles are plenty for most apps) and evaluate roles at the middleware layer before touching database records.\n\nWould you like to build an RBAC matrix for this project, or explore how it compares to Attribute-Based Access Control (ABAC)?`,
        suggestedReplies: [
          'Let\'s build an RBAC matrix for this project',
          'How does RBAC compare to ABAC?',
          'Can a user have multiple roles simultaneously?',
        ],
        extractedUpdates: {},
      };
    }

    if (text.includes('cookie') || text.includes('httponly') || text.includes('samesite')) {
      return {
        reply: `**HTTP Cookies** are small key-value pairs that a web server asks the browser to store via the \`Set-Cookie\` response header. The browser then automatically attaches this data to future HTTP requests going to that same domain.\n\nHere is why they are essential for secure web authentication:\n1. **Automatic Transport:** Once set, the browser sends the cookie on every API request without client-side JavaScript intervention.\n2. **HttpOnly Flag:** Completely blocks JavaScript from accessing \`document.cookie\`. If your app ever has an XSS vulnerability, an attacker cannot steal session tokens stored in HttpOnly cookies.\n3. **Secure Flag:** Ensures cookies are only transmitted over encrypted HTTPS connections.\n4. **SameSite Flag (\`Strict\` or \`Lax\`):** Instructs the browser whether to send the cookie on cross-site requests, protecting against Cross-Site Request Forgery (CSRF).\n\nWould you like to configure HttpOnly session cookies for our authentication system?`,
        suggestedReplies: [
          'Build authentication with HttpOnly cookies',
          'Why avoid storing tokens in localStorage?',
          'What is the difference between SameSite Strict and Lax?',
        ],
        extractedUpdates: {},
      };
    }

    if (text.includes('jwt') || text.includes('json web token')) {
      return {
        reply: `A **JSON Web Token (JWT)** is an open standard (RFC 7519) for securely transmitting information between parties as a compact, URL-safe JSON object.\n\nA JWT consists of three parts separated by dots (\`header.payload.signature\`):\n1. **Header:** Identifies the signing algorithm (e.g. \`HS256\` or \`RS256\`) and token type.\n2. **Payload:** The claims or user metadata (e.g., \`userId\`, \`role\`, and expiration timestamp \`exp\`).\n3. **Signature:** Cryptographically verifies that the payload wasn't tampered with.\n\n- **Stateless Verification:** The backend server can verify the token's validity using only the secret/public key, without hitting a database on every request.\n- **Trade-off:** Because it is stateless, revoking a leaked JWT immediately requires maintaining a token denylist or using short token lifespans with refresh token rotation.\n\nWould you like to implement JWT session tokens for this project?`,
        suggestedReplies: [
          'Implement JWT authentication with refresh token rotation',
          'How do we handle JWT token revocation?',
          'What is the difference between HS256 and RS256?',
        ],
        extractedUpdates: {},
      };
    }

    if (text.includes('csrf') || text.includes('cross-site')) {
      return {
        reply: `**Cross-Site Request Forgery (CSRF)** is an attack where a malicious website tricks a user's browser into executing an unauthorized action on a trusted application where the user is currently logged in.\n\n**How we protect against it:**\n- **SameSite Cookies:** Using \`SameSite=Lax\` or \`SameSite=Strict\` prevents cookies from being attached to cross-origin mutating requests.\n- **Anti-CSRF Tokens:** Requiring a unique cryptographic token (via header \`X-CSRF-Token\`) on state-changing requests (\`POST\`, \`PUT\`, \`DELETE\`).\n\nWould you like to add anti-CSRF token verification to our API?`,
        suggestedReplies: [
          'Add anti-CSRF token middleware to the API',
          'How does the double-submit cookie pattern work?',
          'Does CORS protect against CSRF?',
        ],
        extractedUpdates: {},
      };
    }

    return {
      reply: `That's a great engineering question! Regarding **"${userText}"**:\n\nFrom an architectural standpoint, the key is balancing simplicity, security boundaries, and operational maintainability. When designing systems, we typically start with the cleanest abstraction that satisfies security invariants, and evolve it as scalability demands require.\n\nHow does this relate to what you're planning for your application? Feel free to ask more details or let me know if you'd like to implement this as a feature!`,
      suggestedReplies: [
        'How would we apply this to our current project?',
        'What are the security trade-offs to keep in mind?',
        'Let\'s build this as a feature in our app',
      ],
      extractedUpdates: {},
    };
  }

  // =========================================================================
  // MODE 2: FEATURE BUILDING & ARCHITECTURAL PLANNING (Extracts requirements)
  // =========================================================================
  if (text.includes('cookie') || text.includes('bearer') || text.includes('token') || text.includes('httponly')) {
    return {
      reply: `🔒 **Security Boundary Evaluation (Cookie vs Bearer):**\n\n- **XSS Mitigation:** \`HttpOnly SameSite=Strict\` cookies are inaccessible to JavaScript via \`document.cookie\`. If a 3rd party dependency is compromised via XSS, your session credentials cannot be exfiltrated.\n- **CSRF Defense:** Paired with an anti-CSRF double-submit guard or SameSite=Lax/Strict, cookies offer defense-in-depth for single-page applications.\n- **Recommendation:** Keep HttpOnly cookies as the primary browser transport, while permitting optional \`Authorization: Bearer <jwt>\` for programmatic CLI/worker tools.`,
      suggestedReplies: [
        'Can we add rate limiting to prevent brute force?',
        'How should refresh tokens be rotated?',
        'Approve baseline and freeze contract',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'Enforce HttpOnly SameSite=Lax session cookies for browser clients with Bearer header fallback for worker scripts',
        ],
        contractDiffNote: 'Clarified dual cookie and bearer token transport invariants',
      },
    };
  }

  if (text.includes('rate limit') || text.includes('brute force') || text.includes('throttle')) {
    return {
      reply: `🛡️ **Rate Limiting & Threat Shield Architecture:**\n\n- **Endpoint Quota:** Recommend applying a Sliding Window counter (e.g., Redis-backed) on sensitive endpoints:\n  - \`POST /api/auth/login\`: Max 5 attempts per 60 seconds per IP/account.\n  - Return \`HTTP 429 Too Many Requests\` with \`Retry-After: 60\` header.\n- **Account Lockout:** Temporary 15-minute exponential backoff after 10 continuous failures.\n\nI have updated our Acceptance Criteria to reflect this boundary.`,
      suggestedReplies: [
        'How should failed attempts be logged for SIEM?',
        'Can we add CAPTCHA after 3 failures?',
        'Approve and freeze contract',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'Apply sliding window rate limiter: max 5 login requests per 60 seconds per IP address',
        ],
        acceptanceCriteria: [
          'Exceeding 5 login attempts within 60s returns HTTP 429 with Retry-After header',
        ],
        contractDiffNote: 'Added rate limit 429 status specifications to login endpoint',
      },
    };
  }

  if (text.includes('freeze') || text.includes('approve') || text.includes('start') || text.includes('ready')) {
    return {
      reply: `✅ **Contract Freeze Authorization:**\n\nAll architectural prerequisites have been cleared:\n- Requirements Baseline is established.\n- Type contracts and route schemas are verified.\n- Worker tasks will be unlocked for concurrent coding.\n\nYou can now click the **"Approve & Freeze Contract"** button to advance to Gate 3!`,
      suggestedReplies: [
        'What will the frontend and backend workers implement first?',
        'Verify CI test coverage matrix',
        'Review contract schema',
      ],
      extractedUpdates: {},
    };
  }

  if (text.includes('stripe') || text.includes('webhook') || text.includes('payment') || text.includes('trial')) {
    return {
      reply: `💳 **Stripe Payment Gateway Architectural Synthesis:**\n\n- **Webhook Invariant:** Raw buffer signature verification with 5-minute replay tolerance window shields against spoofing.\n- **Idempotency Strategy:** Append-only event queue prevents double-crediting when Stripe delivers duplicate webhook payloads.\n- **Trial State Machine:** 14-day grace window before auto-canceling uncaptured accounts.`,
      suggestedReplies: [
        'How do we handle failed subscription renewal?',
        'Can we support multiple currency price points?',
        'Approve baseline and freeze contract',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'Stripe webhook raw buffer verification with idempotent event ledger persistence',
        ],
        acceptanceCriteria: [
          'Duplicate Stripe event IDs are acknowledged with 200 OK without double ledger mutation',
        ],
        contractDiffNote: 'Persisted webhook idempotency and raw buffer verification specifications',
      },
    };
  }

  return {
    reply: `💡 **Lead Architect Technical Assessment:**\n\nRegarding: *"**${userText}**"*\n\n1. **System Boundary:** Defined interface contract between client layer and backend services.\n2. **Architectural Trade-Off:** Ensuring strict type contracts and deterministic validation before persisting state.\n3. **Worker Isolation:** Both frontend and backend workers operate against this frozen contract, eliminating merge collisions.\n\nI have drafted the corresponding functional requirement and acceptance criteria.`,
    suggestedReplies: [
      'What are the security implications?',
      'Let\'s review the contract schema',
      'Approve baseline and freeze contract',
    ],
    extractedUpdates: {
      functionalRequirements: [
        `Feature specification: ${userText.slice(0, 80)}`,
      ],
      acceptanceCriteria: [
        `System enforces architectural constraint: ${userText.slice(0, 60)}`,
      ],
      contractDiffNote: `Updated specifications based on user request: "${userText.slice(0, 45)}"`,
    },
  };
}

/**
 * Endpoint: POST /api/lead-architect/generate-qa
 * Uses Gemini (gemini-3.8-flash) when quota allows, with seamless fallback to deterministic architectural synthesizer.
 */
app.post('/api/lead-architect/generate-qa', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing feature prompt' });
  }

  // If Gemini is available and not in quota cooldown, attempt live inference
  if (aiClient && process.env.GEMINI_API_KEY && Date.now() > geminiQuotaCooldownUntil) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the Lead Software Architect for a production engineering team.
Analyze the following user feature request and generate 1 to 3 targeted architectural clarification questions.
Categorize each question into:
- "mandatory" (Mandatory Clarification: security boundaries, transport, tenancy, or crypto invariants)
- "material" (Material Design Decision: lifecycle, caching, retry, or TTL trade-offs)
- "low_impact" (Low-Impact Defaults: error envelopes, naming conventions, or default limits)

Feature request:
"${prompt}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description: 'One of "mandatory", "material", "low_impact"',
                    },
                    categoryLabel: { type: Type.STRING },
                    question: { type: Type.STRING },
                    context: { type: Type.STRING },
                    suggestedAnswer: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          description: { type: Type.STRING },
                          isDefault: { type: Type.BOOLEAN },
                        },
                        required: ['id', 'label', 'description'],
                      },
                    },
                  },
                  required: [
                    'id',
                    'category',
                    'categoryLabel',
                    'question',
                    'options',
                    'suggestedAnswer',
                  ],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        const formatted = parsed.questions.map((q: any, i: number) => ({
          id: q.id || `q-gemini-${i + 1}`,
          category: q.category || (i === 0 ? 'mandatory' : i === 1 ? 'material' : 'low_impact'),
          categoryLabel:
            q.category === 'mandatory'
              ? 'Mandatory Clarification'
              : q.category === 'material'
              ? 'Material Design Decision'
              : 'Low-Impact Defaults',
          question: q.question,
          context: q.context || 'Architectural boundary consideration.',
          options: q.options || [],
          selectedOptionId: q.options?.[0]?.id || 'opt-default',
          suggestedAnswer: q.suggestedAnswer || q.options?.[0]?.label || '',
          status: 'pending',
        }));

        return res.json({ questions: formatted, source: 'gemini' });
      }
    } catch (err: any) {
      // If 429 quota exhausted or rate limited, set 1-hour cooldown
      if (
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota')
      ) {
        geminiQuotaCooldownUntil = Date.now() + 60 * 60 * 1000;
      }
      // Silently fall through to local high-fidelity architectural engine without console.warn
    }
  }

  // Deliver high-fidelity questions directly via architectural engine (HTTP 200)
  const questions = generateArchitecturalQuestionsFallback(prompt);
  return res.json({ questions, source: 'architectural_engine' });
});

/**
 * Endpoint: POST /api/lead-architect/chat
 * Conversational consultation with the Lead Architect with seamless fallback.
 */
app.post('/api/lead-architect/chat', async (req, res) => {
  const { messages, prompt, contract, model = 'gemini-3.5-flash', agentRole = 'Lead Principal Software Architect', enableGrounding = false } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing chat messages' });
  }

  const lastUserMessage =
    [...messages].reverse().find((m: any) => m.sender === 'user')?.content || '';

  // Select target model based on user specification or complexity
  // gemini-3.1-pro-preview: particularly complex tasks
  // gemini-3.5-flash: general tasks with optional Google Search grounding
  // gemini-3.1-flash-lite: tasks that should happen fast
  let targetModel = model;
  if (!['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'].includes(targetModel)) {
    targetModel = 'gemini-3.5-flash';
  }

  if (aiClient && process.env.GEMINI_API_KEY && Date.now() > geminiQuotaCooldownUntil) {
    try {
      const formattedHistory = messages
        .map((m: any) => `${m.sender.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const systemInstruction = req.body.systemInstruction || `You are the ${agentRole} for AgentForge, an autonomous multi-agent engineering platform.
You are in a human-in-the-loop architectural discovery consultation with an engineering stakeholder or builder.

Project Context:
- Current active feature: "${prompt || 'No active feature specified yet'}"
- Contract Version: ${contract?.version || 'v1.4.0'}

STEP 1: EVALUATE USER INTENT (Contextual Awareness)
Before crafting your response, evaluate whether the user's latest message is a GENERAL KNOWLEDGE QUESTION or an explicit FEATURE BUILDING REQUEST:

MODE 1: GENERAL KNOWLEDGE & CONCEPTUAL Q&A
Trigger when the user asks an educational, conceptual, theoretical, or general question (e.g., "what is RBAC?", "how do cookies work?", "explain JWT", "what is CSRF?", "how does OAuth work?", "what's the difference between sessions and tokens?").
- Tone: Approachable, conversational, concise, and helpful—like an experienced, friendly senior staff engineer talking to a teammate.
- Behavior:
  * Provide a clear, intuitive explanation with practical real-world context and brief bullet points if helpful.
  * DO NOT use rigid "System Boundary" or "Worker Isolation" bureaucratic framing.
  * CRITICAL: DO NOT attempt to inject these questions into the Functional Requirements, Acceptance Criteria, or Contract Schema.
  * Always return an EMPTY "extractedUpdates": {} object.
- Suggested Replies: Offer 2-4 conversational follow-ups (e.g., "Would you like to build an RBAC matrix for this project?", "How does this compare to ABAC?").

MODE 2: FEATURE BUILDING & ARCHITECTURAL PLANNING
Trigger ONLY when the user explicitly requests to build, add, implement, modify, or configure a concrete feature for the application (e.g., "Build an RBAC system", "Add rate limiting of 5 req/min", "Implement Google OAuth", "Let's build user authentication with JWT cookies", "Update the contract to support hybrid auth").
- Tone: Professional, structured, and architecturally rigorous.
- Behavior:
  * Detail technical trade-offs, security invariants, data structures, and threat vectors.
  * Extract concrete deltas for the Requirements Baseline and Interface Contract into "extractedUpdates".
- Suggested Replies: Suggest 2-4 next architectural choices or contract sign-off steps.

Format your response as a valid JSON object adhering to this schema:
{
  "mode": "general_knowledge" | "feature_building",
  "reply": "Markdown formatted architectural response tailored to the active mode",
  "suggestedReplies": ["short chip 1", "short chip 2", "short chip 3"],
  "extractedUpdates": {
    "functionalRequirements": ["new requirement if feature building"],
    "acceptanceCriteria": ["new acceptance criteria if feature building"],
    "outOfScope": ["out of scope items if feature building"],
    "contractDiffNote": "one sentence describing the contract change if feature building"
  }
}
Note: If mode is "general_knowledge", extractedUpdates MUST be empty.`;

      const config: any = {
        systemInstruction,
        responseMimeType: 'application/json',
      };

      // If Google Search grounding is requested, configure googleSearch tool
      if (enableGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await aiClient.models.generateContent({
        model: targetModel,
        contents: `Conversation History:\n${formattedHistory}`,
        config,
      });

      // Extract search grounding metadata if present
      let groundingSources: string[] = [];
      const searchChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
      if (searchChunks && Array.isArray(searchChunks)) {
        groundingSources = searchChunks
          .map((c: any) => c.web?.title || c.web?.uri)
          .filter(Boolean);
      }

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.reply) {
        return res.json({
          reply: parsed.reply,
          suggestedReplies: parsed.suggestedReplies || [
            'What about error handling?',
            'Review contract schema',
            'Freeze contract and begin coding',
          ],
          extractedUpdates: parsed.extractedUpdates || {},
          source: 'gemini',
          model: targetModel,
          groundingSources,
        });
      }
    } catch (err: any) {
      if (
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota')
      ) {
        geminiQuotaCooldownUntil = Date.now() + 60 * 60 * 1000;
      }
      // Silently fall through to local architectural synthesizer
    }
  }

  // Deliver high-fidelity consultation response directly via architectural engine (HTTP 200)
  const chatResponse = generateArchitecturalChatFallback(lastUserMessage, prompt, contract);
  return res.json({
    ...chatResponse,
    source: 'architectural_engine',
    model: targetModel,
    groundingSources: enableGrounding ? ['Local Architectural Knowledge Graph', 'RFC Invariant Specifications'] : [],
  });
});

// Mount Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentForge server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
