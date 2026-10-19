import { PresetFeature, ContractSchema, PullRequestState, WorkerTask } from '../types/agentforge';

export const AUTH_CONTRACT: ContractSchema = {
  version: 'v1.4.0',
  checksum: 'sha256:4f8e9102c0b4317a9e223c7104b2a47291ee5981a5f4c2813587bfa00192e4ab',
  frozen: true,
  frozenAt: '2026-10-10T07:20:00Z',
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
  apiEndpoints: [
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
};

export const STRIPE_CONTRACT: ContractSchema = {
  version: 'v2.1.0',
  checksum: 'sha256:d834a8bf70912cb859238e8aa0194857b2c914e6723e410bca03f9011749581a',
  frozen: true,
  frozenAt: '2026-10-10T07:15:00Z',
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
  apiEndpoints: [
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
};

export const RBAC_CONTRACT: ContractSchema = {
  version: 'v1.1.0',
  checksum: 'sha256:9a32c7198bb4501a2384f9812734bca819034f8174aa912837bc901e83716a5c',
  frozen: true,
  frozenAt: '2026-10-10T07:10:00Z',
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
  apiEndpoints: [
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
};

export const CALCULATOR_CONTRACT: ContractSchema = {
  version: 'v1.0.0',
  checksum: 'sha256:7b21a8043c19d45e9081bcfa410982348a12903fe41bc89a71234901823ab12c',
  frozen: true,
  frozenAt: '2026-10-10T07:30:00Z',
  typesDefinition: `/**
 * AgentForge Frozen Contract: Calculator & Expression Engine
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
}

export interface CalculatorHistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: string;
}`,
  apiEndpoints: [
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
};

export const PRESET_FEATURES: Record<string, PresetFeature> = {
  auth: {
    id: 'auth',
    name: 'User Auth & Sessions',
    prompt: 'Implement secure user authentication with JWT/session cookies, login form validation, session provider hook, and integration tests adhering to contract v1.4.0.',
    decisions: [
      'Token storage: HttpOnly Secure session cookies with fallback Bearer header',
      'Password hashing: Argon2id with 64MB memory cost constraint',
      'Contract boundary: Strict type validation against frozen v1.4.0 schema',
    ],
    defaultCiFailure: false,
    contract: AUTH_CONTRACT,
    tasks: [
      {
        id: 'task-lead-1',
        title: 'Architectural Contract & RFC Freeze',
        persona: 'lead',
        branch: 'rfc/auth-protocol-v1.4',
        status: 'completed',
        permittedFiles: ['src/contracts/auth.contract.ts', 'docs/rfc/004-auth.md'],
        contractVersion: 'v1.4.0',
        progressPercent: 100,
        currentAction: 'Contract frozen & locked in ledger',
      },
      {
        id: 'task-backend-1',
        title: 'Session Middleware & Login Handler',
        persona: 'backend',
        branch: 'feature/backend-api-routes',
        status: 'awaiting_ci',
        permittedFiles: ['src/server/auth.ts', 'src/middleware/session.ts', 'src/routes/auth.ts'],
        contractVersion: 'v1.4.0',
        progressPercent: 100,
        currentAction: 'PR #104 opened; pushed 3 commits',
      },
      {
        id: 'task-frontend-1',
        title: 'LoginForm & Session React Context',
        persona: 'frontend',
        branch: 'feat/auth-frontend-components',
        status: 'awaiting_ci',
        permittedFiles: ['src/components/LoginForm.tsx', 'src/context/AuthContext.tsx', 'src/hooks/useSession.ts'],
        contractVersion: 'v1.4.0',
        progressPercent: 100,
        currentAction: 'PR #105 opened; waiting on GitHub Actions',
      },
      {
        id: 'task-qa-1',
        title: 'End-to-End Contract Conformance Tests',
        persona: 'qa',
        branch: 'test/auth-integration-suite',
        status: 'coding',
        permittedFiles: ['tests/auth.e2e.test.ts', 'tests/contracts/auth.spec.ts'],
        contractVersion: 'v1.4.0',
        progressPercent: 85,
        currentAction: 'Running contract fuzzing suite',
      },
    ],
    pullRequests: {
      'feature/backend-api-routes': {
        id: 'PR-104',
        title: 'feat(backend): Next.js App Router login route and session handler',
        branch: 'feature/backend-api-routes',
        baseSha: '9c812bf',
        headSha: 'e31d041',
        authorPersona: 'backend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        isScopeCompliant: false,
        scopeViolations: [
          {
            path: 'app/api/auth/login/route.ts',
            workerPersona: 'backend',
            permittedFiles: ['src/server/auth.ts', 'src/middleware/session.ts', 'src/routes/auth.ts'],
            reason: 'File "app/api/auth/login/route.ts" is outside worker permitted file scopes (src/server/auth.ts, src/middleware/session.ts, src/routes/auth.ts)',
          },
        ],
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 1420,
            logs: [
              '> react-example@0.0.0 lint',
              '> eslint app/api/auth/login/route.ts src/server/auth.ts src/middleware/session.ts --max-warnings=0',
              '✔ No ESLint warnings or errors detected in 3 files.',
              'All formatting rules satisfied.',
            ],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 2310,
            logs: [
              '> react-example@0.0.0 tsc --noEmit',
              'Checking project contracts against schema v1.4.0...',
              '✔ app/api/auth/login/route.ts conforms to AuthSessionResponse contract.',
              '✔ Return type matches status 200 payload envelope.',
              'Compilation complete with 0 errors.',
            ],
          },
          {
            id: 'step-3',
            name: 'Automated Test Suite',
            command: 'npm run test',
            status: 'success',
            durationMs: 3840,
            logs: [
              '> vitest run tests/server/auth.test.ts',
              'PASS tests/server/auth.test.ts (1.82s)',
              '  ✓ POST /api/auth/login validates email and passhash',
              '  ✓ Signs JWT with 24h expiration claim',
              '  ✓ Rejects invalid passhash with 401 code AUTH_INVALID_CREDENTIALS',
              'Test Suites: 1 passed, 1 total',
              'Tests:       3 passed, 3 total',
            ],
          },
        ],
        diffs: [
          {
            path: 'app/api/auth/login/route.ts',
            additions: 64,
            deletions: 0,
            isScopeViolation: true,
            patch: `@@ -0,0 +1,64 @@
+import { NextRequest, NextResponse } from 'next/server';
+import { LoginPayload, AuthSessionResponse, ApiErrorEnvelope } from '@/types/contracts';
+import { verifyPassword, signJwtSession } from '@/lib/auth-tokens';
+
+/**
+ * Next.js App Router Handler: POST /api/auth/login
+ * Strictly conforms to AgentForge Frozen Contract v1.4.0
+ */
+export async function POST(req: NextRequest) {
+  try {
+    const body: LoginPayload = await req.json();
+
+    if (!body.email || !body.passhash) {
+      const errPayload: ApiErrorEnvelope = {
+        code: 'ERR_VALIDATION_FAILED',
+        message: 'Email and passhash fields are mandatory.',
+        timestamp: new Date().toISOString(),
+        traceId: req.headers.get('x-request-id') || crypto.randomUUID(),
+      };
+      return NextResponse.json(errPayload, { status: 400 });
+    }
+
+    const user = await findUserInDatabase(body.email);
+    if (!user || !(await verifyPassword(body.passhash, user.passhash))) {
+      const errPayload: ApiErrorEnvelope = {
+        code: 'ERR_UNAUTHORIZED',
+        message: 'Invalid credentials supplied.',
+        timestamp: new Date().toISOString(),
+        traceId: crypto.randomUUID(),
+      };
+      return NextResponse.json(errPayload, { status: 401 });
+    }
+
+    const token = await signJwtSession(user, body.rememberMe);
+    const expiresInSeconds = body.rememberMe ? 86400 * 30 : 86400;
+
+    const responsePayload: AuthSessionResponse = {
+      token,
+      expiresInSeconds,
+      user: {
+        id: user.id,
+        email: user.email,
+        displayName: user.displayName,
+        roles: user.roles,
+        createdAt: user.createdAt,
+      },
+      refreshUuid: crypto.randomUUID(),
+    };
+
+    const res = NextResponse.json(responsePayload, { status: 200 });
+    res.cookies.set('session_token', token, {
+      httpOnly: true,
+      secure: process.env.NODE_ENV === 'production',
+      sameSite: 'lax',
+      maxAge: expiresInSeconds,
+      path: '/',
+    });
+    return res;
+  } catch (error: any) {
+    return NextResponse.json({ code: 'ERR_INTERNAL', message: error.message }, { status: 500 });
+  }
}`,
          },
          {
            path: 'src/server/auth.ts',
            additions: 68,
            deletions: 4,
            patch: `@@ -1,8 +1,72 @@
+ import { Router, Request, Response } from 'express';
+ -import { verifyPassword } from './utils';
+ +import { verifyPassword, signSessionToken } from './utils';
+import { LoginPayload, AuthSessionResponse, ApiErrorEnvelope } from '../types/contracts';

 export const authRouter = Router();

-authRouter.post('/login', async (req, res) => {
-  res.json({ status: 'not implemented' });
-});
+authRouter.post('/api/v1/auth/login', async (req: Request<{}, {}, LoginPayload>, res: Response<AuthSessionResponse | ApiErrorEnvelope>) => {
+  const { email, passhash, rememberMe } = req.body;
+
+  if (!email || !passhash) {
+    return res.status(400).json({
+      code: 'ERR_INVALID_BODY',
+      message: 'Both email and passhash are required credentials.',
+      timestamp: new Date().toISOString(),
+      traceId: req.headers['x-request-id'] as string || 'trace-001',
+    });
+  }
+
+  const user = await findUserByEmail(email);
+  if (!user || !(await verifyPassword(passhash, user.passhash))) {
+    return res.status(401).json({
+      code: 'ERR_UNAUTHORIZED',
+      message: 'Invalid credentials provided.',
+      timestamp: new Date().toISOString(),
+      traceId: req.headers['x-request-id'] as string || 'trace-001',
+    });
+  }
+
+  const token = await signSessionToken(user, rememberMe);
+  const expiresInSeconds = rememberMe ? 86400 * 30 : 86400;
+
+  return res.status(200).json({
+    token,
+    expiresInSeconds,
+    user: {
+      id: user.id,
+      email: user.email,
+      displayName: user.displayName,
+      roles: user.roles,
+      createdAt: user.createdAt,
+    },
+    refreshUuid: crypto.randomUUID(),
+});`,
          },
          {
            path: 'src/middleware/session.ts',
            additions: 34,
            deletions: 0,
            patch: `@@ -0,0 +1,34 @@
+import { Request, Response, NextFunction } from 'express';
+import { verifySessionToken } from '../server/utils';
+import { SessionUser } from '../types/contracts';
+
+declare global {
+  namespace Express {
+    interface Request {
+      user?: SessionUser;
+    }
+  }
+}
+
+export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
+  const authHeader = req.headers.authorization;
+  if (!authHeader?.startsWith('Bearer ')) {
+    return res.status(401).json({ code: 'ERR_NO_TOKEN', message: 'Bearer session required' });
+  }
+
+  const rawToken = authHeader.substring(7);
+  try {
+    const decoded = await verifySessionToken(rawToken);
+    req.user = decoded;
+    next();
+  } catch (err) {
+    return res.status(401).json({ code: 'ERR_EXPIRED_TOKEN', message: 'Session expired or corrupt' });
+  }
+}`,
          },
        ],
      },
      'feat/auth-frontend-components': {
        id: 'PR-105',
        title: 'feat(frontend): reactive login form and auth provider context',
        branch: 'feat/auth-frontend-components',
        baseSha: '9c812bf',
        headSha: 'f820c4a',
        authorPersona: 'frontend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 1100,
            logs: [
              '> eslint src/components/LoginForm.tsx src/context/AuthContext.tsx',
              '✔ Zero linting violations.',
            ],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 1980,
            logs: [
              '> tsc --noEmit',
              'Checking imports from types/contracts.ts...',
              '✔ AuthSessionResponse keys verified: { token, expiresInSeconds, user, refreshUuid }',
              '✔ Strict type boundaries matched with 0 warnings.',
            ],
          },
          {
            id: 'step-3',
            name: 'Automated Test Suite',
            command: 'npm run test',
            status: 'success',
            durationMs: 3200,
            logs: [
              '> vitest run tests/frontend/LoginForm.test.tsx',
              'PASS tests/frontend/LoginForm.test.tsx',
              '  ✓ Form displays error message on 401 response',
              '  ✓ Dispatches session token to AuthContext on 200 OK',
              'Test Suites: 1 passed, 1 total',
              'Tests:       2 passed, 2 total',
            ],
          },
        ],
        diffs: [
          {
            path: 'src/components/LoginForm.tsx',
            additions: 52,
            deletions: 6,
            patch: `@@ -1,12 +1,58 @@
 import React, { useState } from 'react';
 import { useAuth } from '../context/AuthContext';
+import { LoginPayload, AuthSessionResponse } from '../types/contracts';

-export function LoginForm() {
-  return <div>Login placeholder</div>;
-}
+export function LoginForm() {
+  const { setSession } = useAuth();
+  const [email, setEmail] = useState('');
+  const [password, setPassword] = useState('');
+  const [isSubmitting, setIsSubmitting] = useState(false);
+  const [errorMsg, setErrorMsg] = useState<string | null>(null);
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    setIsSubmitting(true);
+    setErrorMsg(null);
+
+    try {
+      const res = await fetch('/api/v1/auth/login', {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ email, passhash: password } as LoginPayload),
+      });
+
+      if (!res.ok) {
+        const errData = await res.json();
+        throw new Error(errData.message || 'Authentication failed');
+      }
+
+      const data: AuthSessionResponse = await res.json();
+      setSession(data.token, data.user);
+    } catch (err: any) {
+      setErrorMsg(err.message);
+    } finally {
+      setIsSubmitting(false);
+    }
+  };
+
+  return (
+    <form onSubmit={handleSubmit} className="space-y-4">
+      {errorMsg && <div className="text-rose-400 text-sm">{errorMsg}</div>}
+      <input
+        type="email"
+        value={email}
+        onChange={(e) => setEmail(e.target.value)}
+        placeholder="name@domain.com"
+        required
+      />
+      <input
+        type="password"
+        value={password}
+        onChange={(e) => setPassword(e.target.value)}
+        required
+      />
+      <button type="submit" disabled={isSubmitting}>Sign In</button>
+    </form>
+  );
+}`,
          },
          {
            path: 'src/context/AuthContext.tsx',
            additions: 44,
            deletions: 0,
            patch: `@@ -0,0 +1,44 @@
+import React, { createContext, useContext, useState, ReactNode } from 'react';
+import { SessionUser } from '../types/contracts';
+
+interface AuthState {
+  token: string | null;
+  user: SessionUser | null;
+  setSession: (token: string, user: SessionUser) => void;
+  clearSession: () => void;
+}
+
+const AuthContext = createContext<AuthState | undefined>(undefined);
+
+export function AuthProvider({ children }: { children: ReactNode }) {
+  const [token, setToken] = useState<string | null>(null);
+  const [user, setUser] = useState<SessionUser | null>(null);
+
+  const setSession = (t: string, u: SessionUser) => {
+    setToken(t);
+    setUser(u);
+    localStorage.setItem('auth_token', t);
+  };
+
+  const clearSession = () => {
+    setToken(null);
+    setUser(null);
+    localStorage.removeItem('auth_token');
+  };
+
+  return (
+    <AuthContext.Provider value={{ token, user, setSession, clearSession }}>
+      {children}
+    </AuthContext.Provider>
+  );
+}
+
+export function useAuth() {
+  const ctx = useContext(AuthContext);
+  if (!ctx) throw new Error('useAuth must be wrapped in AuthProvider');
+  return ctx;
+}`,
          },
        ],
      },
      'test/auth-integration-suite': {
        id: 'PR-106',
        title: 'test(qa): contract fuzzing and session invalidation test suites',
        branch: 'test/auth-integration-suite',
        baseSha: '9c812bf',
        headSha: 'a12b07e',
        authorPersona: 'qa',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 890,
            logs: ['> eslint tests/contracts/auth.spec.ts', '✔ Lint passed.'],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 1400,
            logs: ['> tsc --noEmit', '✔ All test assertions match contract types.'],
          },
          {
            id: 'step-3',
            name: 'Automated Test Suite',
            command: 'npm run test',
            status: 'success',
            durationMs: 4120,
            logs: [
              '> vitest run tests/contracts/auth.spec.ts',
              'PASS tests/contracts/auth.spec.ts',
              '  ✓ Contract schema checksum matches sha256:4f8e9102c0b4317a9e223c7104b2a47291ee5981a5f4c2813587bfa00192e4ab',
              '  ✓ Response structure strictly adheres to AuthSessionResponse fields',
              '  ✓ Rejects extra undocumented parameters in request body',
              'Test Suites: 1 passed, 1 total',
              'Tests:       3 passed, 3 total',
            ],
          },
        ],
        diffs: [
          {
            path: 'tests/contracts/auth.spec.ts',
            additions: 54,
            deletions: 0,
            patch: `@@ -0,0 +1,54 @@
+import { describe, it, expect } from 'vitest';
+import { AUTH_CONTRACT } from '../../src/contracts/auth.contract';
+
+describe('Contract Integrity: Auth Protocol v1.4.0', () => {
+  it('should enforce frozen contract status', () => {
+    expect(AUTH_CONTRACT.frozen).toBe(true);
+    expect(AUTH_CONTRACT.version).toBe('v1.4.0');
+  });
+
+  it('should validate endpoint declarations against OpenAPI table', () => {
+    const paths = AUTH_CONTRACT.apiEndpoints.map(e => e.path);
+    expect(paths).toContain('/api/v1/auth/login');
+    expect(paths).toContain('/api/v1/auth/session');
+    expect(paths).toContain('/api/v1/auth/logout');
+  });
+});`,
          },
        ],
      },
    },
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe Checkout',
    prompt: 'Implement Stripe Checkout session creation endpoint, webhook cryptographic signature verification, pricing tier selector UI, and contract tests.',
    decisions: [
      'Stripe API version: 2024-04-10 with idempotency keys on payment intents',
      'Webhook replay protection: 5-minute timestamp tolerance window',
      'Contract boundary: Strict type validation against frozen v2.1.0 schema',
    ],
    defaultCiFailure: false,
    contract: STRIPE_CONTRACT,
    tasks: [
      {
        id: 'task-lead-stripe',
        title: 'Architectural Contract & Webhook Spec',
        persona: 'lead',
        branch: 'rfc/billing-stripe-v2.1',
        status: 'completed',
        permittedFiles: ['src/contracts/billing.contract.ts'],
        contractVersion: 'v2.1.0',
        progressPercent: 100,
        currentAction: 'Contract locked & published',
      },
      {
        id: 'task-backend-stripe',
        title: 'Checkout API & Signature Guard',
        persona: 'backend',
        branch: 'feat/stripe-backend-routes',
        status: 'awaiting_ci',
        permittedFiles: ['src/routes/billing.ts', 'src/services/stripe.ts'],
        contractVersion: 'v2.1.0',
        progressPercent: 100,
        currentAction: 'PR #112 created',
      },
      {
        id: 'task-frontend-stripe',
        title: 'Pricing Plan Grid & Checkout Button',
        persona: 'frontend',
        branch: 'feat/stripe-pricing-ui',
        status: 'awaiting_ci',
        permittedFiles: ['src/components/PricingTable.tsx', 'src/hooks/useCheckout.ts'],
        contractVersion: 'v2.1.0',
        progressPercent: 100,
        currentAction: 'PR #113 created',
      },
      {
        id: 'task-qa-stripe',
        title: 'Webhook Replay & Payload Invariants',
        persona: 'qa',
        branch: 'test/stripe-webhook-e2e',
        status: 'completed',
        permittedFiles: ['tests/billing/webhooks.spec.ts'],
        contractVersion: 'v2.1.0',
        progressPercent: 100,
        currentAction: 'All webhook mock signatures passed',
      },
    ],
    pullRequests: {
      'feat/stripe-backend-routes': {
        id: 'PR-112',
        title: 'feat(billing): stripe session factory and signature handler',
        branch: 'feat/stripe-backend-routes',
        baseSha: '110d9af',
        headSha: '4c870e2',
        authorPersona: 'backend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 1200,
            logs: ['> eslint src/routes/billing.ts', '✔ Clean lint pass.'],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 2100,
            logs: ['> tsc --noEmit', '✔ CheckoutSessionRequest and Response matches schema v2.1.0.'],
          },
          {
            id: 'step-3',
            name: 'Automated Test Suite',
            command: 'npm run test',
            status: 'success',
            durationMs: 3400,
            logs: ['> vitest run tests/billing.test.ts', 'PASS tests/billing.test.ts (2 passed)'],
          },
        ],
        diffs: [
          {
            path: 'src/routes/billing.ts',
            additions: 48,
            deletions: 2,
            patch: `@@ -1,5 +1,51 @@
 import { Router } from 'express';
+import { CheckoutSessionRequest, CheckoutSessionResponse } from '../types/contracts';
+import { stripeClient } from '../services/stripe';

 export const billingRouter = Router();

+billingRouter.post('/api/v1/billing/checkout', async (req, res) => {
+  const { tierId, billingInterval, successUrl, cancelUrl } = req.body as CheckoutSessionRequest;
+  
+  const session = await stripeClient.checkout.sessions.create({
+    mode: 'subscription',
+    line_items: [{ price: getPriceId(tierId, billingInterval), quantity: 1 }],
+    success_url: successUrl,
+    cancel_url: cancelUrl,
+  });
+
+  return res.status(201).json({
+    sessionId: session.id,
+    checkoutUrl: session.url!,
+    expiresAt: session.expires_at,
+  } as CheckoutSessionResponse);
+});`,
          },
        ],
      },
    },
  },
  rbac: {
    id: 'rbac',
    name: 'Team RBAC',
    prompt: 'Implement role-based access control with owner, admin, developer, and viewer permission hierarchy, permission guard middleware, and team members table.',
    decisions: [
      'Role inheritance: owner > admin > developer > viewer',
      'Audit logging: Log every permission elevation event with actor ID',
      'Contract boundary: Strict type validation against frozen v1.1.0 schema',
    ],
    defaultCiFailure: false,
    contract: RBAC_CONTRACT,
    tasks: [
      {
        id: 'task-lead-rbac',
        title: 'RBAC Permission Matrix Definition',
        persona: 'lead',
        branch: 'rfc/team-rbac-v1.1',
        status: 'completed',
        permittedFiles: ['src/contracts/rbac.contract.ts'],
        contractVersion: 'v1.1.0',
        progressPercent: 100,
        currentAction: 'Permissions matrix verified',
      },
      {
        id: 'task-backend-rbac',
        title: 'Team Role Guard & Members API',
        persona: 'backend',
        branch: 'feat/rbac-routes',
        status: 'awaiting_ci',
        permittedFiles: ['src/routes/teams.ts', 'src/middleware/rbacGuard.ts'],
        contractVersion: 'v1.1.0',
        progressPercent: 100,
        currentAction: 'PR #120 open',
      },
      {
        id: 'task-frontend-rbac',
        title: 'Team Member Role Switcher UI',
        persona: 'frontend',
        branch: 'feat/rbac-team-ui',
        status: 'awaiting_ci',
        permittedFiles: ['src/components/TeamMembersTable.tsx'],
        contractVersion: 'v1.1.0',
        progressPercent: 100,
        currentAction: 'PR #121 open',
      },
      {
        id: 'task-qa-rbac',
        title: 'Privilege Escalation Security Suite',
        persona: 'qa',
        branch: 'test/rbac-security-audit',
        status: 'coding',
        permittedFiles: ['tests/security/rbac.spec.ts'],
        contractVersion: 'v1.1.0',
        progressPercent: 90,
        currentAction: 'Testing denial on unprivileged actors',
      },
    ],
    pullRequests: {
      'feat/rbac-routes': {
        id: 'PR-120',
        title: 'feat(rbac): team role patch endpoint and hierarchical guard',
        branch: 'feat/rbac-routes',
        baseSha: '7f9104b',
        headSha: '2d8471e',
        authorPersona: 'backend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 950,
            logs: ['> eslint src/routes/teams.ts', '✔ Clean.'],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 1800,
            logs: ['> tsc --noEmit', '✔ Matches v1.1.0 contract.'],
          },
          {
            id: 'step-3',
            name: 'Automated Test Suite',
            command: 'npm run test',
            status: 'success',
            durationMs: 2900,
            logs: ['> vitest run tests/security/rbac.spec.ts', 'PASS tests/security/rbac.spec.ts (4 passed)'],
          },
        ],
        diffs: [
          {
            path: 'src/routes/teams.ts',
            additions: 42,
            deletions: 1,
            patch: `@@ -1,4 +1,45 @@
 import { Router } from 'express';
+import { requirePermission } from '../middleware/rbacGuard';
+import { TeamMember, UpdateRolePayload } from '../types/contracts';

 export const teamsRouter = Router();

+teamsRouter.patch('/api/v1/teams/:teamId/members/:userId', requirePermission('team:manage_roles'), async (req, res) => {
+  const { newRole } = req.body as UpdateRolePayload;
+  const updatedMember = await updateMemberRole(req.params.teamId, req.params.userId, newRole);
+  return res.json(updatedMember);
+});`,
          },
        ],
      },
    },
  },
  calculator: {
    id: 'calculator',
    name: 'Modern Calculator UI',
    prompt: 'Build a responsive, modern Calculator application with standard arithmetic operations (+, -, *, /), floating-point precision handling, expression history ledger, and keyboard shortcut listeners.',
    decisions: [
      'Engine precision: IEEE 754 floating-point rounding to 10 decimal digits',
      'Display architecture: Dual-line display with active equation and intermediate accumulator',
      'Component boundary: Isolated Calculator.tsx with useCalculator hook and HistoryDrawer',
    ],
    defaultCiFailure: false,
    contract: CALCULATOR_CONTRACT,
    tasks: [
      {
        id: 'task-lead-calc',
        title: 'Architectural Contract & Arithmetic Spec',
        persona: 'lead',
        branch: 'rfc/calculator-engine-v1.0',
        status: 'completed',
        permittedFiles: ['src/contracts/calculator.contract.ts', 'docs/rfc/005-calc.md'],
        contractVersion: 'v1.0.0',
        progressPercent: 100,
        currentAction: 'Contract frozen & locked in ledger',
      },
      {
        id: 'task-backend-calc',
        title: 'Arithmetic Evaluation API & History Ledger',
        persona: 'backend',
        branch: 'feature/backend-api-routes',
        status: 'awaiting_ci',
        permittedFiles: ['src/server/calculator.ts', 'src/routes/calculator.ts'],
        contractVersion: 'v1.0.0',
        progressPercent: 100,
        currentAction: 'PR #104 opened; arithmetic parser validated',
      },
      {
        id: 'task-frontend-calc',
        title: 'Calculator UI, Keypad & History Drawer',
        persona: 'frontend',
        branch: 'feature/frontend-ui-components',
        status: 'awaiting_ci',
        permittedFiles: ['src/components/Calculator.tsx', 'src/hooks/useCalculator.ts', 'src/components/HistoryDrawer.tsx'],
        contractVersion: 'v1.0.0',
        progressPercent: 100,
        currentAction: 'PR #105 opened; keypad & display rendered',
      },
      {
        id: 'task-qa-calc',
        title: 'Arithmetic Edge Cases & Fuzzing Suite',
        persona: 'qa',
        branch: 'feature/qa-vitest-suite',
        status: 'coding',
        permittedFiles: ['tests/calculator.test.ts', 'tests/contracts/calc.spec.ts'],
        contractVersion: 'v1.0.0',
        progressPercent: 90,
        currentAction: 'Running divide-by-zero & precision assertions',
      },
    ],
    pullRequests: {
      'feature/backend-api-routes': {
        id: 'PR-104',
        title: 'feat(backend): Calculator evaluation API and history endpoint',
        branch: 'feature/backend-api-routes',
        baseSha: '9c812bf',
        headSha: 'e31d041',
        authorPersona: 'backend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        isScopeCompliant: true,
        scopeViolations: [],
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 1200,
            logs: ['✔ No ESLint warnings in src/server/calculator.ts', 'All formatting rules satisfied.'],
          },
          {
            id: 'step-2',
            name: 'TypeScript Contract Verification',
            command: 'tsc --noEmit',
            status: 'success',
            durationMs: 1900,
            logs: ['Checking calculator contracts against schema v1.0.0...', 'Compilation complete with 0 errors.'],
          },
        ],
        diffs: [
          {
            path: 'src/server/calculator.ts',
            additions: 45,
            deletions: 0,
            patch: '@@ -0,0 +1,45 @@\n+export function evaluateExpression(expr: string) { return eval(expr); }',
          },
        ],
      },
      'feature/frontend-ui-components': {
        id: 'PR-105',
        title: 'feat(frontend): Calculator component and interactive keypad',
        branch: 'feature/frontend-ui-components',
        baseSha: '9c812bf',
        headSha: 'd91a082',
        authorPersona: 'frontend',
        ciStatus: 'success',
        reviewStatus: 'unreviewed',
        isScopeCompliant: true,
        scopeViolations: [],
        ciLogs: [
          {
            id: 'step-1',
            name: 'Lint & Formatting Checks',
            command: 'npm run lint',
            status: 'success',
            durationMs: 1100,
            logs: ['✔ No ESLint warnings in src/components/Calculator.tsx'],
          },
        ],
        diffs: [
          {
            path: 'src/components/Calculator.tsx',
            additions: 98,
            deletions: 0,
            patch: '@@ -0,0 +1,98 @@\n+export function Calculator() { return <div className="calculator">Calculator UI</div>; }',
          },
        ],
      },
    },
  },
};

export const INITIAL_ACTIVITY_LOGS = [
  {
    id: 'evt-1',
    timestamp: '07:22:04',
    agent: 'system' as const,
    message: 'AgentForge orchestration session initialized. Repository core-service connected to virtual sandbox.',
    metadata: { level: 'info' as const },
  },
  {
    id: 'evt-2',
    timestamp: '07:22:15',
    agent: 'lead' as const,
    message: 'Lead Architect initiated requirement discovery: analyzed prompt for user session protocol.',
    metadata: { level: 'info' as const },
  },
  {
    id: 'evt-3',
    timestamp: '07:22:28',
    agent: 'lead' as const,
    message: 'Frozen Contract v1.4.0 locked with SHA256 checksum sha256:4f8e9102c0b4317a9e223c7104b2a47291ee5981a5f4c2813587bfa00192e4ab.',
    metadata: { level: 'success' as const },
  },
  {
    id: 'evt-4',
    timestamp: '07:22:31',
    agent: 'system' as const,
    message: 'Partitioned work trees. Dispatched 3 parallel workers with strict file access control boundaries.',
    metadata: { level: 'info' as const },
  },
  {
    id: 'evt-5',
    timestamp: '07:22:45',
    agent: 'backend' as const,
    message: 'Backend Worker branched feature/backend-api-routes: generated Next.js App Router login handler app/api/auth/login/route.ts.',
    metadata: { branch: 'feature/backend-api-routes', level: 'info' as const },
  },
  {
    id: 'evt-6',
    timestamp: '07:22:52',
    agent: 'frontend' as const,
    message: 'Frontend Worker branched feat/auth-frontend-components: implemented LoginForm & AuthProvider context.',
    metadata: { branch: 'feat/auth-frontend-components', level: 'info' as const },
  },
  {
    id: 'evt-7',
    timestamp: '07:23:02',
    agent: 'webhook' as const,
    message: 'GitHub Actions triggered for PR #104: Automated Scope Violation flagged on app/api/auth/login/route.ts. Merge blocked.',
    metadata: { branch: 'feature/backend-api-routes', level: 'warn' as const },
  },
];
