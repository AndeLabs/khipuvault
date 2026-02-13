# Vercel Deployment Skill

Expert skill for deploying Next.js monorepos to Vercel with pnpm.

## When to Use

- Setting up new Vercel projects for monorepo apps
- Fixing deployment errors in Vercel
- Configuring environment variables for different branches
- Managing production/preview deployments

## Prerequisites

- Vercel API token
- Project ID
- Team ID (if using teams)

## Best Practices (2026)

### Monorepo Configuration

For pnpm monorepos, the install command MUST navigate to root:

```bash
installCommand: "cd ../.. && pnpm install --frozen-lockfile"
buildCommand: "cd ../.. && pnpm turbo run build --filter=@your-org/app"
```

### Project Settings

```json
{
  "rootDirectory": "apps/web",
  "framework": "nextjs",
  "nodeVersion": "22.x",
  "sourceFilesOutsideRootDirectory": true
}
```

### Environment Variables

**Production (main branch)**:

- Target: `production`
- No `gitBranch` field

**Preview (other branches)**:

- Target: `preview`
- Set `gitBranch: "branch-name"` for specific branches

**NEVER use secret references** in vercel.json:

```json
// ❌ BAD
{
  "env": {
    "NEXT_PUBLIC_NETWORK": "@next-public-network"
  }
}

// ✅ GOOD
// Set environment variables via Vercel dashboard or API only
```

## Common Commands

### Update Project Configuration

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/{projectId}?teamId={teamId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
    "buildCommand": "cd ../.. && pnpm turbo run build --filter=@org/app",
    "framework": "nextjs",
    "nodeVersion": "22.x"
  }'
```

### Add Environment Variable

```bash
curl -X POST "https://api.vercel.com/v8/projects/{projectId}/env?teamId={teamId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VARIABLE_NAME",
    "value": "value",
    "type": "plain",
    "target": ["production"],
    "gitBranch": null
  }'
```

### Trigger Deployment

```bash
# Via deploy hook (recommended)
curl -X POST "https://api.vercel.com/v1/integrations/deploy/{projectId}/{hookId}"

# Via API (manual)
curl -X POST "https://api.vercel.com/v13/deployments?forceNew=1&teamId={teamId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "project-name",
    "project": "{projectId}",
    "target": "production",
    "gitSource": {
      "type": "github",
      "repoId": 123456,
      "ref": "main",
      "sha": "commit-sha"
    }
  }'
```

### Check Deployment Status

```bash
curl -s "https://api.vercel.com/v6/deployments?teamId={teamId}&projectId={projectId}&limit=5" \
  -H "Authorization: Bearer {token}" \
  | jq '.deployments[] | {url: .url, state: .readyState, target: .target}'
```

## Troubleshooting

### Error: "npm install exited with 1"

**Cause**: Project is using npm instead of pnpm
**Fix**: Update installCommand to use pnpm with monorepo navigation

### Error: "Environment Variable references Secret which does not exist"

**Cause**: vercel.json contains invalid secret reference
**Fix**: Remove `env` section from vercel.json, set variables via API/dashboard

### Error: "The provided GitHub repository does not contain the requested branch"

**Cause**: SHA doesn't exist or branch not pushed
**Fix**: Verify commit is pushed: `git rev-parse HEAD && git push`

### Deployments are CANCELED

**Cause**: GitHub integration auto-canceling due to multiple triggers
**Fix**: Use deploy hooks instead of manual API deployments

### 404: DEPLOYMENT_NOT_FOUND

**Cause**: No production deployment assigned to domain
**Fix**:

1. Check domains: `GET /v9/projects/{projectId}/domains`
2. Verify production deployment exists with correct target
3. Trigger new deployment via deploy hook

## Workflow

### Initial Setup

1. Create Vercel project linked to GitHub repo
2. Configure project settings (rootDirectory, commands, nodeVersion)
3. Set environment variables for production and preview
4. Add custom domains
5. Configure DNS (CNAME to cname.vercel-dns.com)
6. Create deploy hooks for automated deployments

### Network-Specific Deployment (Testnet/Mainnet)

1. Create branches: `main` (production), `testnet` (preview)
2. Set `NEXT_PUBLIC_NETWORK=mainnet` for production target
3. Set `NEXT_PUBLIC_NETWORK=testnet` for preview target with `gitBranch: "testnet"`
4. Add domains:
   - Production: `example.com`
   - Preview: `testnet.example.com` (with `gitBranch: "testnet"`)
5. Trigger deployments via deploy hooks

## References

- [Vercel Monorepo Docs](https://vercel.com/docs/monorepos)
- [Vercel API Docs](https://docs.vercel.com/docs/rest-api)
- [pnpm Workspaces](https://pnpm.io/workspaces)
