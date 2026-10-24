import { Firestore } from "@google-cloud/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const db = new Firestore({ projectId: "demo-cinder" });

async function seed() {
  console.log("Seeding demo-cinder Firestore emulator...");

  const users = [
    { id: "usr_001", name: "Emma Watson", email: "emma.watson@example.com", role: "admin", plan: "enterprise", credits: 14500, active: true, createdAt: new Date("2026-01-15T08:00:00Z") },
    { id: "usr_002", name: "Marcus Vance", email: "marcus.v@cloudcorp.io", role: "developer", plan: "pro", credits: 2400, active: true, createdAt: new Date("2026-02-10T11:30:00Z") },
    { id: "usr_003", name: "Sofia Morales", email: "sofia.m@creative.net", role: "designer", plan: "starter", credits: 350, active: true, createdAt: new Date("2026-03-01T14:15:00Z") },
    { id: "usr_004", name: "Liam Tanaka", email: "liam.t@tokyolabs.jp", role: "developer", plan: "enterprise", credits: 28000, active: true, createdAt: new Date("2026-03-12T09:45:00Z") },
    { id: "usr_005", name: "Chloe Dubois", email: "chloe@dubois.fr", role: "manager", plan: "pro", credits: 1800, active: false, createdAt: new Date("2026-03-20T16:20:00Z") },
    { id: "usr_006", name: "Arun Patel", email: "arun.p@techdelhi.in", role: "developer", plan: "pro", credits: 3200, active: true, createdAt: new Date("2026-04-05T10:00:00Z") },
  ];

  for (const u of users) {
    const { id, ...data } = u;
    await db.collection("users").doc(id).set(data);
  }

  const products = [
    { id: "prod_101", title: "Cinder Pro License", sku: "CND-PRO-01", price: 49.99, stock: 999, tags: ["software", "database"], ratings: { score: 4.9, count: 128 } },
    { id: "prod_102", title: "Cloud Backup Addon", sku: "CND-BCK-02", price: 19.99, stock: 500, tags: ["cloud", "storage"], ratings: { score: 4.7, count: 64 } },
    { id: "prod_103", title: "Priority Support 24/7", sku: "CND-SUP-03", price: 99.00, stock: 50, tags: ["services"], ratings: { score: 5.0, count: 32 } },
  ];

  for (const p of products) {
    const { id, ...data } = p;
    await db.collection("products").doc(id).set(data);
  }

  const orders = [
    { id: "ord_9011", customerId: "usr_001", total: 148.98, status: "completed", items: 3, currency: "USD", placedAt: new Date("2026-10-22T10:14:00Z") },
    { id: "ord_9012", customerId: "usr_002", total: 49.99, status: "completed", items: 1, currency: "USD", placedAt: new Date("2026-10-23T15:20:00Z") },
    { id: "ord_9013", customerId: "usr_004", total: 247.97, status: "processing", items: 4, currency: "USD", placedAt: new Date("2026-10-24T06:05:00Z") },
  ];

  for (const o of orders) {
    const { id, ...data } = o;
    await db.collection("orders").doc(id).set(data);
  }

  console.log("Seeding complete! Added users, products, and orders.");
}

seed().catch(console.error);
