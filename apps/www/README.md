# @jsandy/www

The documentation website package for JSandy - built with Next.js 15 and modern web technologies.

## Overview

This package contains the official documentation website for JSandy, featuring comprehensive guides, API references, and examples for developers.

## Development

From the monorepo root or this package directory:

```bash
npm run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000).

## Package Scripts

- `dev` - Start development server with Turbopack
- `build` - Build for production
- `start` - Start production server  
- `check-types` - TypeScript type checking

## Architecture

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Content**: MDX with Content Collections
- **Components**: Radix UI + custom components
- **Search**: Upstash Vector-powered search
- **Backend**: Hono API routes for dynamic features

## Key Features

- 📚 MDX-powered documentation with syntax highlighting
- 🔍 Vector-based content search
- 🎨 Dark/light theme support
- 📱 Responsive design with mobile navigation
- ⚡ Fast builds with Turbopack
- 🔗 Automatic table of contents generation

## Dependencies

- `@jsandy/rpc` - Core JSandy RPC package (workspace dependency)
- Next.js 15 with React 19
- Tailwind CSS 4
- Content Collections for MDX processing
- Upstash services for search and caching
