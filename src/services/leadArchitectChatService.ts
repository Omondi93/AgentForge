import {
  ArchitectChatMessage,
  ArchitectExtractedUpdates,
  ContractSchema,
  RequirementsBaseline,
  WorkerTask,
  ApiEndpointSchema,
  CrewRecommendation,
} from '../types/agentforge';

/**
 * Lead Architect Gemini system instructions:
 * Evaluates intent first, distinguishing General Knowledge Mode vs Feature Building Mode.
 */
export const LEAD_ARCHITECT_SYSTEM_INSTRUCTION = `You are the Lead Principal Software Architect for AgentForge, an autonomous multi-agent engineering platform.
You are in a human-in-the-loop consultation with an engineering stakeholder or product builder.

Project Context:
- Current active feature: "\${prompt || 'No active feature specified yet'}"
- Contract Version: \${contract?.version || 'v1.4.0'}

STEP 1: EVALUATE USER INTENT (Contextual Awareness)
Before responding, classify the user's latest message into one of two modes:

MODE 1: GENERAL KNOWLEDGE & CONCEPTUAL INQUIRY
Trigger when the user asks an educational, conceptual, theoretical, or general question (e.g., "what is RBAC?", "how do cookies work?", "explain JWT", "what is CSRF?", "how does OAuth work?", "what's the difference between sessions and tokens?").
- Tone: Approachable, conversational, concise, and helpful—like an experienced, friendly senior staff engineer talking to a teammate.
- Behavior:
  * Provide a clear, intuitive explanation with practical real-world context and bullet points if helpful.
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
  "reply": "Markdown formatted response tailored to the active mode",
  "suggestedReplies": ["short chip 1", "short chip 2", "short chip 3"],
  "extractedUpdates": {
    "functionalRequirements": ["new requirement if feature building"],
    "acceptanceCriteria": ["new acceptance criteria if feature building"],
    "outOfScope": ["out of scope items if feature building"],
    "contractDiffNote": "one sentence describing the contract change if feature building"
  }
}
Note: If mode is "general_knowledge", extractedUpdates MUST be empty.`;

/**
 * Contextual Intent Evaluator:
 * Distinguishes general educational/conceptual questions from explicit feature building requests.
 */
export function evaluateUserIntent(userText: string): 'general_knowledge' | 'feature_building' {
  const text = (userText || '').trim().toLowerCase();

  if (!text) return 'general_knowledge';

  // Explicit feature building verbs and requests
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
    text.includes('write the code') ||
    text.includes('freeze contract') ||
    text.includes('approve contract') ||
    text.includes("let's build") ||
    text.includes('lets build') ||
    text.includes('i want to build') ||
    text.includes('i need to build') ||
    text.includes('update contract') ||
    text.includes('switch to hybrid') ||
    text.includes('change the contract') ||
    text.includes('add endpoint') ||
    text.includes('make a');

  // Question indicators
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
    text.startsWith('who is') ||
    text.endsWith('?');

  // If it matches a question pattern and does not explicitly request building a feature
  if (isQuestionPattern && !hasExplicitBuildIntent) {
    return 'general_knowledge';
  }

  // Pure concepts or keywords without build intent
  const standaloneConcepts = ['rbac', 'cookies', 'cookie', 'jwt', 'csrf', 'oauth', 'webhooks', 'webhook', 'rate limiting', 'sso'];
  if (standaloneConcepts.includes(text)) {
    return 'general_knowledge';
  }

  if (hasExplicitBuildIntent) {
    return 'feature_building';
  }

  // If neither, but ends with '?', treat as question
  if (text.endsWith('?')) {
    return 'general_knowledge';
  }

  return 'feature_building';
}

/**
 * Initial empty state welcome message from Lead Architect
 */
export function getWelcomeChatMessage(): ArchitectChatMessage {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    id: 'msg-welcome-0',
    sender: 'lead',
    content: `Hello! What feature would you like to build today?

You can describe your desired full-stack feature (e.g., *User Authentication with JWT session cookies*, *Stripe Checkout with webhook subscriptions*, or *Team RBAC matrix*) or select one of the Architectural Suggestions above to begin architectural discovery.

Feel free to also ask general engineering questions like *"What is RBAC?"* or *"How do cookies work?"*!`,
    timestamp,
    suggestedReplies: [
      'Build user authentication with JWT session cookies',
      'Implement Stripe Checkout with automated webhooks',
      'Set up Team RBAC with hierarchical permissions',
      'What is RBAC and how does it work?',
    ],
  };
}

/**
 * Default initial greeting and architectural consultation openers per preset domain
 */
export function getInitialChatMessages(prompt: string): ArchitectChatMessage[] {
  const lower = prompt.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (lower.includes('stripe') || lower.includes('billing')) {
    return [
      {
        id: 'msg-init-1',
        sender: 'lead',
        content: `👋 **Welcome to Architectural Discovery for Stripe Billing & Webhook Subscriptions.**

I've drafted the initial design based on your prompt:
- **Webhook Invariant:** Raw buffer HMAC SHA-256 verification with a 5-minute replay tolerance window.
- **Billing Strategy:** Monthly & Annual tiers with 14-day automated trial period.
- **Idempotency:** Background event queue with Stripe event ID deduplication.

You can challenge any decision, ask about payment state machines, or request adjustments to our interface contract below.`,
        timestamp,
        suggestedReplies: [
          'Why use raw buffer verification instead of JSON parsing?',
          'How do we handle duplicate webhook events?',
          'Can we add a free tier with usage metered limits?',
          'Let\'s freeze the contract and begin worker coding',
        ],
      },
    ];
  }

  if (lower.includes('rbac') || lower.includes('role') || lower.includes('permission')) {
    return [
      {
        id: 'msg-init-1',
        sender: 'lead',
        content: `👋 **Lead Architect online for Team RBAC & Permissions Matrix.**

Initial architecture synthesis:
- **Hierarchy:** Strict 4-tier model (\`owner\` > \`admin\` > \`developer\` > \`viewer\`).
- **Audit Trail:** Append-only PostgreSQL audit log recording actor ID, timestamp, and previous role.
- **Guardrail:** Owner role cannot be revoked without explicit transfer ceremony.

What architectural trade-offs would you like to review or modify?`,
        timestamp,
        suggestedReplies: [
          'Can we add fine-grained resource permissions like repo:write?',
          'What happens if a Developer tries to escalate their own role?',
          'Should invitations expire after 48 hours?',
          'Approve baseline and freeze contract v1.1.0',
        ],
      },
    ];
  }

  if (lower.includes('calc')) {
    return [
      {
        id: 'msg-init-1',
        sender: 'lead',
        content: `👋 **Lead Architect online for Modern Calculator UI & Arithmetic Engine.**

Initial architecture synthesis:
- **Precision Invariant:** IEEE 754 floating-point rounding to 10 decimal digits to eliminate 0.1 + 0.2 precision glitches.
- **Runtime Safety:** Division by zero safely displays "Cannot divide by zero" without unhandled exceptions.
- **Component Boundary:** Isolated Calculator.tsx with responsive keypad, memory accumulator, and calculation history drawer.

What mathematical operations or layout trade-offs would you like to review?`,
        timestamp,
        suggestedReplies: [
          'Can we add memory buttons like M+, M-, and MR?',
          'How do we handle keyboard input shortcuts for Enter and Escape?',
          'Should calculation history be saved in localStorage?',
          'Freeze contract v1.0.0 and begin worker coding',
        ],
      },
    ];
  }

  // Default: Auth
  return [
    {
      id: 'msg-init-1',
      sender: 'lead',
      content: `👋 **Lead Architect online.** I am evaluating your feature requirements:
*"${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"*

Key architectural decisions currently proposed:
1. **Token Transport:** \`HttpOnly SameSite=Strict\` cookies + Anti-CSRF double-submit token (shields against XSS token exfiltration).
2. **Session Lifespan:** 24-hour sliding window with single-use refresh token rotation.
3. **Error Protocol:** Standardized \`ApiErrorEnvelope\` with unique \`traceId\`.

Feel free to challenge these choices, request Google OAuth / 2FA, or ask for clarifications!`,
      timestamp,
      suggestedReplies: [
        'Why use HttpOnly cookies instead of Bearer headers?',
        'Can we add rate limiting to /api/v1/auth/login?',
        'Let\'s add Google OAuth social login support',
        'What is our defense against brute force attacks?',
        'Looks solid, let\'s freeze the contract and start workers',
      ],
    },
  ];
}

/**
 * Local architectural knowledge base fallback for instant intelligent responses.
 * Distinctly separates General Knowledge Mode from Feature Building Mode.
 */
function generateLocalArchitecturalResponse(
  userText: string,
  prompt: string,
  _baseline: RequirementsBaseline | null,
  _contract: ContractSchema,
  _tasks: WorkerTask[]
): {
  reply: string;
  suggestedReplies: string[];
  extractedUpdates?: ArchitectExtractedUpdates;
} {
  const text = (userText || '').toLowerCase().trim();
  const intent = evaluateUserIntent(userText);

  // =========================================================================
  // MODE 1: GENERAL KNOWLEDGE & CONCEPTUAL INQUIRIES
  // Natural, conversational, approachable. NO requirements injected.
  // =========================================================================
  if (intent === 'general_knowledge') {
    // 1. RBAC explanation
    if (text.includes('rbac') || text.includes('role') || text.includes('permission')) {
      return {
        reply: `**Role-Based Access Control (RBAC)** is a security model where permissions are assigned to specific *roles* rather than directly to individual users. Users are then granted membership in one or more roles.

Here is how it typically works in real-world systems:
- **Roles:** For example: \`Owner\`, \`Admin\`, \`Developer\`, and \`Viewer\`.
- **Permissions:** Granular capabilities like \`repo:read\`, \`repo:write\`, \`billing:manage\`, or \`users:invite\`.
- **Why it scales:** When a new engineer joins the team, you simply assign them the \`Developer\` role rather than granting 20 individual permissions one by one. If someone leaves or changes teams, updating their role instantly updates their access across the entire app.
- **Architectural Best Practice:** Enforce role checks at the middleware layer before touching database records, and keep the hierarchy simple (3–5 tiers is plenty for most applications).

Would you like to build an RBAC matrix for this project, or explore how it compares to Attribute-Based Access Control (ABAC)?`,
        suggestedReplies: [
          'Let\'s build an RBAC matrix for this project',
          'How does RBAC compare to ABAC?',
          'Can a user have multiple roles simultaneously?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 2. Cookies explanation
    if (text.includes('cookie') || text.includes('httponly') || text.includes('samesite')) {
      return {
        reply: `**HTTP Cookies** are small key-value pairs that a web server asks the browser to store via the \`Set-Cookie\` response header. The browser then automatically attaches this data to future HTTP requests going to that same domain.

Here is why they are essential for secure web authentication:
1. **Automatic Transport:** Once set, the browser sends the cookie on every API request without client-side JavaScript having to manage authorization headers.
2. **HttpOnly Flag:** Completely blocks JavaScript from accessing \`document.cookie\`. If your app ever has a cross-site scripting (XSS) vulnerability, an attacker cannot steal session tokens stored in HttpOnly cookies.
3. **Secure Flag:** Ensures cookies are only transmitted over encrypted HTTPS connections.
4. **SameSite Flag (\`Strict\` or \`Lax\`):** Instructs the browser whether to send the cookie on cross-site requests, protecting against Cross-Site Request Forgery (CSRF).

Would you like to configure HttpOnly session cookies for our authentication system?`,
        suggestedReplies: [
          'Build authentication with HttpOnly cookies',
          'Why avoid storing tokens in localStorage?',
          'What is the difference between SameSite Strict and Lax?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 3. JWT explanation
    if (text.includes('jwt') || text.includes('json web token')) {
      return {
        reply: `A **JSON Web Token (JWT)** is an open standard (RFC 7519) for securely transmitting information between parties as a compact, URL-safe JSON object.

A JWT consists of three parts separated by dots (\`header.payload.signature\`):
1. **Header:** Identifies the signing algorithm (e.g., \`HS256\` or \`RS256\`) and token type.
2. **Payload:** The claims or user metadata (e.g., \`userId\`, \`role\`, and expiration timestamp \`exp\`).
3. **Signature:** Cryptographically verifies that the payload wasn't tampered with.

- **Stateless Verification:** The backend server can verify the token's validity using only the secret/public key, without hitting a database on every request.
- **Trade-off:** Because it is stateless, revoking a leaked JWT immediately requires maintaining a token denylist or using short token lifespans with refresh token rotation.

Would you like to implement JWT session tokens for this project?`,
        suggestedReplies: [
          'Implement JWT authentication with refresh token rotation',
          'How do we handle JWT token revocation?',
          'What is the difference between HS256 and RS256?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 4. CSRF explanation
    if (text.includes('csrf') || text.includes('cross-site')) {
      return {
        reply: `**Cross-Site Request Forgery (CSRF)** is an attack where a malicious website tricks a user's browser into executing an unauthorized action on a trusted application where the user is currently logged in.

For example:
- You are logged into \`mybank.com\` with session cookies.
- You visit an untrusted site \`evil.com\`, which has a hidden form targeting \`mybank.com/transfer\`.
- Because browsers automatically include cookies for that domain, the unauthorized transfer request succeeds unless CSRF defenses are in place!

**How we protect against it:**
- **SameSite Cookies:** Using \`SameSite=Lax\` or \`SameSite=Strict\` prevents cookies from being attached to cross-origin mutating requests.
- **Anti-CSRF Tokens:** Requiring a unique cryptographic token (via header \`X-CSRF-Token\`) on state-changing requests (\`POST\`, \`PUT\`, \`DELETE\`).

Would you like to add anti-CSRF token verification to our API?`,
        suggestedReplies: [
          'Add anti-CSRF token middleware to the API',
          'How does the double-submit cookie pattern work?',
          'Does CORS protect against CSRF?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 5. OAuth explanation
    if (text.includes('oauth') || text.includes('social login') || text.includes('sso')) {
      return {
        reply: `**OAuth 2.0** is an industry-standard authorization framework that enables third-party applications to obtain limited access to a user's account on an HTTP service (like Google, GitHub, or Apple) without sharing passwords.

Here's the standard authorization flow (Authorization Code with PKCE):
1. **User redirects:** The user clicks "Sign in with Google" and is redirected to Google's consent screen.
2. **Authorization Code:** Google redirects back to your callback URL with a temporary authorization code.
3. **Token Exchange:** Your backend exchanges that code for an ID Token and Access Token directly with Google's servers.
4. **Local Session:** Your application verifies the token and issues its own local session cookie.

Would you like to implement Google OAuth social login for this application?`,
        suggestedReplies: [
          'Implement Google OAuth login for our application',
          'What is PKCE and why is it recommended?',
          'How do we link email/password and OAuth accounts?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 6. Webhooks explanation
    if (text.includes('webhook')) {
      return {
        reply: `A **Webhook** is an automated 'reverse API' HTTP POST callback that a service sends to your server when an event occurs in their system.

Rather than your server polling an API every few seconds asking *"Are there any new orders?"*, the service pushes data to your designated URL immediately when the event happens.

- **Example:** When a customer completes checkout on Stripe, Stripe sends a webhook payload to \`https://your-domain.com/api/webhooks/stripe\`.
- **Architectural Requisites:**
  1. **Signature Verification:** Always verify the cryptographic HMAC signature in the headers using your webhook signing secret.
  2. **Idempotency:** Track event IDs in your database so duplicate webhook deliveries don't process payments or send emails twice.
  3. **Fast ACK:** Return \`HTTP 200 OK\` within a few seconds, handling long-running work asynchronously.

Would you like to set up a Stripe webhook handler with signature verification?`,
        suggestedReplies: [
          'Implement Stripe webhook handler with signature verification',
          'How do we handle duplicate webhook events?',
          'How do we test webhooks locally with Vitest?',
        ],
        extractedUpdates: undefined,
      };
    }

    // 7. Rate Limiting explanation
    if (text.includes('rate limit') || text.includes('throttle') || text.includes('ddos')) {
      return {
        reply: `**Rate Limiting** is a traffic management strategy that restricts the number of requests a user or client can make to an API within a defined window of time.

- **Why it matters:** It stops brute force credential attacks on \`/api/login\`, prevents API scraping, and protects downstream databases from sudden spikes in traffic.
- **Common Algorithms:**
  - **Sliding Window Log/Counter:** Smooths traffic without sharp burst windows.
  - **Token Bucket:** Allows controlled short bursts while keeping the long-term rate capped.
- **HTTP Response:** When the threshold is exceeded, the server returns \`HTTP 429 Too Many Requests\` with a \`Retry-After: 60\` header.

Would you like to add rate limiting to our authentication endpoints?`,
        suggestedReplies: [
          'Add rate limiting of 5 req/min to /api/auth/login',
          'How do we implement sliding window in Redis?',
          'What is an appropriate rate limit for public APIs?',
        ],
        extractedUpdates: undefined,
      };
    }

    // General Educational Fallback
    return {
      reply: `That's a great engineering question! Regarding **"${userText}"**:

From an architectural standpoint, the key is balancing simplicity, security boundaries, and operational maintainability. When designing systems, we typically start with the cleanest abstraction that satisfies security invariants, and evolve it as scalability demands require.

How does this relate to what you're planning for your application? Feel free to ask more details or let me know if you'd like to implement this as a feature!`,
      suggestedReplies: [
        'How would we apply this to our current project?',
        'What are the security trade-offs to keep in mind?',
        'Let\'s build this as a feature in our app',
      ],
      extractedUpdates: undefined,
    };
  }

  // =========================================================================
  // MODE 2: FEATURE BUILDING & ARCHITECTURAL PLANNING
  // Strict Gate 1 pipeline, technical trade-offs, and extracted updates!
  // =========================================================================

  // 1. Switch to Hybrid or Bearer
  if (text.includes('hybrid') || (text.includes('bearer') && (text.includes('switch') || text.includes('use') || text.includes('update') || text.includes('add') || text.includes('yes')))) {
    return {
      reply: `✅ **Understood.** I've updated the contract and requirements baseline to support **Hybrid Dual Transport**:

1. **Web Clients:** Authenticate via \`HttpOnly\` session cookies.
2. **API & Mobile Clients:** Authenticate via \`Authorization: Bearer <token>\`.
3. **Session Store:** Refresh tokens bound to UUID with fingerprint validation.

I have updated the requirements baseline and marked the middleware specifications accordingly.`,
      suggestedReplies: [
        'Can we add rate limiting on /api/v1/auth/login?',
        'Add Google OAuth 2.0 social login',
        'Freeze contract and begin worker coding',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'POST /api/v1/auth/login returns encrypted JWT token in payload and sets HttpOnly session cookie',
          'Auth middleware accepts credentials from either HttpOnly cookie or Bearer Authorization header',
        ],
        acceptanceCriteria: [
          'API consumers providing valid "Authorization: Bearer <token>" receive HTTP 200 with SessionVerifyResponse',
        ],
        contractDiffNote: 'Added Bearer header support to AuthSessionResponse and middleware invariant specs',
      },
    };
  }

  // 2. Add Rate limiting / Brute Force Protection
  if (text.includes('rate limit') || text.includes('brute force') || text.includes('throttle')) {
    const rateLimitEndpoint: ApiEndpointSchema = {
      method: 'POST',
      path: '/api/v1/auth/login',
      description: 'Authenticate user credentials with Redis token bucket rate limiting (5 req/min/IP)',
      requestType: 'LoginPayload',
      responseType: 'AuthSessionResponse | ApiErrorEnvelope',
      status: 200,
    };

    return {
      reply: `🛡️ **Rate Limiting Specification Incorporated:**

- **Policy:** Sliding token bucket: **5 attempts per minute per IP/account**.
- **Violation Response:** HTTP \`429 Too Many Requests\` with \`Retry-After\` header and structured \`ApiErrorEnvelope\`.
- **Lockout Mechanism:** 3 successive 429 windows trigger exponential backoff (15-minute cool-off).
- **Backend Worker Task:** \`feature/backend-api-routes\` will include \`src/middleware/rateLimiter.ts\` in its permitted scope.

The functional requirements and endpoint specifications have been updated.`,
      suggestedReplies: [
        'Add Redis fallback for distributed clusters',
        'Add CAPTCHA verification after 3 failures',
        'Looks great, let\'s freeze the contract now',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'Rate limiter middleware enforces max 5 failed login attempts per minute per IP returning HTTP 429',
        ],
        acceptanceCriteria: [
          'Exceeding 5 requests in 60s window returns HTTP 429 with Retry-After header and ERR_RATE_LIMITED code',
        ],
        endpointsDelta: [rateLimitEndpoint],
        contractDiffNote: 'Added HTTP 429 Too Many Requests response schema to POST /api/v1/auth/login',
        taskUpdates: ['Added rateLimiter.ts to backend worker file manifest'],
      },
    };
  }

  // 3. Google OAuth / Social Login
  if (text.includes('oauth') || text.includes('google') || text.includes('social login')) {
    const oauthEndpoint: ApiEndpointSchema = {
      method: 'POST',
      path: '/api/v1/auth/oauth/google',
      description: 'Exchange Google OAuth authorization code for verified user session',
      requestType: '{ authCode: string; redirectUri: string }',
      responseType: 'AuthSessionResponse',
      status: 200,
    };

    return {
      reply: `🌐 **Google OAuth 2.0 Integration Added to Architecture:**

- **Protocol:** Authorization Code Grant with PKCE (\`code_verifier\` + \`code_challenge\`).
- **New Route:** \`POST /api/v1/auth/oauth/google\` to exchange server-side auth code for session tokens.
- **User Record:** Extends \`SessionUser\` with \`provider: 'google' | 'local'\` and \`avatarUrl?: string\`.
- **Safety Boundary:** Prevents account takeover by ensuring email verification flags match before linking identities.

I have injected this into the Interface Contract draft and updated the task manifest.`,
      suggestedReplies: [
        'How do we handle duplicate emails between password and Google login?',
        'What about Apple or GitHub login?',
        'Approve contract and proceed to implementation',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'POST /api/v1/auth/oauth/google validates Google ID token and issues unified session',
          'User identity linking handles existing email addresses with account merge verification',
        ],
        acceptanceCriteria: [
          'Unverified third-party emails are rejected with HTTP 400 ERR_UNVERIFIED_EMAIL',
        ],
        endpointsDelta: [oauthEndpoint],
        contractDiffNote: 'Added /api/v1/auth/oauth/google endpoint and SessionUser provider fields',
      },
    };
  }

  // 4. Freeze Contract / Proceed to coding
  if (text.includes('freeze') || text.includes('proceed') || text.includes('start worker') || text.includes('approve') || text.includes('ready')) {
    return {
      reply: `🚀 **Architectural Consensus Reached!**

All clarifying questions, invariant constraints, and interface specifications are stabilized:
- **Baseline:** Gate 1 & 2 requirements compiled and ready for human freeze sign-off.
- **Contract:** Immutable types and endpoint schemas ready for hash stamping.
- **Task Manifest:** Backend, Frontend, and QA workers are primed in their isolated branches.

Click **"Approve & Freeze Contract"** in the Frozen Contract tab or below to unlock the parallel worker execution pipeline!`,
      suggestedReplies: [
        'Approve & Freeze Contract (Clear Gate 3)',
        'Review DTO schemas one more time',
        'Add one more acceptance criterion',
      ],
      extractedUpdates: {
        contractDiffNote: 'Contract verified by Lead Architect and ready for Gate 3 freezing',
      },
    };
  }

  // 5. Stripe specific implementation
  if (text.includes('stripe') || text.includes('billing') || text.includes('payment')) {
    return {
      reply: `⚡ **Stripe Webhook Idempotency & Checkout Architecture:**

- **Idempotency Key:** Every webhook payload has a unique \`event.id\` (e.g. \`evt_1M...\`).
- **Processing Table:** We insert \`event.id\` into an \`idempotency_keys\` table with a \`UNIQUE\` constraint and status \`processing\`.
- **Duplicate Handling:** If an event arrives with an existing key:
  - If status is \`completed\`: Immediately return HTTP \`200 OK\` without re-processing payments.
  - If status is \`processing\`: Return HTTP \`409 Conflict\` so Stripe retries after backoff.
- **Replay Protection:** Rejects events whose \`created\` timestamp is older than 300 seconds.`,
      suggestedReplies: [
        'How do we test webhooks locally with Vitest?',
        'What happens if the customer card fails on renewal?',
        'Freeze contract and begin worker coding',
      ],
      extractedUpdates: {
        functionalRequirements: [
          'Webhook receiver logs incoming event.id in PostgreSQL idempotency ledger before invoice processing',
        ],
        acceptanceCriteria: [
          'Duplicate webhook payloads with identical event.id return HTTP 200 without duplicate database mutations',
        ],
        contractDiffNote: 'Specified Stripe webhook idempotency ledger and 5-minute replay tolerance',
      },
    };
  }

  // 6. RBAC specific implementation
  if (text.includes('rbac') || text.includes('role')) {
    return {
      reply: `🔒 **RBAC Hierarchical Invariant Architecture:**

- **Non-Escalation Rule:** An actor cannot grant a role equal to or higher than their own (e.g. an Admin cannot promote anyone to Owner).
- **Self-Demotion Guard:** The last Owner cannot demote themselves or leave the organization without transferring ownership.
- **Middleware Guard:** \`requireRole('admin')\` middleware intercepts requests prior to route handler execution, returning \`HTTP 403 Forbidden\` with \`ERR_INSUFFICIENT_ROLE\`.
- **Database Index:** Roles and workspace bindings are indexed compound keys \`(workspace_id, user_id)\` for sub-millisecond evaluation.`,
      suggestedReplies: [
        'How are role changes audited?',
        'Can we add custom roles in the future?',
        'Freeze contract and begin worker coding',
      ],
      extractedUpdates: {
        acceptanceCriteria: [
          'Attempting to change role of workspace Owner by Admin returns HTTP 403 ERR_OWNER_IMMUTABLE',
        ],
        contractDiffNote: 'Enforced hierarchical non-escalation invariants in RBAC route contracts',
      },
    };
  }

  // 7. General Feature Building fallback
  return {
    reply: `💡 **Architectural Specification for Feature Request:**

Regarding *"**${userText}**"*:
- **Boundary Design:** Defined interface contract between client layer and backend services.
- **Data Integrity:** Ensuring strict validation before persistence and deterministic error handling.
- **Worker Isolation:** The backend, frontend, and QA workers will consume this specification through frozen TypeScript interfaces.

I have drafted the corresponding functional requirement and acceptance criteria.`,
    suggestedReplies: [
      'What are the security implications of this?',
      'Let\'s review the frozen contract draft',
      'Approve baseline and freeze contract',
    ],
    extractedUpdates: {
      functionalRequirements: [
        `Feature specification: ${userText.slice(0, 80)}`,
      ],
      acceptanceCriteria: [
        `System satisfies specification constraint: ${userText.slice(0, 60)}`,
      ],
      contractDiffNote: `Updated specifications based on user request: "${userText.slice(0, 45)}"`,
    },
  };
}

/**
 * Service to execute Lead Architect consultation chat.
 * Tries server-side Gemini endpoint first; falls back gracefully to local engine.
 */
export async function sendLeadArchitectChatMessage(
  messages: ArchitectChatMessage[],
  prompt: string,
  baseline: RequirementsBaseline | null,
  contract: ContractSchema,
  tasks: WorkerTask[],
  model: string = 'gemini-3.5-flash',
  agentRole: string = 'Lead Principal Software Architect',
  enableGrounding: boolean = true,
  customApiKey?: string,
  provider?: string
): Promise<{
  reply: string;
  suggestedReplies: string[];
  extractedUpdates?: ArchitectExtractedUpdates;
  model?: string;
  groundingSources?: string[];
}> {
  const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'user')?.content || '';
  const intent = evaluateUserIntent(lastUserMessage);

  try {
    const res = await fetch('/api/lead-architect/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({ sender: m.sender, content: m.content })),
        prompt,
        baseline,
        contract,
        tasks,
        model,
        agentRole,
        enableGrounding,
        systemInstruction: LEAD_ARCHITECT_SYSTEM_INSTRUCTION,
        intent,
        apiKey: customApiKey,
        provider,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        // Enforce safety: if user was asking a general knowledge question, ensure no updates are extracted
        const safeUpdates = intent === 'general_knowledge' ? undefined : data.extractedUpdates;
        return {
          reply: data.reply,
          suggestedReplies: data.suggestedReplies || [
            'What about error handling?',
            'Can we review the contract schema?',
            'Approve and freeze contract',
          ],
          extractedUpdates: safeUpdates,
          model: data.model || model,
          groundingSources: data.groundingSources,
        };
      }
    }
  } catch (_err) {
    // Seamless fallback to local architectural engine
  }

  // Fallback to local architectural knowledge engine
  const localRes = generateLocalArchitecturalResponse(lastUserMessage, prompt, baseline, contract, tasks);
  return {
    ...localRes,
    model,
    groundingSources: enableGrounding ? ['Local Architectural Knowledge Graph', 'RFC Invariant Specifications'] : [],
  };
}

/**
 * Gate 1 Intelligent Crew Recommendation:
 * Analyzes the technical scope of the active feature and consultation history
 * to advise whether workers should be Active or Dormant.
 */
export function analyzeCrewRecommendation(
  featurePrompt: string,
  chatMessages?: ArchitectChatMessage[]
): CrewRecommendation {
  const allText = [
    featurePrompt || '',
    ...(chatMessages || []).map((m) => m.content),
  ].join(' ').toLowerCase();

  // Pure API, backend service, webhook, CLI, database schema, script
  const isPureApiOrBackend =
    (allText.includes('api only') ||
     allText.includes('backend only') ||
     allText.includes('headless') ||
     allText.includes('cli') ||
     allText.includes('cron job') ||
     allText.includes('microservice') ||
     allText.includes('webhook') ||
     allText.includes('pure api') ||
     allText.includes('rest api only') ||
     allText.includes('database migration') ||
     allText.includes('grpc') ||
     allText.includes('kafka') ||
     allText.includes('serverless function only')) &&
    !allText.includes('ui') &&
    !allText.includes('frontend') &&
    !allText.includes('react') &&
    !allText.includes('landing page');

  // Pure UI, styling, design system, component library, landing page, animations
  const isPureFrontend =
    (allText.includes('frontend only') ||
     allText.includes('ui only') ||
     allText.includes('mock data') ||
     allText.includes('landing page') ||
     allText.includes('styling only') ||
     allText.includes('pure component') ||
     allText.includes('css animation') ||
     allText.includes('calculator ui') ||
     allText.includes('pricing table component')) &&
    !allText.includes('backend') &&
    !allText.includes('database') &&
    !allText.includes('server route') &&
    !allText.includes('api endpoint');

  // Pure QA / security test suite
  const isTestAuditOnly =
    (allText.includes('tests only') ||
     allText.includes('audit only') ||
     allText.includes('benchmark only') ||
     allText.includes('fuzzing suite only')) &&
    !allText.includes('build') &&
    !allText.includes('frontend');

  if (isPureApiOrBackend) {
    return {
      reason: 'Headless API & server pipeline. Frontend Worker can be Dormant to eliminate token waste.',
      activeWorkers: {
        backend: true,
        frontend: false,
        qa: true,
      },
    };
  }

  if (isPureFrontend) {
    return {
      reason: 'Client-side UI presentation layer. Backend Worker can be Dormant to conserve compute.',
      activeWorkers: {
        backend: false,
        frontend: true,
        qa: true,
      },
    };
  }

  if (isTestAuditOnly) {
    return {
      reason: 'Security conformance audit & test fuzzing scope. Backend and Frontend set to Dormant.',
      activeWorkers: {
        backend: false,
        frontend: false,
        qa: true,
      },
    };
  }

  // Full-Stack (default for Auth, Stripe, RBAC, etc.)
  return {
    reason: 'Full-stack feature requiring Next.js route handlers, interactive client components, and Vitest contract suites.',
    activeWorkers: {
      backend: true,
      frontend: true,
      qa: true,
    },
  };
}
