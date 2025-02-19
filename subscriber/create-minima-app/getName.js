import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function camelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '').replace("-", "");
}

const packageJsonAsString = fs.readFileSync(__dirname + '/../package.json', 'utf-8');
const packageJson = JSON.parse(packageJsonAsString);
process.stdout.write(camelCase(packageJson.name));
