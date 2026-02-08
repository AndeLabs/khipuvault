# License Compliance Policy

**Version:** 1.0
**Last Updated:** 2026-02-08
**Maintainer:** KhipuVault Security Team

## Overview

This document outlines KhipuVault's license compliance policy for all third-party dependencies. We enforce automated license checking to ensure all dependencies are compatible with our proprietary software and avoid legal issues.

## Why License Compliance Matters

Open-source licenses come with different obligations:

- **Permissive licenses** allow use in proprietary software without requiring source disclosure
- **Weak copyleft** licenses may require disclosure under certain conditions
- **Strong copyleft** licenses require source code disclosure of derivative works, incompatible with proprietary software

Failing to comply with license terms can result in:

- Legal liability and lawsuits
- Forced disclosure of proprietary source code
- Reputational damage
- Requirement to remove features or rewrite code

## License Categories

### Allowed Licenses (Green)

These licenses are **pre-approved** and can be used without restriction:

| License               | Type          | Notes                           |
| --------------------- | ------------- | ------------------------------- |
| MIT                   | Permissive    | Most common, very permissive    |
| Apache-2.0            | Permissive    | Includes patent grant           |
| BSD-2-Clause          | Permissive    | Simple permissive license       |
| BSD-3-Clause          | Permissive    | Includes non-endorsement clause |
| ISC                   | Permissive    | Similar to MIT                  |
| 0BSD                  | Permissive    | Public domain equivalent        |
| CC0-1.0               | Public Domain | Creative Commons public domain  |
| CC-BY-3.0 / CC-BY-4.0 | Attribution   | Requires attribution            |
| Unlicense             | Public Domain | Releases to public domain       |
| WTFPL                 | Permissive    | "Do What The F\*\*\* You Want"  |

**Dual licenses** with allowed options are also permitted:

- `(MIT OR Apache-2.0)`
- `(BSD-3-Clause OR MIT)`
- `(Apache-2.0 OR MIT)`

### Warning Licenses (Yellow)

These licenses require **legal review** before use:

| License             | Type          | Concern                                     |
| ------------------- | ------------- | ------------------------------------------- |
| MPL-2.0             | Weak Copyleft | File-level copyleft                         |
| EPL-1.0 / EPL-2.0   | Weak Copyleft | Eclipse Public License                      |
| LGPL-2.1 / LGPL-3.0 | Weak Copyleft | Library copyleft, dynamic linking allowed   |
| CDDL-1.0 / CDDL-1.1 | Weak Copyleft | Common Development and Distribution License |
| CPL-1.0             | Weak Copyleft | IBM Common Public License                   |
| OSL-3.0             | Copyleft      | Open Software License                       |

**Action Required:**

1. Create a GitHub issue documenting the dependency
2. Contact legal team for review
3. Wait for approval before merging
4. Add exception to `.licenserc.json` if approved

### Blocked Licenses (Red)

These licenses are **prohibited** and will fail CI:

| License             | Type             | Why Blocked                                              |
| ------------------- | ---------------- | -------------------------------------------------------- |
| GPL-2.0 / GPL-3.0   | Strong Copyleft  | Requires source disclosure of derivative works           |
| AGPL-1.0 / AGPL-3.0 | Network Copyleft | Triggers on network use, requires full source disclosure |
| SSPL-1.0            | Server-Side      | Service provider must open source entire stack           |
| Commons Clause      | Restrictive      | Prohibits commercial use                                 |
| BUSL-1.1            | Time-limited     | Business Source License, eventually converts to OSS      |

**Action Required:**

1. Immediately remove or replace the dependency
2. Find an alternative with an allowed license
3. Consider implementing the functionality yourself
4. Document the replacement in the PR

## Checking License Compliance

### Automated Checks

License compliance is automatically checked:

1. **On every PR**: GitHub Actions runs license check and comments on PR
2. **Pre-commit hook**: (Optional) Can be enabled to check before commit
3. **Manual check**: Run `pnpm license:check` anytime

### Manual Check

```bash
# Run full license compliance check
pnpm license:check

# Generate JSON report only
pnpm license:report

# Generate CSV report
pnpm license:report:csv
```

### Understanding Reports

**JSON Report** (`license-report.json`):

- Complete license data for every dependency
- Includes license text locations
- Used for detailed analysis

**Markdown Report** (`license-report.md`):

- Human-readable summary
- Lists problematic packages
- Includes remediation guidance

## Handling License Issues

### Scenario 1: Blocked License Detected

```
ERROR: Package "some-package@1.0.0 (GPL-3.0)" found
```

**Steps:**

1. Find an alternative package with allowed license
2. Fork and relicense (if permissible)
3. Implement functionality yourself
4. Remove the feature requiring this dependency

**Resources:**

- [npm alternatives](https://npms.io/)
- [Snyk Advisor](https://snyk.io/advisor/)
- [LibHunt](https://www.libhunt.com/)

### Scenario 2: Warning License Detected

```
WARNING: Package "some-package@1.0.0 (LGPL-2.1)" requires review
```

**Steps:**

1. Create GitHub issue: "Legal Review: [package-name] ([license])"
2. Include in issue:
   - Package purpose and usage
   - How we link to it (dynamic/static)
   - Alternative packages (if any)
3. Tag legal team: `@legal-team`
4. Wait for approval
5. If approved, add to exceptions in `.licenserc.json`

### Scenario 3: Unknown License

```
WARNING: Package "some-package@1.0.0 (UNKNOWN)" has no license
```

**Steps:**

1. Check package repository for LICENSE file
2. Check package.json for license field
3. Contact package maintainer
4. If no license found: **treat as blocked** (no license = no permission to use)

## License Exceptions

If a package with a warning license is approved by legal, add an exception:

```json
// .licenserc.json
{
  "exceptions": {
    "packages": [
      {
        "name": "package-name",
        "version": "1.0.0",
        "license": "LGPL-2.1",
        "approved_by": "legal-team",
        "approved_date": "2026-02-08",
        "reason": "Dynamic linking only, legal review completed",
        "issue": "#123"
      }
    ]
  }
}
```

## Configuration

License policy is defined in `.licenserc.json`:

```json
{
  "allowedLicenses": ["MIT", "Apache-2.0", ...],
  "warnLicenses": ["MPL-2.0", "LGPL-2.1", ...],
  "blockedLicenses": ["GPL-3.0", "AGPL-3.0", ...],
  "exceptions": { ... }
}
```

### Modifying Policy

**To add an allowed license:**

1. Research the license obligations
2. Create PR updating `.licenserc.json`
3. Get approval from 2+ maintainers
4. Document reasoning in PR

**To remove a license from blocked list:**

1. Get written legal approval
2. Create PR with legal team approval
3. Document reasoning and approval
4. Requires security team + legal team approval

## Best Practices

### For Developers

1. **Check before adding**: Review licenses before adding dependencies
2. **Prefer MIT/Apache-2.0**: Choose packages with permissive licenses
3. **Run checks locally**: `pnpm license:check` before submitting PR
4. **Document exceptions**: If exception needed, create issue first
5. **Keep dependencies minimal**: Fewer dependencies = fewer license issues

### For Reviewers

1. **Verify license check passed**: Don't merge if license check fails
2. **Review new dependencies**: Check licenses of new packages manually
3. **Question exceptions**: Ensure exceptions are properly documented
4. **Consider alternatives**: Suggest alternative packages if licenses are problematic

### For Maintainers

1. **Regular audits**: Review license compliance quarterly
2. **Update policy**: Keep `.licenserc.json` current with legal guidance
3. **Monitor changes**: Watch for license changes in dependencies
4. **Educate team**: Ensure all contributors understand policy

## CI/CD Integration

License checks run automatically on:

- **Pull Requests**: Checks all dependencies, comments on PR
- **Main branch**: Runs on every push
- **Scheduled**: Daily scan for license changes

**CI will fail if:**

- Blocked license detected
- License check script fails
- Configuration file missing or invalid

**CI will warn if:**

- Warning license detected (but won't fail)
- Unknown license detected

## FAQ

### Q: Why can't we use LGPL?

**A:** LGPL requires source disclosure of modifications to the LGPL'd code. While dynamic linking exempts us from disclosing our code, it's safer to avoid and get legal review first.

### Q: What if a dependency changes license?

**A:** Our automated checks will detect this. The update will fail CI. You must:

1. Evaluate new license
2. Get approval if needed
3. Or pin to old version
4. Or find alternative

### Q: Can I use a GPL library if I don't distribute it?

**A:** Even for internal use, it's risky. AGPL especially triggers on network use. Best to avoid entirely or get legal review.

### Q: What about dev dependencies?

**A:** Current policy checks production dependencies only. Dev dependencies (test tools, build tools) are lower risk but should still prefer permissive licenses.

### Q: The license check is wrong!

**A:** License detection isn't perfect. If you believe it's a false positive:

1. Manually verify the actual license
2. Create issue documenting the error
3. Update `.licenserc.json` if needed
4. Consider contributing fix to license-checker

## Resources

### License References

- [Choose a License](https://choosealicense.com/) - License comparison guide
- [TLDRLegal](https://tldrlegal.com/) - Plain English license explanations
- [SPDX License List](https://spdx.org/licenses/) - Official license identifiers
- [GitHub License API](https://docs.github.com/en/rest/licenses) - Programmatic license access

### Tools

- [license-checker](https://www.npmjs.com/package/license-checker) - Our license scanning tool
- [FOSSA](https://fossa.com/) - Commercial license compliance (paid)
- [WhiteSource](https://www.whitesourcesoftware.com/) - Enterprise license management (paid)

### Legal

For legal questions, contact:

- **Email:** legal@khipuvault.com
- **Slack:** #legal-questions
- **GitHub:** `@legal-team`

## Version History

| Version | Date       | Changes                                      |
| ------- | ---------- | -------------------------------------------- |
| 1.0     | 2026-02-08 | Initial policy, automated checks implemented |

## License of This Document

This policy document is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).

You are free to copy, adapt, and use this policy in your own projects with attribution.
