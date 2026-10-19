import {
  PlanningQuestion,
  RequirementsBaseline,
  WorkerTask,
  ContractSchema,
  ApiEndpointSchema,
} from '../types/agentforge';
import { getAgentEffectiveModelConfig } from './settingsService';

/**
 * Fallback questions repository organized by feature domain.
 * Used if server-side Gemini endpoint returns 503, high load, or is in an offline sandbox.
 */
const DOMAIN_FALLBACK_DICTIONARY: Record<
  string,
  {
    questions: PlanningQuestion[];
    baseline: RequirementsBaseline;
    endpoints: ApiEndpointSchema[];
    typesDefinition: string;
    componentProps: string;
  }
> = {
  auth: {
    questions: [
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
    ],
    baseline: {
      functionalRequirements: [
        'POST /api/v1/auth/login validates credentials and issues cryptographically signed JWT token',
        'GET /api/v1/auth/session verifies active session cookie and returns sanitized SessionUser profile',
        'POST /api/v1/auth/logout invalidates refresh token record in Redis store and wipes cookie',
        'Session React Context provider propagates user state and loading flags to client tree',
      ],
      acceptanceCriteria: [
        'Invalid credentials return HTTP 401 with code ERR_UNAUTHORIZED within 150ms',
        'Expired tokens fail with HTTP 401 ERR_EXPIRED_TOKEN without leaking stack traces',
        'Zero schema drift: all payload envelopes strictly match frozen contract v1.4.0',
        'Vitest test suite validates token rotation and CSRF protection with 100% assertions passing',
      ],
      outOfScope: [
        'SMS Multi-Factor Authentication (deferred to Security Milestone v2.0)',
        'OAuth Social Providers (Google/GitHub federated login scheduled for Phase 3)',
        'Biometric WebAuthn passkeys',
      ],
      compiledAt: new Date().toISOString(),
      approved: false,
    },
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Authenticate user credentials and issue encrypted session JWT',
        requestType: 'LoginPayload',
        responseType: 'AuthSessionResponse',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/session',
        description: 'Verify current bearer cookie / token and retrieve session profile',
        responseType: 'SessionVerifyResponse',
        status: 200,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/logout',
        description: 'Invalidate active session refresh token in Redis store',
        responseType: '{ success: boolean }',
        status: 200,
      },
    ],
    typesDefinition: `/**
 * AgentForge Frozen Contract: Authentication & Session Protocol
 * Version: v1.4.0 (FROZEN - Modifications require Architectural RFC)
 */

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: ('admin' | 'member' | 'viewer')[];
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  passhash: string;
  rememberMe?: boolean;
}

export interface AuthSessionResponse {
  token: string;
  expiresInSeconds: number;
  user: SessionUser;
  refreshUuid: string;
}

export interface SessionVerifyResponse {
  active: boolean;
  user: SessionUser;
  sessionExpiry: string;
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  timestamp: string;
  traceId: string;
}`,
    componentProps: `/**
 * Component Prop Interfaces
 */

export interface LoginFormProps {
  onSuccess?: (user: SessionUser) => void;
  onError?: (err: ApiErrorEnvelope) => void;
  redirectUrl?: string;
}

export interface SessionBadgeProps {
  user: SessionUser;
  onLogout: () => Promise<void>;
  compact?: boolean;
}`,
  },
  stripe: {
    questions: [
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
            label: '/billing/success?session_id={CHECKOUT_SESSION_ID} and /billing/pricing',
            description: 'Standard in-app receipt page with session polling.',
            isDefault: true,
          },
        ],
        selectedOptionId: 'opt-url-default',
        suggestedAnswer: '/billing/success?session_id={CHECKOUT_SESSION_ID} and /billing/pricing',
        status: 'pending',
      },
    ],
    baseline: {
      functionalRequirements: [
        'POST /api/v1/billing/checkout creates hosted Stripe Checkout Session',
        'POST /api/v1/billing/webhooks validates signature and syncs subscription state to DB',
        'PricingTable React component supports monthly/annual billing interval toggle',
      ],
      acceptanceCriteria: [
        'Invalid webhook signatures return HTTP 400 with signature verification error',
        'Duplicate webhook event IDs are ignored idempotently',
        'Pricing table displays dynamic pricing accurately',
      ],
      outOfScope: ['Invoicing for enterprise wire transfers', 'Tax ID auto-calculation via Stripe Tax'],
      compiledAt: new Date().toISOString(),
      approved: false,
    },
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/billing/checkout',
        description: 'Create Hosted Stripe Checkout Session for subscription tier',
        requestType: 'CheckoutSessionRequest',
        responseType: 'CheckoutSessionResponse',
        status: 201,
      },
      {
        method: 'POST',
        path: '/api/v1/billing/webhooks',
        description: 'Verify cryptographic Stripe signature and sync ledger state',
        requestType: 'RawBuffer',
        responseType: '{ received: boolean }',
        status: 200,
      },
    ],
    typesDefinition: `/**
 * AgentForge Frozen Contract: Stripe Checkout & Webhook Integration
 * Version: v2.1.0 (FROZEN)
 */

export interface CheckoutSessionRequest {
  tierId: 'starter' | 'pro' | 'enterprise';
  billingInterval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
  expiresAt: number;
}

export interface WebhookEventRecord {
  id: string;
  type: 'checkout.session.completed' | 'invoice.payment_failed';
  customerId: string;
  timestamp: number;
}`,
    componentProps: `export interface PricingTableProps {
  currentTier?: string;
  onSelectTier: (tierId: string, interval: 'monthly' | 'annual') => Promise<void>;
  isLoading?: boolean;
}`,
  },
  rbac: {
    questions: [
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
    ],
    baseline: {
      functionalRequirements: [
        'GET /api/v1/teams/:teamId/members returns list of team members with assigned roles',
        'PATCH /api/v1/teams/:teamId/members/:userId updates member role with hierarchical inheritance checks',
        'requirePermission middleware intercepts unprivileged requests and returns 403 Forbidden',
        'TeamMembersTable component displays member list with role dropdown for admins',
      ],
      acceptanceCriteria: [
        'Users with role Developer attempting role patch receive HTTP 403 ERR_FORBIDDEN',
        'Owner role cannot be removed without transferring ownership first',
        'Permission checks execute in memory under 2ms per request',
      ],
      outOfScope: ['Cross-workspace SSO Federation', 'SAML 2.0 Identity Provider integration'],
      compiledAt: new Date().toISOString(),
      approved: false,
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/teams/:teamId/members',
        description: 'Fetch team members with evaluated granular permissions',
        responseType: 'TeamMember[]',
        status: 200,
      },
      {
        method: 'PATCH',
        path: '/api/v1/teams/:teamId/members/:userId',
        description: 'Modify member role with hierarchical inheritance checks',
        requestType: 'UpdateRolePayload',
        responseType: 'TeamMember',
        status: 200,
      },
    ],
    typesDefinition: `/**
 * AgentForge Frozen Contract: Team RBAC & Permissions Matrix
 * Version: v1.1.0 (FROZEN)
 */

export type TeamRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface TeamMember {
  userId: string;
  email: string;
  role: TeamRole;
  permissions: string[];
  invitedAt: string;
}

export interface UpdateRolePayload {
  targetUserId: string;
  newRole: TeamRole;
}`,
    componentProps: `export interface TeamMembersTableProps {
  teamId: string;
  currentUserId: string;
  currentUserRole: TeamRole;
  onRoleChange: (targetUserId: string, newRole: TeamRole) => Promise<void>;
}`,
  },
  calculator: {
    questions: [
      {
        id: 'q-calc-1',
        category: 'mandatory',
        categoryLabel: 'Mandatory Clarification',
        question: 'What arithmetic operations and precision rounding model should the calculator enforce?',
        context: 'Prevents floating-point rounding errors and defines runtime operator precedence.',
        options: [
          {
            id: 'opt-calc-float',
            label: 'Standard 4-Operation with 10-Digit Floating-Point Rounding & Divide-by-Zero Guard',
            description: 'Accurately rounds IEEE 754 floating point (0.1 + 0.2 = 0.3) with runtime safety.',
            isDefault: true,
          },
          {
            id: 'opt-calc-scientific',
            label: 'Extended Scientific (Power, Square Root, Modulo, Parentheses)',
            description: 'Supports advanced mathematical functions and nested expression precedence.',
          },
        ],
        selectedOptionId: 'opt-calc-float',
        suggestedAnswer: 'Standard 4-Operation with 10-Digit Floating-Point Rounding & Divide-by-Zero Guard',
        status: 'pending',
      },
      {
        id: 'q-calc-2',
        category: 'material',
        categoryLabel: 'Material Design Decision',
        question: 'How should calculation history and memory registers (MC, MR, M+, M-) be handled?',
        context: 'Determines client-side memory storage and history recall behavior.',
        options: [
          {
            id: 'opt-mem-local',
            label: 'In-Memory State + LocalStorage Calculation History Drawer',
            description: 'Persists recent 50 calculations across page refreshes with click-to-recall.',
            isDefault: true,
          },
          {
            id: 'opt-mem-session',
            label: 'Ephemeral Session Memory Only',
            description: 'Clears on page refresh or browser restart.',
          },
        ],
        selectedOptionId: 'opt-mem-local',
        suggestedAnswer: 'In-Memory State + LocalStorage Calculation History Drawer',
        status: 'pending',
      },
      {
        id: 'q-calc-3',
        category: 'low_impact',
        categoryLabel: 'Low-Impact Defaults',
        question: 'Should keyboard input events (numpad, Enter, Escape) be bound to the keypad?',
        context: 'Improves accessibility and desktop productivity.',
        options: [
          {
            id: 'opt-key-global',
            label: 'Global Keyboard Listeners with Active Visual Keypad Feedback',
            description: 'Allows typing directly on physical keyboard with immediate visual button depressions.',
            isDefault: true,
          },
        ],
        selectedOptionId: 'opt-key-global',
        suggestedAnswer: 'Global Keyboard Listeners with Active Visual Keypad Feedback',
        status: 'pending',
      },
    ],
    baseline: {
      functionalRequirements: [
        'Calculator.tsx React component renders responsive numeric keypad (0-9, ., +, -, *, /, =)',
        'Dual-line display shows active equation, current input accumulator, and memory status',
        'Divide-by-zero safely returns "Cannot divide by zero" without crashing runtime',
        'Calculation history drawer allows reviewing and restoring past expressions',
      ],
      acceptanceCriteria: [
        'Floating point precision (0.1 + 0.2) evaluates accurately to 0.3',
        'Division by zero displays error state gracefully',
        'Keyboard shortcuts (0-9, +, -, *, /, Enter, Backspace, Escape) trigger corresponding actions',
      ],
      outOfScope: ['Symbolic algebraic factoring', '3D graphing curves and matrices'],
      compiledAt: new Date().toISOString(),
      approved: false,
    },
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/calculator/evaluate',
        description: 'Evaluate mathematical arithmetic expression with safe boundary checks',
        requestType: 'CalculationRequest',
        responseType: 'CalculationResult',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/calculator/history',
        description: 'Retrieve user calculation expression history ledger',
        responseType: 'CalculatorHistoryItem[]',
        status: 200,
      },
    ],
    typesDefinition: `/**
 * AgentForge Frozen Contract: Calculator & Arithmetic Protocol
 * Version: v1.0.0 (FROZEN)
 */

export interface CalculationRequest {
  expression: string;
  precision?: number;
}

export interface CalculationResult {
  expression: string;
  result: number;
  formatted: string;
  timestamp: string;
}`,
    componentProps: `export interface CalculatorProps {
  initialValue?: number;
  onCalculation?: (result: CalculationResult) => void;
  enableHistory?: boolean;
}`,
  },
};

/**
 * Generate 1 to 3 targeted clarification questions for a feature prompt.
 * First tries server-side Gemini API (/api/lead-architect/generate-qa).
 * If 503, network failure, or offline, falls back to domain dictionary or dynamic fallback.
 */
export async function generateClarificationQuestions(
  prompt: string
): Promise<PlanningQuestion[]> {
  const lowerPrompt = prompt.toLowerCase();

  // Try calling the server-side Gemini endpoint
  try {
    const res = await fetch('/api/lead-architect/generate-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (_err) {
    // Graceful fallback to local dictionary
  }

  // Domain dictionary match
  if (lowerPrompt.includes('stripe') || lowerPrompt.includes('billing') || lowerPrompt.includes('checkout') || lowerPrompt.includes('payment')) {
    return DOMAIN_FALLBACK_DICTIONARY.stripe.questions;
  }

  if (lowerPrompt.includes('rbac') || lowerPrompt.includes('role') || lowerPrompt.includes('permission') || lowerPrompt.includes('team')) {
    return DOMAIN_FALLBACK_DICTIONARY.rbac.questions;
  }

  if (lowerPrompt.includes('calc')) {
    return DOMAIN_FALLBACK_DICTIONARY.calculator.questions;
  }

  if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('session') || lowerPrompt.includes('jwt') || lowerPrompt.includes('user')) {
    return DOMAIN_FALLBACK_DICTIONARY.auth.questions;
  }

  // Dynamic generic fallback for arbitrary prompts
  return [
    {
      id: `q-dyn-1-${Date.now()}`,
      category: 'mandatory',
      categoryLabel: 'Mandatory Clarification',
      question: `What data persistence and boundary guarantee should be enforced for this feature?`,
      context: `Crucial for database indexing and transactional atomicity for: "${prompt.slice(0, 60)}..."`,
      options: [
        {
          id: 'opt-dyn-sql',
          label: 'PostgreSQL Relational Schema with Foreign Key Invariants',
          description: 'Strict schema with automated Drizzle/Prisma migrations and relational integrity.',
          isDefault: true,
        },
        {
          id: 'opt-dyn-cache',
          label: 'Redis In-Memory Key-Value Cache with Persistence',
          description: 'High throughput, low latency operations with background sync.',
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
      question: `How should client-server state synchronization be handled?`,
      context: 'Dictates whether the UI uses optimistic updates or strict request-response roundtrips.',
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
          description: 'Shows loading spinner until 200 OK received; no optimistic mutations.',
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
      question: `What error handling format should be adopted for failed operations?`,
      context: 'Determines the error shape returned to client consumers.',
      options: [
        {
          id: 'opt-dyn-envelope',
          label: 'Standard ApiErrorEnvelope with Unique Request Trace ID',
          description: 'Provides actionable debug tracing for frontend error boundaries.',
          isDefault: true,
        },
      ],
      selectedOptionId: 'opt-dyn-envelope',
      suggestedAnswer: 'Standard ApiErrorEnvelope with Unique Request Trace ID',
      status: 'pending',
    },
  ];
}

/**
 * Gate 1: Compile Requirements Baseline once questions are answered.
 */
export function compileRequirementsBaseline(
  prompt: string,
  questions: PlanningQuestion[],
  confirmedDecisions: string[]
): RequirementsBaseline {
  const lowerPrompt = prompt.toLowerCase();
  let base: RequirementsBaseline;

  if (lowerPrompt.includes('stripe') || lowerPrompt.includes('billing')) {
    base = { ...DOMAIN_FALLBACK_DICTIONARY.stripe.baseline };
  } else if (lowerPrompt.includes('rbac') || lowerPrompt.includes('role')) {
    base = { ...DOMAIN_FALLBACK_DICTIONARY.rbac.baseline };
  } else if (lowerPrompt.includes('calc')) {
    base = { ...DOMAIN_FALLBACK_DICTIONARY.calculator.baseline };
  } else {
    base = { ...DOMAIN_FALLBACK_DICTIONARY.auth.baseline };
  }

  // Augment baseline with answered questions
  const userAnswers = questions
    .filter((q) => q.status === 'confirmed' || q.userAnswer)
    .map((q) => `${q.categoryLabel}: ${q.userAnswer || q.suggestedAnswer}`);

  return {
    ...base,
    functionalRequirements: [
      ...base.functionalRequirements,
      ...userAnswers.slice(0, 2),
    ],
    acceptanceCriteria: [
      ...base.acceptanceCriteria,
      ...confirmedDecisions.map((d) => `Decision Invariant: ${d}`),
    ],
    compiledAt: new Date().toISOString(),
    approved: true,
  };
}

/**
 * Gate 2: Decompose Requirements into three isolated worker tasks.
 * Assigns strict allowed file paths to eliminate merge conflicts.
 */
export function decomposeTasks(
  baseline: RequirementsBaseline,
  contractVersion: string,
  featureDomain = 'auth'
): WorkerTask[] {
  const isAuth = featureDomain === 'auth';
  const isStripe = featureDomain === 'stripe';
  const isRbac = featureDomain === 'rbac';
  const isCalc = featureDomain === 'calculator' || featureDomain.includes('calc');

  const backendFiles = [
    'app/api/**/*',
    'src/server/**/*',
    ...(isAuth
      ? ['app/api/auth/login/route.ts', 'app/api/auth/session/route.ts', 'src/server/auth.ts', 'src/middleware/session.ts', 'src/routes/auth.ts']
      : isStripe
      ? ['src/routes/billing.ts', 'src/services/stripe.ts', 'src/middleware/stripeWebhook.ts']
      : isRbac
      ? ['src/routes/teams.ts', 'src/middleware/rbacGuard.ts', 'src/services/rbac.ts']
      : ['src/server/calculator.ts', 'src/routes/calculator.ts']),
  ];

  const frontendFiles = isAuth
    ? ['src/components/LoginForm.tsx', 'src/context/AuthContext.tsx', 'src/hooks/useSession.ts']
    : isStripe
    ? ['src/components/PricingTable.tsx', 'src/hooks/useCheckout.ts']
    : isRbac
    ? ['src/components/TeamMembersTable.tsx', 'src/hooks/useTeamRoles.ts']
    : ['src/components/Calculator.tsx', 'src/hooks/useCalculator.ts', 'src/components/HistoryDrawer.tsx'];

  const qaFiles = isAuth
    ? ['tests/auth.e2e.test.ts', 'tests/contracts/auth.spec.ts']
    : isStripe
    ? ['tests/billing/webhooks.spec.ts', 'tests/contracts/billing.spec.ts']
    : isRbac
    ? ['tests/security/rbac.spec.ts', 'tests/contracts/rbac.spec.ts']
    : ['tests/calculator.test.ts', 'tests/contracts/calc.spec.ts'];

  return [
    {
      id: 'task-lead-planning',
      title: 'Architectural Discovery & Contract Freezing',
      persona: 'lead',
      branch: `rfc/${featureDomain}-contract-spec`,
      status: 'awaiting_decision',
      permittedFiles: [`src/contracts/${featureDomain}.contract.ts`, `docs/rfc/${featureDomain}-spec.md`],
      contractVersion,
      progressPercent: 100,
      currentAction: 'Gate 1 & Gate 2 requirements compiled; awaiting Gate 3 contract freeze approval',
      modelConfig: getAgentEffectiveModelConfig('lead'),
    },
    {
      id: 'task-backend-isolated',
      title: 'API Routes, Handlers & Storage Middlewares',
      persona: 'backend',
      branch: 'feature/backend-api-routes',
      status: 'blocked_contract',
      permittedFiles: backendFiles,
      contractVersion,
      progressPercent: 0,
      currentAction: 'Blocked: Awaiting Gate 3 contract approval before coding',
      modelConfig: getAgentEffectiveModelConfig('backend'),
    },
    {
      id: 'task-frontend-isolated',
      title: 'Client UI Components, Hooks & State Providers',
      persona: 'frontend',
      branch: 'feature/frontend-ui-components',
      status: 'blocked_contract',
      permittedFiles: frontendFiles,
      contractVersion,
      progressPercent: 0,
      currentAction: 'Blocked: Awaiting Gate 3 contract approval before coding',
      modelConfig: getAgentEffectiveModelConfig('frontend'),
    },
    {
      id: 'task-qa-isolated',
      title: 'Vitest Unit, Integration & Contract Fuzzing Suite',
      persona: 'qa',
      branch: 'feature/qa-vitest-suite',
      status: 'blocked_contract',
      permittedFiles: qaFiles,
      contractVersion,
      progressPercent: 0,
      currentAction: 'Blocked: Awaiting Gate 3 contract approval before coding',
      modelConfig: getAgentEffectiveModelConfig('qa'),
    },
  ];
}

/**
 * Gate 3: Generate Interface Contract (types/contracts.ts)
 */
export function generateInterfaceContract(
  prompt: string,
  baseline: RequirementsBaseline,
  version = 'v1.4.0'
): ContractSchema {
  const lower = prompt.toLowerCase();
  let baseDict = DOMAIN_FALLBACK_DICTIONARY.auth;

  if (lower.includes('stripe') || lower.includes('billing')) {
    baseDict = DOMAIN_FALLBACK_DICTIONARY.stripe;
  } else if (lower.includes('rbac') || lower.includes('role')) {
    baseDict = DOMAIN_FALLBACK_DICTIONARY.rbac;
  } else if (lower.includes('calc')) {
    baseDict = DOMAIN_FALLBACK_DICTIONARY.calculator;
  }

  // Generate SHA-256 style hash for immutable contract ledger
  const simpleChecksum = `sha256:${Array.from(
    `${version}-${baseDict.endpoints.length}-${baseDict.typesDefinition.length}`
  )
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0)
    .toString(16)
    .padStart(8, '0')}7f83b102c0b4317a9e223c7104b2a47291ee5981a5f4c2813587bfa00192e4ab`.slice(0, 71);

  return {
    version,
    checksum: simpleChecksum,
    frozen: false, // Initially unfrozen until user approves Gate 3
    typesDefinition: baseDict.typesDefinition,
    componentProps: baseDict.componentProps,
    apiEndpoints: baseDict.endpoints,
  };
}
