# create-jsandy-app Guide

Scaffold a new `@jsandy/rpc` project with a single command.

## Usage

```bash
bunx create-jsandy-app my-app
```

Or with npm:
```bash
npx create-jsandy-app my-app
```

## Available Templates

- **default** — Next.js App Router + `@jsandy/rpc` with example procedures
- **minimal** — Bare-bones setup with a single procedure
- **fullstack** — Full-stack with auth, database, and WebSocket examples

Select a template:
```bash
bunx create-jsandy-app my-app --template fullstack
```

## Project Structure

Generated project layout:

```
my-app/
  src/
    app/
      api/
        [...path]/
          route.ts          # API route handler
      page.tsx              # Home page
      layout.tsx
    server/
      routers/
        index.ts            # Main router
        users.ts            # Example user router
      procedures/
        users.ts            # Example procedures
      middleware/
        auth.ts             # Example auth middleware
    client/
      index.ts              # createClient setup
  package.json
  tsconfig.json
```

## After Scaffolding

```bash
cd my-app
bun install
bun dev
```

The development server starts at `http://localhost:3000` with the API available at `/api/*`.
