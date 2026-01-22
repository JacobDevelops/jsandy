import path from "node:path";
import { intro, isCancel, outro, select, text } from "@clack/prompts";
import color from "picocolors";
import {
	detectMonorepo,
	detectPackageManager,
	type MonorepoInfo,
} from "@/utils/monorepo-detection";

export type Linter = "none" | "eslint" | "biome";
interface CliResults {
	projectName: string;
	orm: "none" | "drizzle" | undefined;
	dialect?: "postgres" | undefined;
	provider?:
		| "neon"
		| "postgres"
		| "vercel-postgres"
		| "planetscale"
		| undefined;
	linter: Linter | undefined;
	setupVSCode?: boolean; // New option
	noInstall?: boolean;
	monorepoInfo?: MonorepoInfo;
}

export async function runCli(): Promise<CliResults | undefined> {
	console.clear();

	// Parse command line arguments manually
	const args = process.argv.slice(2);
	const cliProvidedName = args[0]?.startsWith("--") ? undefined : args[0];
	const noInstallFlag = args.includes("--noInstall");

	intro(color.bgCyan(" jSandy CLI "));

	const projectName =
		cliProvidedName ||
		(await text({
			message: "What will your project be called?",
			placeholder: "my-jsandy-app",
			validate: (value) => {
				if (!value) return "Please enter a project name";
				if (value.length > 50)
					return "Project name must be less than 50 characters";
				return;
			},
		}));

	if (isCancel(projectName)) {
		outro("Setup cancelled.");
		return undefined;
	}

	// Detect monorepo setup
	const projectDir = path.resolve(process.cwd(), projectName as string);
	const monorepoInfo = await detectMonorepo(projectDir);

	if (monorepoInfo.isMonorepo) {
		console.log(color.dim(`  Detected monorepo at: ${monorepoInfo.rootPath}`));
		if (monorepoInfo.packageManager) {
			console.log(
				color.dim(`  Package manager: ${monorepoInfo.packageManager}`),
			);
		}
		if (monorepoInfo.linter) {
			console.log(color.dim(`  Linter: ${monorepoInfo.linter}`));
		}
	}

	const orm = await select<"none" | "drizzle">({
		message: "Which database ORM would you like to use?",
		options: [
			{ label: "None", value: "none" },
			{ label: "Drizzle ORM", value: "drizzle" },
		],
	});

	if (isCancel(orm)) {
		outro("Setup cancelled.");
		return undefined;
	}

	let dialect: CliResults["dialect"];
	let provider: CliResults["provider"];
	if (orm === "drizzle") {
		dialect = "postgres" as const; // Only offering postgres

		provider = (await select({
			message: "Which Postgres provider would you like to use?",
			options: [
				{ label: "PostgreSQL", value: "postgres" },
				{ label: "Neon", value: "neon" },
				{ label: "Vercel Postgres", value: "vercel-postgres" },
				{ label: "PlanetScale", value: "planetscale" },
			],
		})) as CliResults["provider"];

		if (isCancel(provider)) {
			outro("Setup cancelled.");
			return undefined;
		}
	}

	// Skip linter prompt if detected in monorepo
	let linter: Linter | undefined;
	if (monorepoInfo.isMonorepo && monorepoInfo.linter) {
		linter = monorepoInfo.linter;
		console.log(color.dim(`  Using monorepo linter: ${linter}`));
	} else {
		linter = await select<"none" | "eslint" | "biome">({
			message: "Which linter would you like to use?",
			options: [
				{ label: "None", value: "none" },
				{ label: "ESLint", value: "eslint" },
				{ label: "Biome", value: "biome" },
			],
		});

		if (isCancel(linter)) {
			outro("Setup cancelled.");
			return undefined;
		}
	}

	// Skip VSCode settings for monorepos
	let setupVSCode: boolean | undefined = false;
	if (!monorepoInfo.isMonorepo) {
		setupVSCode = await select({
			message:
				"Would you like to set up recommended VS Code workspace settings?",
			options: [
				{
					label: "Yes - Configure VS Code settings and extensions",
					value: true,
				},
				{
					label: "No - Skip VS Code configuration",
					value: false,
				},
			],
		});

		if (isCancel(setupVSCode)) {
			outro("Setup cancelled.");
			return undefined;
		}
	}

	let noInstall = noInstallFlag;
	if (!noInstall) {
		// Use monorepo package manager if detected, otherwise detect from lockfiles
		const pkgManager =
			monorepoInfo.packageManager || detectPackageManager(process.cwd());
		const shouldInstall = await select({
			message: `Should we run '${pkgManager}${
				pkgManager === "yarn" ? "" : " install"
			}' for you?`,
			options: [
				{ label: "Yes", value: true },
				{ label: "No", value: false },
			],
		});
		if (isCancel(shouldInstall)) {
			outro("Setup cancelled.");
			return undefined;
		}
		noInstall = !shouldInstall;
	}

	return {
		dialect,
		linter,
		monorepoInfo,
		noInstall,
		orm,
		projectName: projectName as string,
		provider,
		setupVSCode,
	};
}
