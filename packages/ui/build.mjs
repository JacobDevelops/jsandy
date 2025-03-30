import fs from "node:fs";
import { cpus } from "node:os";
import path from "node:path";
import * as esbuild from "esbuild";
import { globSync } from "glob";
import * as tsup from "tsup";

const numCPUs = cpus().length;

async function buildFile(filePath) {
  const file = `${filePath}/index.ts`;
  const dist = `dist/${filePath.split("/").slice(1).join("/")}`;

  // Check if the file exists before proceeding
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${filePath}: index.ts not found`);
    return;
  }

  const esbuildConfig = {
    entryPoints: [file],
    external: ["class-variance-authority", "@jsandy/ui/*"],
    packages: "external",
    bundle: true,
    sourcemap: true,
    target: "es2022",
    outdir: dist,
  };

  // Build CJS and ESM in parallel
  await Promise.all([
    esbuild.build({ ...esbuildConfig, format: "cjs" }),
    esbuild.build({
      ...esbuildConfig,
      format: "esm",
      outExtension: { ".js": ".mjs" },
    }),
  ]);

  console.log(`Built ${filePath}/dist/index.js and index.mjs`);

  // Generate d.ts and d.mts files
  await tsup.build({
    entry: [file],
    dts: { only: true },
    format: ["cjs", "esm"],
    outDir: dist,
    silent: true,
    clean: false,
    esbuildPlugins: [
      {
        name: "rewrite-cva-import",
        setup(build) {
          build.onResolve(
            { filter: /^class-variance-authority\/dist\/types$/ },
            (_args) => {
              return {
                path: "class-variance-authority/types",
                external: true,
              };
            }
          );
        },
      },
    ],
  });

  // Rename .d.ts to .d.mts for ESM
  const dtsPath = path.join(dist, "index.d.ts");
  const dmtsPath = path.join(dist, "index.d.mts");
  await fs.promises.copyFile(dtsPath, dmtsPath);

  // Rewrite imports in d.ts and d.mts files
  for (const file of [dtsPath, dmtsPath]) {
    let content = await fs.promises.readFile(file, "utf8");
    content = content.replace(
      "import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';",
      "import type * as class_variance_authority_dist_types from 'class-variance-authority/types';"
    );
    await fs.promises.writeFile(file, content);
  }

  console.log(`Built ${filePath}/dist/index.d.ts and index.d.mts`);
}

async function buildAll() {
  // Exclude the icons directory
  const paths = [
    ...globSync("src/*/*"),
    "src/components/form/resolvers",
  ];

  // Create a shared esbuild context
  const ctx = await esbuild.context({});

  // Process files in batches
  const batchSize = numCPUs;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    await Promise.all(batch.map(buildFile));
  }

  // Dispose of the esbuild context
  await ctx.dispose();

  console.log("All builds completed successfully.");
}

async function buildCli() {
  console.log("Building CLI...");

  await esbuild.build({
    entryPoints: ["src/cli/index.ts"],
    bundle: true,
    platform: "node",
    target: "node18",
    external: ["inquirer", "commander", "@jsandy/ui/*"],
    outfile: "dist/cli/index.js",
    format: "cjs",
    banner: {
      js: "#!/usr/bin/env node\n",
    },
    sourcemap: true,
  });

  console.log("CLI built successfully");
}

console.time("Build time");
await buildAll();
await buildFile("src/icons");
await buildCli();
console.timeEnd("Build time");
