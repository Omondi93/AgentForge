# ⚡ AgentForge Orchestration Dashboard

A secure, production-grade multi-agent orchestration platform for autonomous software engineering. Plan architectures, freeze immutable contracts, and dispatch specialized engineering personas within zero-trust, hardware-isolated microVM sandboxes.

---

## 🌟 Key Features

### 1. Minimalist Conversational Discovery (Gate 1)
- **Lead Architect Collaboration:** Start with Alex Vance in a clean, conversational landing interface to explore requirements and decompose features.
- **Dynamic Task Decomposition:** Automatically generates task manifests and contract specs before writing any code.
- **Interactive Requirement Clarification:** Categorized RFC-level prompts (Mandatory Security Invariants, Architectural Trade-offs, Edge Cases) ensure specifications are watertight before implementation.

### 2. Intelligent Crew Management & Token Economy (Gate 2)
- **Active / Standby Fleet Toggles:** Toggle individual workers (`Backend`, `Frontend`, `QA`) between **Active** and **Dormant** to eliminate idle token burn.
- **Custom Specialist Personas:** Spin up custom engineering agents with targeted system prompts and permitted file scopes.
- **Real-Time Cost Telemetry:** Live tracking of input/output token usage, API expenses, and tokens saved via dormant workers.

### 3. Hardware-Isolated MicroVM Sandboxing
- **Kernel-Level Isolation:** Dispatches worker execution into isolated **AWS Firecracker MicroVMs** (with fallback to gVisor / containers) so untrusted AI-generated code never touches the host kernel.
- **Zero-Trust Network Egress:** Default-deny outbound networking with strict allowlisting (`npm`, `GitHub`) and hard blocking of link-local metadata (`169.254.169.254`) to prevent credential exfiltration.
- **Dynamic Secret Proxying:** API keys and tokens are injected at the wire/proxy layer, keeping environment variables and VM memory free of ambient secrets.
- **Compute Quotas & Watchdogs:** Enforced cgroup memory ceilings (1024 MB default) and execution watchdog timers.

### 4. Interactive Artifacts & Code Inspection
- **📁 Code & Files Explorer:** Interactive file-tree browser with tokenized syntax highlighting, line numbers, and persona filter pills.
- **Direct Agent Inspection:** Slide-over code drawer displaying branch scopes, generated files, and boundary compliance.
- **Automated Scope Violation Detection:** Real-time CI guardrails preventing workers from modifying files outside their assigned blast radius.
- **Visual App Preview:** Live component preview with integrated element inspection and micro-prompt editing.

---

## 🏗️ Architecture & Pipeline Stages

AgentForge enforces a strict, gated software engineering pipeline that prevents architectural drift, guarantees boundary compliance, and protects host infrastructure.

```
                      ┌──────────────────────────────────────────┐
                      │          CONVERSATIONAL DISCOVERY        │
                      │       Lead Architect (Alex Vance)        │
                      └────────────────────┬─────────────────────┘
                                           │
                                  [Gate 1: RFC Approval]
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │          TASK DECOMPOSITION              │
                      │     Blast Radius & File Glob Scopes      │
                      └────────────────────┬─────────────────────┘
                                           │
                                 [Gate 2: Crew Sign-off]
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │        FROZEN CONTRACT SCHEMA            │
                      │      TypeScript AST & OpenAPI Lock       │
                      │         (SHA-256 Checksum Seal)          │
                      └────────────────────┬─────────────────────┘
                                           │
                                [Gate 3: Contract Freeze]
                                           │
                                           ▼
                ┌──────────────────────────────────────────────────────┐
                │          HARDWARE-ISOLATED MICROVM SANDBOXES         │
                │        Dedicated Linux 6.1 Kernels (Firecracker)     │
                │                                                      │
                │  ┌─────────────────┐ ┌─────────────────┐ ┌────────┐  │
                │  │ Backend Worker  │ │ Frontend Worker │ │ QA Eng │  │
                │  │ (Marcus Blake)  │ │  (Sarah Chen)   │ │(Elena) │  │
                │  └────────┬────────┘ └────────┬────────┘ └───┬────┘  │
                │           │                   │              │       │
                │     feat/backend-api    feat/frontend-ui  feat/qa-test│
                │           │                   │              │       │
                │     Wire-Proxy Auth     Wire-Proxy Auth  Wire-Proxy  │
                │     Default-Deny TAP    Default-Deny TAP Default-Deny│
                └───────────┼───────────────────┼──────────────┼───────┘
                            │                   │              │
                            └───────────────────┼──────────────┘
                                                │
                                                ▼
                      ┌──────────────────────────────────────────┐
                      │            CI PIPELINE & TRIAGE          │
                      │       npm lint · tsc · vitest specs      │
                      │    Blast Radius Scope Violation Check    │
                      │         1-Click Architect Repair         │
                      └────────────────────┬─────────────────────┘
                                           │
                                 [Gate 4: CI Green Light]
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │         HUMAN REVIEW & PRODUCTION        │
                      │      Interactive Code Diff Drawer        │
                      │         Merge to Main Branch             │
                      │      Deploy: Vercel / Cloudflare         │
                      │      Export: ZIP / GitHub Push           │
                      └──────────────────────────────────────────┘
```

### Stage 1: Conversational Discovery & Gate 1 (Discovery & RFC Alignment)
- **Role:** Lead Architect (Alex Vance).
- **Process:** The user discusses the feature or architecture in natural language. Alex Vance synthesizes technical clarifications across three distinct categories:
  1. *Mandatory Clarifications:* Non-negotiable security invariants, authentication flows, and data storage policies.
  2. *Architectural Trade-offs:* Engine selection (In-Memory Virtual Sandbox vs. Live GitHub Octokit), state management, and caching strategies.
  3. *Edge Cases & Error Budgets:* Rate limits, idempotency keys, replay prevention, and failure fallbacks.
- **Gate 1 Milestone:** Formal **Requirements Baseline** generated and frozen upon user confirmation.

### Stage 2: Task Decomposition & Gate 2 (Fleet Crew Allocation)
- **Role:** Autonomous Orchestrator & User.
- **Process:** Features are decomposed into discrete, parallelizable engineering workstreams:
  - **Backend Worker (Marcus Blake):** Next.js App Router route handlers, cryptographic session cookies, and database interfaces.
  - **Frontend Worker (Sarah Chen):** Accessible React components, status badges, and interactive controls strictly consuming frozen DTO props.
  - **QA Engineer (Elena Rostova):** Vitest test suites, schema conformance specs, and security edge case verification.
  - **Custom Specialist Personas:** Spin up custom agents (e.g., Security Auditor, DevOps Engineer) with tailored system prompts.
- **Blast Radius Scopes:** Each worker is bounded by file glob patterns (e.g., `app/api/auth/*` vs. `components/auth/*`). Any modification outside the permitted scope triggers an automated CI breach.
- **Fleet Economy:** Workers can be toggled to **Dormant** to conserve 100% of tokens when specialized tasks are omitted.
- **Gate 2 Milestone:** Human sign-off on the active agent roster and task assignments.

### Stage 3: Frozen Contract Schema & Gate 3 (Immutable Interface Lock)
- **Role:** Lead Architect & TypeScript AST Compiler.
- **Process:** Generates and locks the cross-agent interface specification:
  - **TypeScript AST:** Strongly-typed Data Transfer Objects (DTOs), request envelopes, and response models.
  - **OpenAPI / REST Endpoints:** HTTP methods, route paths, status codes, and input/output contracts.
  - **SHA-256 Checksum Seal:** Cryptographic digest computed over the contract AST. Any code modification that breaks the contract triggers an automated compiler error (`TS2322`).
- **Gate 3 Milestone:** Clicking **"Approve & Freeze Contract"** permanently locks the contract and unlocks the parallel microVM worker execution pipeline.

### Stage 4: Hardware-Isolated MicroVM Sandboxing (Parallel Worker Execution)
- **Role:** Autonomous Workers running inside isolated MicroVMs.
- **Process:**
  - **Dedicated MicroVM Provisioning:** Workers run inside isolated **AWS Firecracker MicroVMs** (`Linux 6.1.102-microvm-fc3` via KVM). Each session receives its own dedicated kernel, completely decoupling untrusted AI code from the host machine.
  - **Zero-Trust Network TAP Interface:** Default-Deny outbound firewall blocks all outbound traffic, with strict allowlisting (`registry.npmjs.org`, `github.com`).
  - **Cloud Metadata Guard:** Drops all attempts to query `169.254.169.254` (RFC 3927 link-local) to prevent AWS/GCP master credential theft.
  - **Dynamic Secret Proxy:** Ambient environment variables (`GITHUB_TOKEN`, `API_KEYS`) are stripped. Credentials are dynamically injected at the wire/proxy layer when calling allowed endpoints.
  - **Compute Quotas:** Hardware memory ceiling (default 1024 MB via cgroups v2) and hardware watchdog timer (120s timeout) prevent infinite loops and resource exhaustion.
  - **Dual-Engine Git:** Workers push commits to isolated Git branches (`feature/backend-api-routes`, `feature/frontend-ui-components`, `feature/qa-vitest-suite`) either in the virtual in-memory sandbox or real GitHub repository via Octokit REST API.

### Stage 5: GitHub Actions CI & Automated Triage (Gate 4)
- **Role:** Automated CI Runner & Lead Architect Triage.
- **Process:** Executes 3-step automated verification on each Pull Request:
  1. `npm run lint`: ESLint syntax, formatting, and stylistic invariant validation.
  2. `tsc --noEmit`: Strict TypeScript AST compiler check against the frozen contract.
  3. `vitest run`: Comprehensive unit and contract conformance test suite.
  4. *Blast Radius Verification:* Ensures modified files strictly match the worker's assigned permitted files.
- **Automated Triage Guardrails:**
  - When CI fails (or a contract drift is injected), the Lead Architect provides an automated root cause diagnosis and 1-click surgical repair patch.
  - **Loop Prevention:** Maximum of 1 automated revision attempt allowed per CI cycle to eliminate infinite agent hallucination loops.

### Stage 6: Human Review, Merge & Production Deployment (Gate 5)
- **Role:** Executive / Developer Sign-Off.
- **Process:**
  - **Interactive Diff Inspection:** Review line-by-line changes with syntax highlighting in Unified or Split view.
  - **Visual App Preview:** Live interactive preview of generated components with element inspection and micro-prompt editing.
  - **Merge to Main:** Fast-forward Git merge combining all validated worker branches.
  - **Instant Deployment:** 1-click production release to Vercel or Cloudflare with real-time status updates and live URL.
  - **Export Options:** Download complete virtual repository as a `.zip` archive or push live pull requests to GitHub.

---

## 🔒 Security Threat Model & Invariants

| Threat Vector | Naive AI Coding Platform | AgentForge Defense-in-Depth |
|---|---|---|
| **Container Escape** | Shared host Linux kernel; root exploit compromises server | **Firecracker MicroVM:** Hardware virtualization with dedicated guest Linux 6.1 kernel |
| **Credential Exfiltration** | AI code reads `process.env.GITHUB_TOKEN` and sends to attacker | **Secret Proxy:** 0 ambient keys in VM memory; credentials injected on wire to allowlisted hosts |
| **Cloud IAM Theft** | Agent queries `http://169.254.169.254/latest/meta-data` | **Link-Local Filter:** Strict drop rule for all RFC 3927 link-local and private subnets |
| **Arbitrary Network Access** | Full outbound internet access | **Zero-Trust Egress:** Default-Deny; only approved package registries and GitHub permitted |
| **Denial of Service (DoS)** | AI generates infinite loop / memory leak crashing host | **Compute Quotas:** 1024 MB cgroup memory ceiling and hard 120s watchdog SIGKILL |
| **Architectural Drift** | Workers write incompatible endpoints and ad-hoc payloads | **Frozen Contract Schema:** Cryptographically sealed TypeScript DTOs and OpenAPI specs |
| **Blast Radius Expansion** | Backend worker accidentally overwrites frontend UI or auth rules | **Scope Verification:** Real-time CI guardrail fails PRs modifying unpermitted file globs |

---

## 🛠️ Tech Stack & SDKs

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Backend & Server:** Express, Node.js v22, TSX, Vite Middleware
- **AI Engine:** Google GenAI SDK (`@google/genai`) with Gemini 2.0 Flash / Pro, streaming, grounding, and search metadata
- **Sandboxing & Virtualization:** AWS Firecracker MicroVM architecture, gVisor `runsc` syscall wrapper, Linux cgroups v2
- **Git & CI:** Dual-engine Git (In-Memory Virtual Repository + Octokit REST GitHub Integration), simulated GitHub Actions runner
- **Security & Storage:** Firebase Firestore with strict UID-scoped security rules and salted cryptographic scrypt session authentication
