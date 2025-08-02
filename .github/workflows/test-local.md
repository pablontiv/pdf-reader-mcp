# Testing the CI/CD Pipeline Locally

You can test the GitHub Actions pipeline locally before pushing to GitHub:

## Prerequisites

Make sure you have Node.js 20.x or 22.x installed:

```bash
node --version
npm --version
```

## Run the Same Steps as CI

1. **Install dependencies**:
   ```bash
   npm ci
   ```

2. **Type check**:
   ```bash
   npm run typecheck
   ```

3. **Lint code**:
   ```bash
   npm run lint
   ```

4. **Run tests**:
   ```bash
   npm test -- --run
   ```

5. **Build project**:
   ```bash
   npm run build
   ```

6. **Verify build output**:
   ```bash
   # Check if dist directory exists
   ls -la dist/
   
   # Check if main file exists
   ls -la dist/index.js
   ```

7. **Security audit**:
   ```bash
   npm audit --audit-level=moderate
   npm audit --audit-level=high --dry-run
   ```

## Expected Results

- All commands should complete without errors
- The `dist/` directory should be created with compiled JavaScript files
- Tests should pass (15 tests in 2 test files)
- No high-severity security vulnerabilities should be found

## Next Steps

Once all tests pass locally, you can:

1. Commit your changes to GitHub
2. The CI/CD pipeline will automatically run on push/PR
3. Status badges in README.md will reflect the build status

## Troubleshooting

- If ESLint fails, check the `.eslintrc.json` configuration
- If tests fail, run `npm test` (with watch mode) to debug
- If build fails, check TypeScript errors with `npm run typecheck`