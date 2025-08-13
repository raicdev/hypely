import fs from "fs";
import path from "path";
import { build } from "bun";

// Paths
const distDir = path.resolve(__dirname, "../dist");
const realSrcDir = path.resolve(__dirname, "../src");

// Delete dist directory if exists
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log("Deleted dist directory");
}

// Build with Bun
function getEntrypoints(dir: string): string[] {
    const entrypoints: string[] = [];
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            entrypoints.push(...getEntrypoints(fullPath));
        } else if (item.endsWith(".ts")) {
            entrypoints.push(fullPath);
        }
    }
    return entrypoints;
}

const entrypoints = getEntrypoints(realSrcDir);

await build({
    entrypoints,
    outdir: distDir,
    target: "node",
});

// Flatten dist/src into dist
const srcDir = path.join(distDir, "src");
if (fs.existsSync(srcDir)) {
    for (const item of fs.readdirSync(srcDir)) {
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(distDir, item);
        fs.renameSync(srcPath, destPath);
    }
    fs.rmdirSync(srcDir);
    console.log("Source directory flattened");
} else {
    console.error("Source directory does not exist");
}