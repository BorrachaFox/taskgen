import { minify } from "terser";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const DIST = "./dist";

const files = readdirSync(DIST).filter((f) => f.endsWith(".js"));

for (const file of files) {
  const filePath = join(DIST, file);
  const code = readFileSync(filePath, "utf-8");

  const result = await minify(code, {
    module: true,
    compress: { drop_console: false },
    mangle: true,
  });

  if (result.code) {
    writeFileSync(filePath, result.code);
    console.log(`✔ minified: ${file}`);
  }
}