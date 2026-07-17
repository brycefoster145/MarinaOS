import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌊 Seeding MarinaOS database...");

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "harbor-view-marina" },
    update: {},
    create: {
      name: "Harbor View Marina",
      slug: "harbor-view-marina",
      email: "info@harborviewmarina.com",
      phone: "(555) 123-4567",
      address: "1 Harbor Boulevard",
      city: "Newport Beach",
      state: "CA",
      zipCode: "92660",
      country: "US",
      plan: "TRIAL",
      subscriptionPriceInCents: 150000,
    },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create settings for org
  await prisma.settings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      timezone: "America/Los_Angeles",
      defaultDailyRate: new Prisma.Decimal(3.50),
      defaultMonthlyRate: new Prisma.Decimal(85.00),
    },
  });

  console.log("✅ Created settings");

  // Create docks
  const docks = [
    { name: "Alpha Dock", sortOrder: 1, color: "#0284c7" },
    { name: "Bravo Dock", sortOrder: 2, color: "#059669" },
    { name: "Charlie Dock", sortOrder: 3, color: "#d97706" },
  ];

  const createdDocks = [];
  for (const dock of docks) {
    const created = await prisma.dock.create({
      data: {
        organizationId: org.id,
        ...dock,
      },
    });
    createdDocks.push(created);
    console.log(`  ✅ Created dock: ${created.name}`);
  }

  // Create slips for each dock
  const slipNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const slipLengths = [30, 35, 40, 45, 50, 55, 60, 65, 70, 80];

  for (const dock of createdDocks) {
    const dockIndex = createdDocks.indexOf(dock);
    const numSlips = dockIndex === 0 ? 12 : dockIndex === 1 ? 10 : 8;

    for (let i = 1; i <= numSlips; i++) {
      const slipName = `${dock.name.charAt(0)}-${String(i).padStart(2, "0")}`;
      const length = slipLengths[Math.floor(Math.random() * slipLengths.length)];
      const isOccupied = Math.random() > 0.3;

      await prisma.slip.create({
        data: {
          organizationId: org.id,
          dockId: dock.id,
          name: slipName,
          number: slipName,
          length,
          width: length * 0.35,
          maxDraft: length * 0.15,
          status: isOccupied ? "OCCUPIED" : "AVAILABLE",
          monthlyRate: new Prisma.Decimal(length * 2.5),
          positionX: (i - 1) * 80,
          positionY: dockIndex * 120,
          widthPixels: 70,
          heightPixels: 30,
        },
      });
    }
    console.log(`  ✅ Created ${numSlips} slips for ${dock.name}`);
  }

  console.log("✅ MarinaOS seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });