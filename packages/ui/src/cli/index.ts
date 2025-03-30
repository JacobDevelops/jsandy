import { Command } from "commander";
import { init } from "./commands/init";

// Create the program
const program = new Command();

// Set up version and description
program
	.name("jsandy-design")
	.description("CLI for the JSandy UI")
	.version(process.env.npm_package_version || "1.0.0");

// Initialize command
program
	.command("init")
	.description("Initialize the JSandy UI in your project")
	.option("--skip-tailwind", "Skip Tailwind CSS setup")
	.option("--skip-css", "Skip CSS setup")
	.option("-y, --yes", "Skip all prompts and use defaults")
	.action(async (options) => {
		try {
			await init(options);
		} catch (error) {
			console.error("Error during initialization:", error);
			process.exit(1);
		}
	});

// Parse arguments
program.parse();

// If no arguments were provided, show help
if (process.argv.length === 2) {
	program.help();
}
