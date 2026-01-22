# create-jsandy-app

## 1.2.0

### Minor Changes

- 1d2060b: ## Dependency Updates

  Updated all dependencies to their latest versions:

  - **Biome**: 1.9.4 → 2.3.11 (major version with new config format)
  - **Next.js**: 15.3.3 → 16.1.4 (major version)
  - **@types/node**: 22 → 25
  - **React/React-DOM**: 19.1.0 → 19.2.3
  - **Hono**: 4.7.11 → 4.11.5
  - **Wrangler**: 4.19.1 → 4.59.3
  - **Zod**: 4.0.5 → 4.3.5
  - **Tailwind Merge**: 3.3.0 → 3.4.0

  ## Migrated to Bun APIs

  Replaced all Node.js `fs-extra` usage with Bun's native APIs:

  - File operations now use `Bun.write()` and `Bun.file()`
  - Shell commands use `Bun.spawnSync()`
  - All installers are now properly async
  - Removed `fs-extra` dependency

  ## Biome v2 Configuration

  Updated Biome configuration to v2 format:

  - New schema URL for 2.3.11
  - Changed from `include`/`ignore` to `includes` with negation patterns
  - Added `assist.actions.source` for import organization
  - Added domain-specific linting for Next.js and React

  ## Cloudflare Workers Type Generation

  Improved type generation for Cloudflare Workers:

  - Types are now generated dynamically using `wrangler types` during scaffolding
  - Removed static `worker-configuration.d.ts` template
  - Generated file is no longer gitignored (should be committed)
  - Generated file is formatted with the chosen formatter (Biome or Prettier)
  - Linter configs ignore the generated file to prevent errors
  - Added `generate-types` script for manual regeneration

  ## Monorepo Support

  Added comprehensive monorepo detection and configuration:

  - Detects monorepo root by looking for workspace markers (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, or `workspaces` in package.json)
  - Detects package manager from lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`)
  - Detects existing linter/formatter from root `package.json`
  - Skips linter prompt when already configured in monorepo root
  - Skips VSCode settings prompt for monorepo projects
  - Biome config extends from root config in monorepos (uses `"extends": ["../../biome.json"]`)
  - Skips adding duplicate dependencies already present in monorepo root

  ## Package Manager Detection

  Improved package manager detection:

  - Now checks lockfiles first instead of relying on the command used to run the CLI
  - More reliable in monorepo environments where the lockfile is in a parent directory
  - Falls back to user agent detection if no lockfile found

  ## Environment Files

  Added `.env.example` generation:

  - Creates `.env.example` alongside `.env` for database configurations
  - Helps users understand which environment variables need to be set

## 1.1.3

### Patch Changes

- db285ec: bump deps
- 537fc8e: convert `wrangler.jsonc` to `wrangler.toml`
- 3c56aa2: Loosen restrictions on createClient baseUrl param

## 1.1.2

### Patch Changes

- 55ca62e: Update Minor Version of `@jsandy/rpc` dependency

## 1.1.1

### Patch Changes

- 9bc89b1: Fix bug where it would import from `"jsandy"` instead of `"@jsandy/rpc"`

## 1.1.0

### Minor Changes

- 84d921a: Added support for biome linting / formatting
- e83d269: Add support for vscode directory setup

### Patch Changes

- 1885061: Fix typo in library import

## 1.0.1

### Patch Changes

- 2e9a6e0: Fix node runtime declaration for CLI
- 4bb3cf7: Fix Externals to include rpc package and stop depending on workspace
- Updated dependencies [8e986d2]
  - @jsandy/rpc@1.1.1

## 1.0.0

### Major Changes

- 9f16b74: Initial publish of jsandy CLI

### Patch Changes

- dd8963e: Minor Updates of Dependencies
- Updated dependencies [dd8963e]
- Updated dependencies [e792622]
- Updated dependencies [e792622]
  - @jsandy/rpc@1.1.0
