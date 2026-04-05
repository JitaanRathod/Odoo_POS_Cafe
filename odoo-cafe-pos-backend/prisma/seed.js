const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Branch
  const branch = await prisma.branch.upsert({
    where: { name: 'Main Branch' },
    update: {},
    create: {
      name: 'Main Branch',
      address: '123 Main Street, City',
      phone: '+1234567890',
    },
  });
  console.log('✅ Branch created:', branch.name);

  // 2. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cafe.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@cafe.com' },
    update: {},
    create: {
      name: 'Cashier User',
      email: 'cashier@cafe.com',
      password: cashierPassword,
      role: 'CASHIER',
    },
  });
  console.log('✅ Users created: Admin & Cashier');

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Beverages' } },
      update: {},
      create: { branchId: branch.id, name: 'Beverages' },
    }),
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Food' } },
      update: {},
      create: { branchId: branch.id, name: 'Food' },
    }),
    prisma.category.upsert({
      where: { branchId_name: { branchId: branch.id, name: 'Desserts' } },
      update: {},
      create: { branchId: branch.id, name: 'Desserts' },
    }),
  ]);
  console.log('✅ Categories created');

  // 4. Create Products
  const products = [
    // Beverages
    { name: 'Espresso', categoryId: categories[0].id, price: 3.50, taxRate: 5 },
    { name: 'Cappuccino', categoryId: categories[0].id, price: 4.50, taxRate: 5 },
    { name: 'Latte', categoryId: categories[0].id, price: 4.75, taxRate: 5 },
    { name: 'Cold Brew', categoryId: categories[0].id, price: 5.00, taxRate: 5 },
    { name: 'Tea', categoryId: categories[0].id, price: 2.50, taxRate: 5 },
    { name: 'Fresh Juice', categoryId: categories[0].id, price: 5.50, taxRate: 5 },

    // Food
    { name: 'Burger', categoryId: categories[1].id, price: 12.00, taxRate: 8 },
    { name: 'Pizza Margherita', categoryId: categories[1].id, price: 14.00, taxRate: 8 },
    { name: 'Caesar Salad', categoryId: categories[1].id, price: 9.50, taxRate: 8 },
    { name: 'Pasta Carbonara', categoryId: categories[1].id, price: 13.00, taxRate: 8 },
    { name: 'Sandwich', categoryId: categories[1].id, price: 8.00, taxRate: 8 },
    { name: 'French Fries', categoryId: categories[1].id, price: 4.50, taxRate: 8 },

    // Desserts
    { name: 'Chocolate Cake', categoryId: categories[2].id, price: 6.50, taxRate: 5 },
    { name: 'Ice Cream', categoryId: categories[2].id, price: 5.00, taxRate: 5 },
    { name: 'Tiramisu', categoryId: categories[2].id, price: 7.00, taxRate: 5 },
    { name: 'Cheesecake', categoryId: categories[2].id, price: 6.50, taxRate: 5 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
        branchId: branch.id,
        categoryId: product.categoryId,
        name: product.name,
        description: `Delicious ${product.name}`,
        price: product.price,
        taxRate: product.taxRate,
        isActive: true,
      },
    });
  }
  console.log('✅ Products created (16 items)');

  // 5. Create Floors
  const floors = await Promise.all([
    prisma.floor.upsert({
      where: { id: 'floor-ground' },
      update: {},
      create: {
        id: 'floor-ground',
        branchId: branch.id,
        name: 'Ground Floor',
      },
    }),
    prisma.floor.upsert({
      where: { id: 'floor-first' },
      update: {},
      create: {
        id: 'floor-first',
        branchId: branch.id,
        name: 'First Floor',
      },
    }),
  ]);
  console.log('✅ Floors created');

  // 6. Create Tables
  const groundFloorTables = [];
  for (let i = 1; i <= 6; i++) {
    const table = await prisma.table.upsert({
      where: { id: `table-ground-${i}` },
      update: {},
      create: {
        id: `table-ground-${i}`,
        floorId: floors[0].id,
        tableNumber: i,
        seats: i % 2 === 0 ? 4 : 2,
        status: 'FREE',
      },
    });
    groundFloorTables.push(table);
  }

  const firstFloorTables = [];
  for (let i = 7; i <= 12; i++) {
    const table = await prisma.table.upsert({
      where: { id: `table-first-${i}` },
      update: {},
      create: {
        id: `table-first-${i}`,
        floorId: floors[1].id,
        tableNumber: i,
        seats: 4,
        status: 'FREE',
      },
    });
    firstFloorTables.push(table);
  }
  console.log('✅ Tables created (12 total)');

  // 7. Create POS Terminal
  const terminal = await prisma.posTerminal.upsert({
    where: { id: 'terminal-main' },
    update: {},
    create: {
      id: 'terminal-main',
      branchId: branch.id,
      userId: cashier.id,
      name: 'Main Terminal',
    },
  });
  console.log('✅ POS Terminal created');

  // 8. Create Payment Settings
  const paymentSettings = await prisma.paymentSettings.upsert({
    where: { terminalId: terminal.id },
    update: {},
    create: {
      terminalId: terminal.id,
      enableCash: true,
      enableCard: true,
      enableUpi: true,
      upiId: '9876543210@ybl',
      upiName: 'Odoo Cafe',
      merchantCode: 'CAFE001',
    },
  });
  console.log('✅ Payment Settings created');

  // 9. Create a sample customer
  const customer = await prisma.customer.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567891',
      address: '456 Customer St, City',
    },
  });
  console.log('✅ Sample customer created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:');
  console.log('   Email: admin@cafe.com');
  console.log('   Password: admin123');
  console.log('\n   Cashier:');
  console.log('   Email: cashier@cafe.com');
  console.log('   Password: cashier123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });