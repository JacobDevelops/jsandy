import { intro, isCancel, outro, select, text } from "@clack/prompts";
import color from "picocolors";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager";

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

	const linter = await select<"none" | "eslint" | "biome">({
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

	const setupVSCode = await select({
		message: "Would you like to set up recommended VS Code workspace settings?",
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

	let noInstall = noInstallFlag;
	if (!noInstall) {
		const pkgManager = getUserPkgManager();
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
		noInstall,
		orm,
		projectName: projectName as string,
		provider,
		setupVSCode,
	};
}
