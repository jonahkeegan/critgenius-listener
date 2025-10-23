# Infrastructure Tests

## Test Organization

### Basic Validation Tests

- **File**: `*-validator.test.ts`
- **When**: Always run in CI (`build-and-validate` job)
- **Purpose**: Validate scripts, configs, and structure
- **Dependencies**: Uses programmatic test fixtures

### Integration Tests

- **File**: `*.integration.test.ts`
- **When**: Run in `validate-coverage` job (after coverage generation)
- **Purpose**: Validate real coverage data and artifacts
- **Dependencies**: Requires actual coverage generation

## Running Tests Locally

```bash
# Basic validation (always works)
pnpm run test:infrastructure

# Integration tests (requires coverage first)
pnpm run test:coverage:thematic
pnpm run test:infrastructure:integration

# Or run both together
pnpm run test:coverage:thematic && pnpm run test:infrastructure:integration
```

## Test Fixtures

Basic validation tests use programmatic fixtures to ensure tests can run without real coverage.
Integration tests validate real coverage data.

> Note: The integration script targets `coverage-orchestration-integration.test.ts`. Add additional
> integration suites by extending the script or invoking
> `vitest run --config vitest.infrastructure.config.ts <new-test-file>` directly.
