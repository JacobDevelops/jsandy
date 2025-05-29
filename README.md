# JSandy

A modern TypeScript monorepo containing reusable packages and tools for building scalable applications.

## Packages

This monorepo includes the following packages:

### Core Packages

- `@jsandy/rpc`: A lightweight, TypeScript-based RPC framework built on Hono with WebSocket support
- `@jsandy/builder`: Build tooling and utilities for TypeScript projects
- `@jsandy/typescript-config`: Shared TypeScript configurations
- `@jsandy/biome-config`: Shared Biome configurations for linting and formatting

Each package is 100% [TypeScript](https://www.typescriptlang.org/) and designed for modern development workflows.

## Tools & Technologies

This monorepo uses modern development tools:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for fast linting and formatting
- [Turborepo](https://turbo.build/) for efficient monorepo management
- [Vitest](https://vitest.dev/) for fast unit testing
- [pnpm](https://pnpm.io/) for efficient package management

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.11.0+

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/JacobDevelops/jsandy.git
cd jsandy
pnpm install
```

### Development

To build all packages:

```bash
pnpm build
```

To run tests:

```bash
pnpm test
```

To format and lint code:

```bash
pnpm format
pnpm lint
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](licenses/LICENSE.md) file for details.

## Links

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TypeScript](https://www.typescriptlang.org/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
