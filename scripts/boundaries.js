const j = require(require("path").resolve(process.argv[2]));
const nodes = j.normalized_result.graph.nodes;
const loc = o => { const v = o.evidence?.location?.value; return v ? `${v.source}:${v.start?.line}:${v.start?.column}` : ""; };
for (const kind of ["electron-main", "electron-preload", "electron-renderer", "browser-window", "ipc-channel", "storage", "worker", "endpoint", "package", "unknown"]) {
  console.log(`\n== ${kind}`);
  for (const n of nodes.filter(x => x.kind === kind)) {
    for (const o of n.observations || [{}]) {
      const p = { ...(o.properties || {}) };
      console.log(" -", (o.label || "").slice(0, 100), JSON.stringify(p).slice(0, 260), loc(o));
    }
  }
}
