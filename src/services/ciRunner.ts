import { CIStepLog, CIDiagnostic, PullRequestState, AgentPersona } from '../types/agentforge';

export interface CIRunResult {
  ciStatus: 'success' | 'failure';
  ciLogs: CIStepLog[];
  diagnostic?: CIDiagnostic;
}

export class CIRunner {
  /**
   * Run the 3-step CI Pipeline:
   * 1. npm run lint
   * 2. tsc --noEmit
   * 3. npm run test
   */
  public async executePipeline(
    branch: string,
    authorPersona: AgentPersona,
    simulateFailure = false,
    existingAttempts = 0
  ): Promise<CIRunResult> {
    if (!simulateFailure) {
      // Nominal Passing Run
      const ciLogs: CIStepLog[] = [
        {
          id: 'step-1',
          name: 'Lint & Formatting Checks',
          command: 'npm run lint',
          status: 'success',
          durationMs: 1180,
          logs: [
            '[MicroVM Runner] Booted isolated Firecracker guest kernel (Linux 6.1.102-microvm-fc3, KVM).',
            '[Zero-Trust Guard] Egress filter active: blocked 169.254.169.254 (Cloud metadata). Proxy injected wire PAT.',
            '[cgroups v2] Quota armed: 1024MB RAM ceiling, 120s timeout watchdog.',
            '> react-example@0.0.0 lint',
            '> eslint . --ext .ts,.tsx --max-warnings=0',
            `✔ Checked branch ${branch}. Zero ESLint warnings or stylistic errors detected.`,
            'All formatting invariants satisfied.',
          ],
        },
        {
          id: 'step-2',
          name: 'TypeScript Contract Verification',
          command: 'tsc --noEmit',
          status: 'success',
          durationMs: 2150,
          logs: [
            '> react-example@0.0.0 tsc --noEmit',
            'Compiling TypeScript AST against frozen contract types/contracts.ts...',
            '✔ Request payload body matches LoginPayload DTO.',
            '✔ Response envelope strictly matches AuthSessionResponse.',
            '✔ Zero type errors detected. Exited with code 0.',
          ],
        },
        {
          id: 'step-3',
          name: 'Automated Test Suite',
          command: 'npm run test',
          status: 'success',
          durationMs: 3410,
          logs: [
            '> vitest run --reporter=verbose',
            'PASS tests/api/auth.contract.test.ts',
            '  ✓ POST /api/auth/login validates credentials and sets session cookies (18ms)',
            '  ✓ GET /api/auth/session returns 200 with verified SessionUser (12ms)',
            'PASS tests/components/LoginForm.test.tsx',
            '  ✓ Renders login inputs and dispatches authenticated tokens (35ms)',
            'Test Suites: 2 passed, 2 total',
            'Tests:       4 passed, 4 total',
            'Snapshots:   0 total',
            'Time:        1.84s',
          ],
        },
      ];

      return {
        ciStatus: 'success',
        ciLogs,
      };
    }

    // Injected CI Failure
    const rawError =
      "Type 'string' is not assignable to type 'UserRole' in app/api/auth/login/route.ts:42:19.\n  The expected type comes from property 'roles' which is declared here on type 'SessionUser' in types/contracts.ts:8:3.";

    const failedCiLogs: CIStepLog[] = [
      {
        id: 'step-1',
        name: 'Lint & Formatting Checks',
        command: 'npm run lint',
        status: 'success',
        durationMs: 980,
        logs: [
          '> react-example@0.0.0 lint',
          '> eslint . --ext .ts,.tsx --max-warnings=0',
          '✔ ESLint syntax check passed cleanly.',
        ],
      },
      {
        id: 'step-2',
        name: 'TypeScript Contract Verification',
        command: 'tsc --noEmit',
        status: 'failure',
        durationMs: 2420,
        errorMessage: rawError,
        logs: [
          '> react-example@0.0.0 tsc --noEmit',
          'Validating source tree against frozen contract schema...',
          'FAIL app/api/auth/login/route.ts:42:19',
          "error TS2322: Type 'string' is not assignable to type 'UserRole'.",
          "  Property 'roles' requires ('admin' | 'member' | 'viewer')[] but received unvalidated string array.",
          'Found 1 compiler type error in 1 file. Process exited with code 2.',
        ],
      },
      {
        id: 'step-3',
        name: 'Automated Test Suite',
        command: 'npm run test',
        status: 'pending',
        durationMs: 0,
        logs: ['Step skipped: Pipeline stopped due to compiler failure in tsc --noEmit.'],
      },
    ];

    // Structured Lead Agent Diagnostic
    const diagnostic: CIDiagnostic = {
      id: `diag-${Date.now()}`,
      failedStep: 'tsc --noEmit',
      rawError,
      rootCause:
        "Contract Boundary Drift: Route handler assigns raw unvalidated database strings to the strongly typed 'roles' array on SessionUser. The frozen contract defines roles as ('admin' | 'member' | 'viewer')[].",
      proposedFix: {
        filePath: 'app/api/auth/login/route.ts',
        description:
          "Enforce type assertion with fallback to default 'member' role, guaranteeing alignment with frozen contract schema.",
        patch: `@@ -40,3 +40,3 @@
-      roles: user.roles,
+      roles: (user.roles as ('admin' | 'member' | 'viewer')[]) || ['member'],`,
      },
      confidenceScore: 98,
      revisionAttemptsUsed: existingAttempts,
      maxRevisionAttempts: 1,
      status: 'pending_review',
    };

    return {
      ciStatus: 'failure',
      ciLogs: failedCiLogs,
      diagnostic,
    };
  }

  /**
   * Bounded Lead Agent Triage:
   * Guardrail: Worker agent is strictly NOT allowed to commit automatically.
   * Guardrail: Maximum of 1 automated revision attempt per CI failure cycle.
   */
  public applyTriageFix(
    prState: PullRequestState,
    manualOverride = false,
    manualNote?: string
  ): { success: boolean; error?: string; updatedPr: PullRequestState } {
    const diagnostic = prState.diagnostic;

    if (!diagnostic) {
      return { success: false, error: 'No active diagnostic found on this PR', updatedPr: prState };
    }

    // Enforce 1-attempt guardrail for automated fixes
    if (!manualOverride && diagnostic.revisionAttemptsUsed >= diagnostic.maxRevisionAttempts) {
      return {
        success: false,
        error:
          'Strict Guardrail Enforced: Maximum automated revision limit (1 attempt) exceeded for this CI cycle. Infinite loop protection active. Manual override required.',
        updatedPr: prState,
      };
    }

    // Apply the fix patch to the PR diffs
    const targetPath = diagnostic.proposedFix.filePath;
    const updatedDiffs = prState.diffs.map((diff) => {
      if (diff.path === targetPath) {
        return {
          ...diff,
          newContent: diff.newContent?.replace(
            'roles: user.roles,',
            "roles: (user.roles as ('admin' | 'member' | 'viewer')[]) || ['member'],"
          ),
          patch: `${diff.patch}\n+      // Lead Architect Invariant Fix: Cast to frozen enum\n+      roles: (user.roles as ('admin' | 'member' | 'viewer')[]) || ['member'],`,
        };
      }
      return diff;
    });

    // Re-run CI into passing state
    const cleanLogs: CIStepLog[] = [
      {
        id: 'step-1',
        name: 'Lint & Formatting Checks',
        command: 'npm run lint',
        status: 'success',
        durationMs: 1040,
        logs: ['> eslint .', '✔ 0 warnings or errors.'],
      },
      {
        id: 'step-2',
        name: 'TypeScript Contract Verification',
        command: 'tsc --noEmit',
        status: 'success',
        durationMs: 1850,
        logs: [
          '> tsc --noEmit',
          `✔ Successfully verified ${targetPath} against frozen contract.`,
          'Compilation complete with 0 errors.',
        ],
      },
      {
        id: 'step-3',
        name: 'Automated Test Suite',
        command: 'npm run test',
        status: 'success',
        durationMs: 3100,
        logs: ['> vitest run', 'PASS tests/api/auth.contract.test.ts (2 passed)', 'All suites green.'],
      },
    ];

    const updatedPr: PullRequestState = {
      ...prState,
      diffs: updatedDiffs,
      ciStatus: 'success',
      ciLogs: cleanLogs,
      diagnostic: {
        ...diagnostic,
        revisionAttemptsUsed: diagnostic.revisionAttemptsUsed + 1,
        status: manualOverride ? 'rejected_manual_override' : 'approved_and_applied',
        manualOverrideNote: manualNote,
      },
      headSha: 'c891a04',
    };

    return {
      success: true,
      updatedPr,
    };
  }
}

export const ciRunner = new CIRunner();
