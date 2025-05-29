# JSandy Build Tool

JSandy Builder Tool is a powerful and flexible build utility designed to compile TypeScript projects with ease. It leverages esbuild for fast JavaScript compilation and tsup for generating TypeScript declaration files.

## Features

- Fast compilation using esbuild
- Generates both CommonJS (.js) and ES Modules (.mjs) outputs
- Creates TypeScript declaration files (.d.ts)
- Configurable external dependencies
- Source map generation

## Usage

### As a Module

You can also use the build function programmatically in your Node.js scripts:

```javascript
import { build } from "@jsandy/build";

build("./src/index.ts")
  .then(() => console.log("Build completed successfully."))
  .catch((error) => console.error("Build failed:", error));
```

## API

### `build(path: string, external?: string[]): Promise<void>`

- `path`: The path to the entry file of your project.
- `external` (optional): An array of package names to be treated as external dependencies.

## Configuration

The build tool uses the following configuration:

- Target: ES2022
- Formats: CommonJS and ES Modules
- Source Maps: Enabled
- TypeScript Declarations: Generated

## Output

The build process generates the following files in the `dist` directory:

- `index.js`: CommonJS module
- `index.mjs`: ES Module
- `index.d.ts`: TypeScript declaration file
- `index.d.mts`: ES Module declaration file
