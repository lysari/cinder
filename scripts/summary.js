const j = require(require("path").resolve(process.argv[2]));
const n = j.normalized_result;
console.log(JSON.stringify(n.summary, null, 1));
console.log("LIMITATIONS:", JSON.stringify(n.limitations.map(l => l.code || l.message || l).slice(0, 14), null, 1));
const kinds = {};
for (const node of n.graph.nodes) kinds[node.kind || node.type] = (kinds[node.kind || node.type] || 0) + 1;
console.log("NODE KINDS:", kinds);
console.log("SAMPLE NODE:", JSON.stringify(n.graph.nodes.find(x => /window|ipc|preload/i.test(JSON.stringify(x).slice(0, 400))), null, 1).slice(0, 1500));
