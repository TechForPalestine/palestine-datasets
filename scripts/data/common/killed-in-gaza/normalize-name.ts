import { ArabicClass } from "arabic-utils";

const argIndex = process.argv.indexOf("--name");
if (argIndex === -1) {
  console.error("Missing --name argument");
  process.exit(1);
}

const nameParts = process.argv.slice(argIndex + 1).join(" ");
const name = ArabicClass.normalize(nameParts);

console.log(nameParts, "=>", name);
