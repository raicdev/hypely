#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import z from "zod";
import prompts from "prompts";

/**
 * create-hypely
 * A minimal scaffolder like create-next-app with selectable templates.
 *
 * Dependencies: acommander, chalk, ora
 */

const packageManager = z.enum(["npm", "yarn", "pnpm", "bun"]);
type PackageManager = z.infer<typeof packageManager>;

const templateId = z.enum(["basic", "bun", "vercel", "vercel-bun", "cloudflare", "truly-fast", "mini"]);
type TemplateId = z.infer<typeof templateId>;

const templateSchema = z.object({
    id: templateId,
    name: z.string(),
    description: z.string(),
    requirements: z
        .object({
            packageManager: packageManager.optional(),
        })
        .optional(),
});
type Template = z.infer<typeof templateSchema>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const program = new Command();

    program
        .name("create-hypely")
        .description("Create a new project from Hypely templates")
        .version(await getVersionSafe())
        .argument("[dir]", "Project directory")
        .option("-t, --template <template>", "Template id")
        .option("--pm <pm>", "Package manager to use (npm|pnpm|yarn|bun)")
        .option("--no-install", "Skip dependency installation")
        .option("--no-git", "Skip git initialization")
        .action(run);

    await program.parseAsync(process.argv);
}

async function run(
    dirArg?: string,
    opts?: {
        template?: string;
        pm?: PackageManager;
        install?: boolean; // from --no-install inversion
        git?: boolean; // from --no-git inversion
    }
) {
    const spinner = ora();
    try {
        printHeader();

        // Step 1: Resolve project name/dir
        let projectName = dirArg;
        if (!projectName) {
            projectName = await askNonEmpty(
                "What is your project named? (my-hypely-app) ",
                "my-hypely-app"
            );
        }
        const targetDir = path.resolve(process.cwd(), projectName);
        // Step 2: Choose package manager
        let pm: PackageManager | undefined = normalizePM(opts?.pm);
        if (!pm) {
            pm = await detectPackageManager();
        }

        // Step 3: Select template
        let templateId = opts?.template as TemplateId | undefined;
        if (!templateId || !templates.some((t) => t.id === templateId)) {
            templateId = await promptTemplate(pm);
        }
        const template = templates.find((t) => t.id === templateId)!;

        // Step 4: Prepare directory
        await ensureProjectDir(targetDir);

        // Step 5: Generate files
        spinner.start(
            `Scaffolding ${chalk.cyan(template.name)} in ${chalk.bold(path.basename(targetDir))}`
        );
        // Resolve template directory robustly for both dev (repo) and packaged (dist) runs
        const templateDir = await resolveTemplateDir(template.id);
        if (!templateDir) {
            throw new Error(
                `Template folder not found: tried under ${path.join(__dirname, "templates")} and ../templates`
            );
        }

        const copyRecursive = (src: string, dest: string) => {
            const stat = fs.statSync(src);
            if (stat.isDirectory()) {
                fs.mkdirSync(dest, { recursive: true });
                for (const entry of fs.readdirSync(src)) {
                    const from = path.join(src, entry);
                    const to = path.join(
                        dest,
                        entry === "_gitignore" ? ".gitignore" : entry
                    );
                    copyRecursive(from, to);
                }
            } else if (stat.isFile()) {
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
            }
        };

        copyRecursive(templateDir, targetDir);
        spinner.succeed("Project scaffold created.");

        // Step 6: Initialize git
        if (opts?.git !== false) {
            const inited = await initGit(targetDir);
            if (inited) {
                spinner.succeed("Initialized a git repository.");
            } else {
                spinner.info("Skipped git initialization.");
            }
        } else {
            spinner.info("Skipped git initialization.");
        }

        // Step 7: Install dependencies
        let doInstall = opts?.install !== false;
        if (opts?.install === undefined) {
            const ans = await askYesNo(
                `Install dependencies with ${pm}? (Y/n) `,
                true
            );
            doInstall = ans;
        }
        if (doInstall) {
            spinner.start(`Installing dependencies with ${pm}...`);
            const ok = await installDeps(pm, targetDir);
            if (ok) spinner.succeed("Dependencies installed.");
            else spinner.fail("Dependency installation failed.");
        } else {
            spinner.info("Skipped dependency installation.");
        }

        // Step 8: Final tips
        const rel = path.relative(process.cwd(), targetDir) || ".";
        console.log();
        console.log(chalk.bold("Next steps:"));
        if (rel !== ".") console.log(`  1. cd ${rel}`);
        const scripts = suggestScripts(templateId);
        scripts.forEach((s, i) =>
            console.log(`  ${rel === "." ? i + 1 : i + 2}. ${s(pm)}`)
        );
        console.log();
        console.log(chalk.green("Done! Happy hacking."));
    } catch (err: any) {
        console.error(chalk.red("Error:"), err?.message ?? String(err));
        process.exitCode = 1;
    } finally {
        // no-op
    }
}

function printHeader() {
    const title = chalk.bold.cyan("create-hypely");
    console.log(
        title,
        chalk.dim("— Start a new project with selectable templates")
    );
    console.log();
}

async function askNonEmpty(message: string, defaultValue?: string): Promise<string> {
    // Use prompts to request a non-empty string, honoring a default.
    while (true) {
        const res = await prompts(
            {
                type: "text",
                name: "value",
                message,
                initial: defaultValue,
                validate: (v: string) => (v && v.trim().length > 0) || "Please provide a value.",
            },
            {
                onCancel: () => {
                    throw new Error("Operation cancelled by user.");
                },
            }
        );
        if (typeof res.value === "string" && res.value.trim()) return res.value.trim();
        if (defaultValue) return defaultValue;
        console.log(chalk.yellow("Please provide a value."));
    }
}

async function askYesNo(message: string, defaultYes: boolean): Promise<boolean> {
    const res = await prompts(
        {
            type: "toggle",
            name: "value",
            message: message.replace(/(\(Y\/n\)|\(y\/N\))?$/, "").trim(),
            initial: defaultYes,
            active: "Yes",
            inactive: "No",
        },
        {
            onCancel: () => {
                throw new Error("Operation cancelled by user.");
            },
        }
    );
    return !!res.value;
}

async function promptTemplate(
    packageManager: PackageManager
): Promise<TemplateId> {
    // Sort templates: compatible first, incompatible last
    // Sort templates: compatible first, incompatible last
    const sortedTemplates = templates.slice().sort((a, b) => {
        const aCompatible =
            !a.requirements?.packageManager ||
            a.requirements.packageManager === packageManager;
        const bCompatible =
            !b.requirements?.packageManager ||
            b.requirements.packageManager === packageManager;
        // Compatible templates come first
        if (aCompatible && !bCompatible) return -1;
        if (!aCompatible && bCompatible) return 1;
        return 0;
    });

    const res = await prompts(
        {
            type: "select",
            name: "tpl",
            message: "Select a template",
            choices: sortedTemplates.map((t) => ({
                title: `${t.name} ${chalk.dim(`(${t.id})`)} – ${t.description}` +
                    (t.requirements?.packageManager && t.requirements.packageManager !== packageManager
                        ? chalk.bold(` (requires ${t.requirements.packageManager})`)
                        : ""),
                value: t.id,
                disabled:
                    !!(
                        t.requirements?.packageManager &&
                        t.requirements.packageManager !== packageManager
                    ),
            })),
        },
        {
            onCancel: () => {
                throw new Error("Operation cancelled by user.");
            },
        }
    );
    return res.tpl as TemplateId;
}

async function ensureProjectDir(targetDir: string) {
    const exists = fs.existsSync(targetDir);
    if (!exists) {
        fs.mkdirSync(targetDir, { recursive: true });
        return;
    }
    const files = fs
        .readdirSync(targetDir)
        .filter((f) => !IGNORE_IN_EMPTY.includes(f));
    if (files.length === 0) return;

    console.log(
        chalk.yellow(`Directory ${path.basename(targetDir)} is not empty.`)
    );
    const cont = await askYesNo(
        "Continue and overwrite conflicting files?",
        false
    );
    if (!cont) {
        throw new Error("Operation cancelled by user.");
    }
}
function normalizePM(pm?: string): PackageManager | undefined {
    if (!pm) return undefined;
    const v = pm.trim().toLowerCase();
    if (v === "npm" || v === "pnpm" || v === "yarn" || v === "bun") return v;
    return undefined;
}

async function detectPackageManager(): Promise<PackageManager> {
    const envPM = getEnvPM();
    if (envPM) return envPM;
    const detected: PackageManager[] = [];
    if (await which("pnpm")) detected.push("pnpm");
    if (await which("yarn")) detected.push("yarn");
    if (await which("bun")) detected.push("bun");
    if (await which("npm")) detected.push("npm");
    if (detected.length === 1) return detected[0] || "npm";
    if (detected.length > 1) {
        const res = await prompts(
            {
                type: "select",
                name: "pm",
                message: "Select package manager",
                choices: detected.map((pm) => ({ title: pm, value: pm })),
            },
            {
                onCancel: () => {
                    throw new Error("Operation cancelled by user.");
                },
            }
        );
        return (res.pm as PackageManager) || "npm";
    }
    return "npm";
}

function getEnvPM(): PackageManager | undefined {
    const ua = process.env.npm_config_user_agent ?? "";
    if (ua.startsWith("pnpm")) return "pnpm";
    if (ua.startsWith("yarn")) return "yarn";
    if (ua.startsWith("bun")) return "bun";
    if (ua.startsWith("npm")) return "npm";
    return undefined;
}

async function resolveTemplateDir(tplId: TemplateId): Promise<string | undefined> {
    // Try common locations relative to the built file and project root.
    const candidates = [
        path.join(__dirname, "templates", tplId),
        path.join(__dirname, "..", "templates", tplId),
        path.join(process.cwd(), "templates", tplId),
    ];
    for (const dir of candidates) {
        try {
            const stat = fs.statSync(dir);
            if (stat.isDirectory()) return dir;
        } catch {
            // continue
        }
    }
    // As a final attempt, walk up from __dirname looking for a 'templates' directory
    try {
        const templatesRoot = await findUp("templates", __dirname);
        if (templatesRoot) {
            const candidate = path.join(templatesRoot, tplId);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                return candidate;
            }
        }
    } catch {
        // ignore
    }
    return undefined;
}

function which(bin: string): Promise<boolean> {
    return new Promise((resolve) => {
        const cmd = process.platform === "win32" ? "where" : "which";
        const child = spawn(cmd, [bin], { stdio: "ignore" });
        child.on("close", (code) => resolve(code === 0));
        child.on("error", () => resolve(false));
    });
}

async function installDeps(pm: PackageManager, cwd: string): Promise<boolean> {
    const args: string[] = [];
    switch (pm) {
        case "pnpm":
            args.push("install");
            break;
        case "yarn":
            // yarn v1/v3 both accept no args for install
            break;
        case "bun":
            args.push("install");
            break;
        case "npm":
        default:
            args.push("install");
    }
    return runCmd(pm, args, cwd);
}

async function initGit(cwd: string): Promise<boolean> {
    if (!(await which("git"))) return false;
    const ok =
        (await runCmd("git", ["init"], cwd)) &&
        (await runCmd("git", ["add", "."], cwd)) &&
        (await runCmd("git", ["commit", "-m", "chore: initial commit"], cwd));
    return ok;
}

function runCmd(cmd: string, args: string[], cwd: string): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {
            cwd,
            stdio: "ignore",
            shell: process.platform === "win32",
        });
        child.on("close", (code) => resolve(code === 0));
        child.on("error", () => resolve(false));
    });
}

async function getVersionSafe(): Promise<string> {
    try {
        const pkgPath = await findUp("package.json", path.dirname(__filename));
        if (pkgPath && fs.existsSync(pkgPath)) {
            const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (json?.version) return String(json.version);
        }
    } catch {
        // ignore
    }
    return "0.0.0";
}

async function findUp(
    file: string,
    startDir: string
): Promise<string | undefined> {
    let dir = startDir;
    while (true) {
        const candidate = path.join(dir, file);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

const IGNORE_IN_EMPTY = [
    ".git",
    ".gitkeep",
    ".hg",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
];

// Templates
const templates: Template[] = [
    {
        id: "basic",
        name: "Basic (Node.js)",
        description: "Hello World template with Node.js adapter",
    },
    {
        id: "bun",
        name: "Basic (Bun)",
        description: "Hello World template with Bun adapter",
        requirements: {
            packageManager: "bun",
        },
    },
    {
        id: "vercel",
        name: "Vercel (Node.js)",
        description: "Using Vercel Functions with Vercel adapter",
    },
    {
        id: "vercel-bun",
        name: "Vercel (Bun)",
        description: "Vercel Functions with the Vercel adapter support Bun features.",
        requirements: {
            packageManager: "bun",
        },
    },
    {
        id: "cloudflare",
        name: "Cloudflare Workers",
        description: "Hello world template with Cloudflare adapter",
    },
    {
        id: "mini",
        name: "Mini (Node.js)",
        description: "Lightweight and small bundle size, supports only Node.js.",
    },
    {
        id: "truly-fast",
        name: "Truly fast",
        description: "Fully optimized Hello world template with Bun",
        requirements: {
            packageManager: "bun",
        },
    }
];

function pmCmd(pm: PackageManager, script: string): string {
    switch (pm) {
        case "pnpm":
            return `pnpm ${script}`;
        case "yarn":
            return `yarn ${script}`;
        case "bun":
            return `bun ${script}`;
        default:
            return `npm run ${script}`;
    }
}

function suggestScripts(tpl: TemplateId): Array<(pm: PackageManager) => string> {
    switch (tpl) {
        case "bun":
        case "basic":
            return [
                (pm) => `${pmCmd(pm, "dev")}    # start dev server if available, else node index.js`,
                (pm) => `${pmCmd(pm, "build")}  # build project`,
            ];
        case "vercel":
            return [
                () => `vercel dev`,
                (pm) => `${pmCmd(pm, "build")}  # optional build step`,
            ];
        case "cloudflare":
            return [
                () => `wrangler dev`,
                () => `wrangler publish`,
            ];
        default:
            return [(pm) => `${pmCmd(pm, "dev")}`];
    }
}

// Execute
void main();
