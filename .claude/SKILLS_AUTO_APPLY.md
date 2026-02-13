# Auto-Applied Skills Configuration

> Claude MUST apply these skills automatically based on task context.
> No manual invocation needed - follow rules below.

---

## MANDATORY WORKFLOW SKILLS

### Before ANY Creative/Feature Work

**ALWAYS use `brainstorming` workflow BEFORE:**

- Creating new features or components
- Adding new functionality
- Modifying existing behavior
- Building new pages or views

**Process:**

1. Understand current project context (files, docs, recent commits)
2. Ask questions ONE AT A TIME (prefer multiple choice)
3. Propose 2-3 approaches with trade-offs
4. Present design in sections (200-300 words each)
5. Validate each section before continuing
6. Apply YAGNI ruthlessly

---

### Before ANY Bug Fix or Unexpected Behavior

**ALWAYS use `systematic-debugging` workflow:**

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

**The Four Phases (MANDATORY):**

1. **Root Cause Investigation**
   - Read error messages COMPLETELY
   - Reproduce consistently
   - Check recent changes (git diff)
   - Trace data flow to source

2. **Pattern Analysis**
   - Find working examples in codebase
   - Compare working vs broken
   - Identify ALL differences

3. **Hypothesis Testing**
   - Form SINGLE hypothesis
   - Make SMALLEST possible change
   - Test ONE variable at a time

4. **Implementation**
   - Create failing test FIRST
   - Implement single fix
   - Verify fix works

**RED FLAGS - STOP:**

- "Quick fix for now"
- "Just try changing X"
- Proposing solutions before investigation
- 3+ failed fix attempts = question architecture

---

### Before ANY Implementation

**ALWAYS use `test-driven-development` workflow:**

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

**Red-Green-Refactor Cycle:**

1. **RED** - Write ONE minimal failing test
2. **Verify RED** - Run test, confirm it fails correctly
3. **GREEN** - Write MINIMAL code to pass
4. **Verify GREEN** - Run test, confirm all pass
5. **REFACTOR** - Clean up (stay green)
6. **Repeat**

**Iron Law:** Code written before test? DELETE IT. Start over.

---

### Before Claiming Work Complete

**ALWAYS use `verification-before-completion` workflow:**

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

**The Gate Function:**

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh)
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim

**NEVER say:**

- "Should work now"
- "Looks correct"
- "Tests probably pass"
- ANY success claim without running verification

---

## CONTEXT-TRIGGERED SKILLS

### Frontend/UI Development

**Auto-apply `frontend-design` when:**

- Building web components, pages, or interfaces
- Creating React/Next.js components
- Styling or beautifying UI

**Key Principles:**

- Choose BOLD aesthetic direction (not generic)
- Typography: distinctive fonts (NOT Inter, Arial, Roboto)
- Color: dominant colors with sharp accents
- Motion: CSS animations, staggered reveals
- NEVER use generic "AI slop" aesthetics

---

### React/Next.js Code

**Auto-apply `vercel-react-best-practices` when:**

- Writing React components
- Implementing data fetching
- Optimizing performance

**Priority Rules:**

| Priority | Category   | Key Rules                                     |
| -------- | ---------- | --------------------------------------------- |
| CRITICAL | Waterfalls | `Promise.all()` for parallel ops, defer await |
| CRITICAL | Bundle     | Direct imports (no barrels), dynamic imports  |
| HIGH     | Server     | `React.cache()`, minimize serialization       |
| MEDIUM   | Re-renders | Primitive deps, functional setState, refs     |

---

### Multi-Step Tasks

**Auto-apply `writing-plans` when:**

- Task has 3+ steps
- Feature requires multiple files
- Implementation needs coordination

**Plan Structure:**

- Save to `docs/plans/YYYY-MM-DD-<feature>.md`
- Each step = ONE action (2-5 minutes)
- Include exact file paths
- Include complete code snippets
- Include test commands with expected output

---

## VERIFICATION COMMANDS (KhipuVault)

**Before claiming success, run these:**

| Claim          | Command                               | Expected              |
| -------------- | ------------------------------------- | --------------------- |
| Tests pass     | `pnpm test`                           | All green, 0 failures |
| Types correct  | `pnpm typecheck`                      | No errors             |
| Lint clean     | `pnpm lint`                           | No errors             |
| Build succeeds | `pnpm build`                          | Exit 0                |
| Contracts pass | `cd packages/contracts && forge test` | All green             |

---

## ANTI-PATTERNS (NEVER DO)

### Debugging

- Proposing fixes without investigation
- Multiple changes at once
- "Just try this and see"
- Ignoring error messages

### Testing

- Writing tests after implementation
- Tests that pass immediately
- Keeping code written before tests
- Skipping "just this once"

### Completion

- Claiming success without running commands
- Using "should", "probably", "seems to"
- Trusting previous test runs
- Expressing satisfaction before verification

### Frontend

- Using Inter, Arial, Roboto, system fonts
- Purple gradients on white (AI slop)
- Cookie-cutter layouts
- Generic component patterns

---

## SKILL REFERENCE

| Trigger         | Skill                            | Key Action                     |
| --------------- | -------------------------------- | ------------------------------ |
| New feature     | `brainstorming`                  | Ask questions, propose options |
| Bug/error       | `systematic-debugging`           | Root cause first               |
| Implementation  | `test-driven-development`        | Test fails before code         |
| UI work         | `frontend-design`                | Bold aesthetic choices         |
| React code      | `vercel-react-best-practices`    | Performance patterns           |
| Multi-step task | `writing-plans`                  | Detailed plan document         |
| Claiming done   | `verification-before-completion` | Run commands first             |
| Code review     | `requesting-code-review`         | Evidence before merge          |
| Parallel work   | `dispatching-parallel-agents`    | Independent tasks              |

---

## REMEMBER

```
Brainstorm → Plan → Test First → Implement → Verify → Complete
```

**Every step has a skill. Use them automatically.**
