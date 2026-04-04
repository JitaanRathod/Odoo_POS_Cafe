const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafedemo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cafedemo.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@cafedemo.com' },
    update: {},
    create: {
      name: 'Cashier One',
      email: 'cashier1@cafedemo.com',
      password: hashedPassword,
      role: 'CASHIER',
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@cafedemo.com' },
    update: {},
    create: {
      name: 'Kitchen Staff',
      email: 'kitchen@cafedemo.com',
      password: hashedPassword,
      role: 'KITCHEN',
    },
  });

  console.log('Users seeded');

  const branch = await prisma.branch.upsert({
    where: { name: 'Cafe Demo - Main Branch' },
    update: {},
    create: {
      name: 'Cafe Demo - Main Branch',
      address: '123 MG Road, Bengaluru, Karnataka',
      phone: '+91-9876543210',
    },
  });

  console.log('Branch seeded');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Hot Beverages' } },
      update: {},
      create: { branchId: branch.id, name: 'Hot Beverages' },
    }),
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Cold Beverages' } },
      update: {},
      create: { branchId: branch.id, name: 'Cold Beverages' },
    }),
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Snacks' } },
      update: {},
      create: { branchId: branch.id, name: 'Snacks' },
    }),
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Meals' } },
      update: {},
      create: { branchId: branch.id, name: 'Meals' },
    }),
  ]);

  const [hotBev, coldBev, snacks, meals] = categories;
  console.log('Categories seeded');

  const products = [
    // Hot Beverages
    { name: 'Espresso', price: 80, taxRate: 5, categoryId: hotBev.id },
    { name: 'Cappuccino', price: 120, taxRate: 5, categoryId: hotBev.id },
    { name: 'Latte', price: 130, taxRate: 5, categoryId: hotBev.id },
    { name: 'Chai', price: 60, taxRate: 5, categoryId: hotBev.id },
    { name: 'Hot Chocolate', price: 150, taxRate: 5, categoryId: hotBev.id },
    // Cold Beverages
    { name: 'Cold Coffee', price: 150, taxRate: 5, categoryId: coldBev.id },
    { name: 'Iced Latte', price: 160, taxRate: 5, categoryId: coldBev.id },
    { name: 'Mango Smoothie', price: 180, taxRate: 5, categoryId: coldBev.id },
    { name: 'Fresh Lime Soda', price: 80, taxRate: 5, categoryId: coldBev.id },
    // Snacks
    { name: 'Croissant', price: 90, taxRate: 12, categoryId: snacks.id },
    { name: 'Veg Sandwich', price: 120, taxRate: 12, categoryId: snacks.id },
    { name: 'Club Sandwich', price: 160, taxRate: 12, categoryId: snacks.id },
    { name: 'French Fries', price: 100, taxRate: 12, categoryId: snacks.id },
    { name: 'Brownie', price: 80, taxRate: 12, categoryId: snacks.id },
    // Meals
    { name: 'Paneer Wrap', price: 220, taxRate: 12, categoryId: meals.id },
    { name: 'Pasta Arabiata', price: 260, taxRate: 12, categoryId: meals.id },
    { name: 'Grilled Sandwich', price: 180, taxRate: 12, categoryId: meals.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: {
        id: (await prisma.product.findFirst({ where: { name: p.name, branchId: branch.id } }))?.id || '00000000-0000-0000-0000-000000000000',
      },
      update: {},
      create: { branchId: branch.id, ...p },
    });
  }

  console.log('Products seeded');

  const groundFloor = await prisma.floor.upsert({
    where: { id: (await prisma.floor.findFirst({ where: { name: 'Ground Floor', branchId: branch.id } }))?.id || '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { branchId: branch.id, name: 'Ground Floor' },
  });

  const firstFloor = await prisma.floor.upsert({
    where: { id: (await prisma.floor.findFirst({ where: { name: 'First Floor', branchId: branch.id } }))?.id || '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: { branchId: branch.id, name: 'First Floor' },
  });

  for (let i = 1; i <= 8; i++) {
    const existing = await prisma.table.findFirst({ where: { tableNumber: i, floorId: groundFloor.id } });
    if (!existing) {
      await prisma.table.create({
        data: { floorId: groundFloor.id, tableNumber: i, seats: i <= 4 ? 2 : 4 },
      });
    }
  }

  // First Floor Tables (9-14)
  for (let i = 9; i <= 14; i++) {
    const existing = await prisma.table.findFirst({ where: { tableNumber: i, floorId: firstFloor.id } });
    if (!existing) {
      await prisma.table.create({
        data: { floorId: firstFloor.id, tableNumber: i, seats: 6 },
      });
    }
  }

  console.log('Floors & Tables seeded');

  const terminal1 = await prisma.posTerminal.upsert({
    where: { id: (await prisma.posTerminal.findFirst({ where: { name: 'Counter 1' } }))?.id || '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: { branchId: branch.id, name: 'Counter 1' },
  });

  const terminal2 = await prisma.posTerminal.upsert({
    where: { id: (await prisma.posTerminal.findFirst({ where: { name: 'Counter 2' } }))?.id || '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: { branchId: branch.id, name: 'Counter 2' },
  });

  console.log('Terminals seeded');

  for (const terminal of [terminal1, terminal2]) {
    await prisma.paymentSettings.upsert({
      where: { terminalId: terminal.id },
      update: {},
      create: {
        terminalId: terminal.id,
        enableCash: true,
        enableCard: false,
        enableUpi: true,
        upiId: 'cafedemo@upi',
        upiName: 'Cafe Demo',
      },
    });
  }

  console.log('Payment settings seeded');

  const sampleCustomers = [
    { name: 'Rahul Mehta', email: 'rahul@example.com', phone: '9000000001' },
    { name: 'Priya Sharma', email: 'priya@example.com', phone: '9000000002' },
    { name: 'Ankit Patel', phone: '9000000003' },
  ];

  for (const c of sampleCustomers) {
    const whereClause = c.email ? { email: c.email } : { phone: c.phone };
    await prisma.customer.upsert({
      where: whereClause,
      update: {},
      create: c,
    });
  }

  console.log('Customers seeded');

  console.log('\nSeed complete!\n');
  console.log('  Login credentials:');
  console.log('  Admin    → admin@cafedemo.com  / password123');
  console.log('  Cashier  → cashier1@cafedemo.com / password123');
  console.log('  Kitchen  → kitchen@cafedemo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
