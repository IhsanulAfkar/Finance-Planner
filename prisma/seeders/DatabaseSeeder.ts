import fs from "fs";
import path from "path";
import 'dotenv/config'

// Dynamically import all seeders in the same folder
const seederMap: Record<string, any> = {};

const currentDir = __dirname;
const files = fs.readdirSync(currentDir);

for (const file of files) {
    // Skip DatabaseSeeder itself, data folder, and non-TypeScript files
    if (
        file === "DatabaseSeeder.ts" ||
        file === "DatabaseSeeder.js" ||
        file === "data" ||
        !file.endsWith(".ts") && !file.endsWith(".js")
    ) {
        continue;
    }

    const seederName = path.basename(file, path.extname(file));
    const seederModule = require(`./${seederName}`);

    // Handle both default and named exports
    const SeederClass = seederModule.default || seederModule[seederName];

    if (SeederClass && typeof SeederClass.run === "function") {
        seederMap[seederName] = SeederClass;
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("Please specify the seeder class names you want to run.");
        return;
    }

    for (const arg of args) {
        const SeederClass = seederMap[arg];
        if (SeederClass) {
            console.log(`Running ${arg}...`);
            await SeederClass.run();
        } else {
            console.log(`Seeder class ${arg} not found.`);
        }
    }
}

main();
