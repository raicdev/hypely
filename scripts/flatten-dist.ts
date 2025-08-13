import fs from "fs";
import path from "path";

const srcDir = path.join(__dirname, '../dist/src');
const distDir = path.join(__dirname, '../dist');

if (fs.existsSync(srcDir)) {
  // Move all files and folders from srcDir to distDir
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
