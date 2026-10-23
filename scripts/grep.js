// usage: node grep.js <file> <regex> [context=200]
const fs = require("fs");
const [file, re, ctx = 200] = process.argv.slice(2);
const text = fs.readFileSync(file, "utf8");
const rx = new RegExp(re, "g");
let m, count = 0;
while ((m = rx.exec(text)) && count++ < 40) {
  const s = Math.max(0, m.index - ctx), e = Math.min(text.length, m.index + m[0].length + Number(ctx));
  console.log(`@${m.index}: ...${text.slice(s, e).replace(/\n/g, " ")}...\n`);
}
