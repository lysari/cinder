// usage: node slice.js <file> <line> <startCol> <endCol>
const fs = require("fs");
const [file, line, start, end] = process.argv.slice(2);
const text = fs.readFileSync(file, "utf8").split("\n")[Number(line) - 1];
process.stdout.write(text.slice(Number(start), Number(end)));
