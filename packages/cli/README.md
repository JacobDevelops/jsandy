# create-jsandy-app

A CLI tool for scaffolding new jSandy applications with interactive prompts.

## Installation

```bash
npm create jsandy-app
# or
npx create-jsandy-app
# or
pnpm create jsandy-app
# or
yarn create jsandy-app
```

## Usage

### Interactive Mode

Run the CLI without arguments to enter interactive mode:

```bash
npx create-jsandy-app
```

### Quick Start

You can also provide a project name directly:

```bash
npx create-jsandy-app my-app
```

### Options

- `--noInstall` - Skip automatic dependency installation

```bash
npx create-jsandy-app my-app --noInstall
```

## Features

- **Interactive Setup**: Guided prompts for project configuration
- **Database ORM Support**: Choose between no ORM or Drizzle ORM
- **Multiple Database Providers**: Support for PostgreSQL, Neon, and Vercel Postgres
- **Automatic Dependency Installation**: Detects your package manager and installs dependencies
- **TypeScript Ready**: Full TypeScript support out of the box

## What's Included

The CLI generates a modern jSandy application with:

- Next.js 14+ with App Router
- TypeScript configuration
- TailwindCSS for styling
- ESLint and Prettier setup
- Hono API routes
- Optional Drizzle ORM with database providers
- Development and production build scripts

## Development

To run the CLI locally:

```bash
bun install
bun run dev
```

To build:

```bash
bun run build
```
