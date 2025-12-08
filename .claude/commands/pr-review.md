---
description: Review code changes for pull request
argument-hint: branch (optional branch name to review)
---

# Pull Request Review

Review the current changes for a pull request:

1. **Get Changes**

   ```bash
   git status
   git diff --stat
   git diff
   ```

2. **Code Quality Checks**
   - Run linting: `pnpm lint`
   - Run type checking: `pnpm typecheck`
   - Run tests: `pnpm test`

3. **Review Criteria**

   **Functionality**
   - Does the code do what it's supposed to?
   - Are edge cases handled?
   - Are there any obvious bugs?

   **Security**
   - Input validation present?
   - No hardcoded secrets?
   - Proper authorization checks?

   **Performance**
   - No unnecessary re-renders (React)?
   - Efficient database queries?
   - No N+1 query problems?

   **Code Style**
   - Follows project conventions?
   - Meaningful variable/function names?
   - No commented-out code?

   **Testing**
   - Tests added for new functionality?
   - Tests pass?

4. **Generate Summary**
   - What changed (files, lines)
   - Potential issues found
   - Suggestions for improvement
   - Approval recommendation
