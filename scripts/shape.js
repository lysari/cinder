const j = require(require("path").resolve(process.argv[2]));
const show = (o, d = 0) => {
  if (d > 2 || o === null || typeof o !== "object") return;
  for (const [k, v] of Object.entries(o)) {
    const t = Array.isArray(v) ? `array(${v.length})` : typeof v;
    console.log(" ".repeat(d * 2) + k + ": " + t + (typeof v !== "object" ? " = " + String(v).slice(0, 120) : ""));
    if (!Array.isArray(v)) show(v, d + 1);
  }
};
show(j);
