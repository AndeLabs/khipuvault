# Workflow Comparison Matrix

## Feature Comparison

| Feature                | ci.yml (Original) | ci-enhanced.yml | security.yml | contracts.yml |
| ---------------------- | ----------------- | --------------- | ------------ | ------------- |
| **Lint**               | ✅                | ✅ + Prettier   | ❌           | ❌            |
| **TypeCheck**          | ✅                | ✅              | ❌           | ❌            |
| **Unit Tests**         | ✅                | ✅              | ❌           | ❌            |
| **Integration Tests**  | ❌                | ✅ (PostgreSQL) | ❌           | ❌            |
| **Build**              | ✅                | ✅              | ❌           | ❌            |
| **Contract Tests**     | ✅                | ❌              | ❌           | ✅            |
| **Gas Report**         | ✅                | ❌              | ❌           | ✅            |
| **Gas Regression**     | ✅ (10%)          | ❌              | ❌           | ✅ (5%)       |
| **Coverage**           | ✅                | ✅              | ❌           | ✅            |
| **npm audit**          | ✅                | ❌              | ✅           | ❌            |
| **Snyk**               | ❌                | ❌              | ✅           | ❌            |
| **Semgrep**            | ❌                | ❌              | ✅           | ❌            |
| **CodeQL**             | ❌                | ❌              | ✅           | ❌            |
| **Gitleaks**           | ❌                | ❌              | ✅           | ❌            |
| **Slither**            | ✅                | ❌              | ❌           | ✅            |
| **Mythril**            | ❌                | ❌              | ❌           | ✅ (optional) |
| **SARIF Upload**       | ✅                | ❌              | ✅           | ✅            |
| **Dependency Review**  | ❌                | ❌              | ✅ (PR)      | ❌            |
| **Security Scorecard** | ❌                | ❌              | ✅ (main)    | ❌            |
| **Daily Schedule**     | ❌                | ❌              | ✅           | ❌            |
| **Manual Dispatch**    | ❌                | ❌              | ✅           | ✅            |

## Trigger Comparison

| Trigger           | ci.yml | ci-enhanced.yml | security.yml | contracts.yml |
| ----------------- | ------ | --------------- | ------------ | ------------- |
| Push to main      | ✅     | ✅              | ✅           | ✅\*          |
| Push to develop   | ❌     | ✅              | ✅           | ✅\*          |
| PR to main        | ✅     | ✅              | ✅           | ✅\*          |
| PR to develop     | ❌     | ✅              | ✅           | ✅\*          |
| Schedule (daily)  | ❌     | ❌              | ✅ 2 AM UTC  | ❌            |
| Workflow dispatch | ❌     | ❌              | ✅           | ✅            |

\*Only when contract files change

## Job Flow Comparison

### ci.yml (Original)

```
lint ─┐
type ─┤
test ─┼─ contract-tests ─┐
      │                   ├─ security ─┐
      │                   │             ├─ contract-security ─┐
      │                   │             │                      │
      └───────────────────┴─────────────┴──────────────────────┴─ build
                                                                    └─ gas-regression (PR only)
```

### ci-enhanced.yml

```
setup
  ├─ lint ────────┐
  ├─ typecheck ───┤
  └─ test ────────┴─ build ─ integration ─ summary
```

### security.yml

```
dependency-audit ─┐
snyk-scan ────────┤
semgrep-scan ─────┤
codeql-analysis ──┤
secret-scanning ──┼─ security-summary
dependency-review ┤
security-scorecard┘
```

### contracts.yml

```
compile
  ├─ test ────────┐
  ├─ gas-report ──┤
  ├─ gas-snapshot ┤
  ├─ coverage ────┤
  ├─ slither ─────┤
  └─ mythril ─────┴─ contract-summary
```

## Performance Comparison

| Workflow        | Avg Duration | Jobs | Parallelization | Caching |
| --------------- | ------------ | ---- | --------------- | ------- |
| ci.yml          | ~25 min      | 7    | Medium          | ✅      |
| ci-enhanced.yml | ~15-20 min   | 7    | High            | ✅✅    |
| security.yml    | ~15-20 min   | 8    | High            | ✅      |
| contracts.yml   | ~20-25 min   | 8    | High            | ✅✅    |

## Resource Usage

| Workflow        | CPU Minutes\* | Storage\*\* | Network\*\*\* |
| --------------- | ------------- | ----------- | ------------- |
| ci.yml          | ~25           | Medium      | Medium        |
| ci-enhanced.yml | ~20           | Medium      | Medium        |
| security.yml    | ~25           | Low         | High          |
| contracts.yml   | ~30           | High        | Low           |

\*Billable minutes on GitHub-hosted runners
**Artifact storage usage \***Network transfer for dependencies

## Coverage Comparison

### Code Coverage

| Workflow        | TypeScript | Solidity | Reports             |
| --------------- | ---------- | -------- | ------------------- |
| ci.yml          | ✅         | ✅       | Codecov             |
| ci-enhanced.yml | ✅         | ❌       | Codecov + Artifacts |
| security.yml    | ❌         | ❌       | N/A                 |
| contracts.yml   | ❌         | ✅       | Codecov + LCOV      |

### Security Coverage

| Category                   | ci.yml       | ci-enhanced.yml | security.yml                 | contracts.yml          |
| -------------------------- | ------------ | --------------- | ---------------------------- | ---------------------- |
| Dependency Vulnerabilities | ✅ (audit)   | ❌              | ✅✅✅ (audit+Snyk+review)   | ❌                     |
| Code Security              | ❌           | ❌              | ✅✅✅ (Snyk+Semgrep+CodeQL) | ❌                     |
| Secret Detection           | ❌           | ❌              | ✅ (Gitleaks)                | ❌                     |
| Smart Contract Security    | ✅ (Slither) | ❌              | ❌                           | ✅✅ (Slither+Mythril) |
| License Compliance         | ❌           | ❌              | ✅ (Dependency Review)       | ❌                     |
| Security Best Practices    | ❌           | ❌              | ✅ (Scorecard)               | ❌                     |

## Recommended Usage Strategy

### For Every PR (Required)

```yaml
# Primary CI - must pass
ci.yml:
  - status: required
  - blocking: true
  - coverage: comprehensive

# Enhanced CI - additional checks
ci-enhanced.yml:
  - status: optional
  - blocking: false
  - coverage: integration tests
```

### For Security (Advisory)

```yaml
# Security scanning - informational
security.yml:
  - status: optional
  - blocking: false (warnings only)
  - coverage: comprehensive security
```

### For Contracts (Specialized)

```yaml
# Contract checks - required for contract changes
contracts.yml:
  - status: required (if contracts changed)
  - blocking: true (compile, test)
  - blocking: false (Slither, Mythril)
  - coverage: specialized contract analysis
```

## Migration Path

### Phase 1: Parallel Execution (Current)

- Run all workflows simultaneously
- Compare results and timing
- Adjust configurations as needed
- Monitor for issues

### Phase 2: Consolidation (Optional)

- Evaluate redundancy between ci.yml and ci-enhanced.yml
- Consider merging or deprecating one
- Update branch protection rules
- Communicate changes to team

### Phase 3: Optimization

- Fine-tune caching strategies
- Adjust parallelization
- Optimize security scans
- Review artifact retention

## Cost-Benefit Analysis

### ci.yml (Original)

**Pros:**

- Comprehensive coverage
- Well-tested and stable
- Single workflow to manage
- Includes gas regression

**Cons:**

- Longer execution time
- Less parallelization
- Limited security scanning
- No integration tests

### ci-enhanced.yml

**Pros:**

- Faster feedback (parallel jobs)
- Integration tests included
- Better caching strategy
- Prettier formatting check
- Multi-Node version support

**Cons:**

- Additional workflow to maintain
- Potential overlap with ci.yml
- Separate from contract tests

### security.yml

**Pros:**

- Comprehensive security coverage
- Multiple tools for defense-in-depth
- Daily scheduled scans
- SARIF integration with GitHub
- License compliance checks

**Cons:**

- Higher runner minute usage
- Requires additional secrets (SNYK_TOKEN)
- May have false positives
- Longer execution time

### contracts.yml

**Pros:**

- Specialized contract tooling
- Multiple security analyzers
- Gas regression tracking (5%)
- Mythril deep analysis
- Contract size validation

**Cons:**

- Longest execution time
- Most complex workflow
- Mythril can be slow
- Path filtering needed

## Decision Matrix

### When to Use ci.yml

- ✅ As primary CI pipeline
- ✅ For all PRs (required check)
- ✅ When you need comprehensive coverage
- ✅ When gas regression is critical

### When to Use ci-enhanced.yml

- ✅ For additional validation
- ✅ When you need integration tests
- ✅ For faster feedback loops
- ✅ When testing multiple Node versions

### When to Use security.yml

- ✅ For comprehensive security analysis
- ✅ On schedule (daily/weekly)
- ✅ Before major releases
- ✅ When security is paramount

### When to Use contracts.yml

- ✅ When contracts are modified
- ✅ For specialized contract analysis
- ✅ For gas optimization work
- ✅ Before contract deployments

## FAQ

### Q: Should I run all workflows?

**A:** Yes, they complement each other. ci.yml provides core CI, while others add specialized checks.

### Q: Which workflow should be required?

**A:** ci.yml should be required. Others can be optional but informative.

### Q: How do I handle workflow failures?

**A:**

- ci.yml/ci-enhanced.yml failures: Must fix before merge
- security.yml failures: Review findings, may be warnings
- contracts.yml failures: Must fix if contracts changed

### Q: Can I disable some workflows?

**A:** Yes, but not recommended. Each serves a specific purpose. Consider adjusting triggers instead.

### Q: How much will this cost?

**A:**

- Public repos: Free unlimited minutes
- Private repos: ~$80/month for 100 PRs (estimate)
- Consider self-hosted runners for heavy usage

### Q: Which workflow runs fastest?

**A:** ci-enhanced.yml (~15 min) due to optimized parallelization and caching.

### Q: Which workflow is most comprehensive?

**A:** security.yml for security, ci.yml for general CI, contracts.yml for contracts.

### Q: Can I run workflows locally?

**A:** Yes, using nektos/act for most jobs. See QUICK_REFERENCE.md.

### Q: How do I update workflow dependencies?

**A:** Update action versions in workflow files. Use Dependabot or Renovate for automation.

### Q: What if workflows conflict?

**A:** They shouldn't - they're designed to complement each other. Use concurrency control to prevent overlap.

## Best Practices

### DO ✅

1. Run all workflows for comprehensive coverage
2. Make ci.yml required, others optional
3. Review security findings regularly
4. Monitor workflow performance
5. Update dependencies promptly
6. Document workflow changes
7. Test workflows before deploying
8. Use caching effectively

### DON'T ❌

1. Disable workflows without understanding impact
2. Ignore security warnings
3. Skip required checks
4. Hardcode secrets in workflows
5. Run expensive jobs unnecessarily
6. Forget to update documentation
7. Ignore gas regressions
8. Block on informational findings

## Conclusion

The four workflows work together to provide:

1. **ci.yml**: Comprehensive CI pipeline (primary)
2. **ci-enhanced.yml**: Enhanced checks with integration tests (supplementary)
3. **security.yml**: Deep security analysis (advisory)
4. **contracts.yml**: Specialized contract validation (specialized)

**Recommendation**: Keep all workflows active. They provide complementary coverage and catch different types of issues. Adjust triggers and requirements based on your team's needs and budget.

---

**Last Updated**: 2024-02-08
**Workflow Versions**:

- ci.yml: v1.0 (existing)
- ci-enhanced.yml: v1.0 (new)
- security.yml: v1.0 (new)
- contracts.yml: v1.0 (new)
