// prisma/seed.js — Expanded seed: 40 products, ~100 orders, payments, sessions
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomBetween(8, 21), randomBetween(0, 59), 0, 0);
  return d;
}
function generateReceiptNumber(date) {
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `RCPT-${yyyymmdd}-${String(randomBetween(1000, 9999))}`;
}

async function main() {
  console.log('\n🌱  Seeding database...\n');

  // ── Users ──────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafedemo.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@cafedemo.com', password: hashedPassword, role: 'ADMIN' },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'manager@cafedemo.com' },
    update: {},
    create: { name: 'Manager Meena', email: 'manager@cafedemo.com', password: hashedPassword, role: 'MANAGER' },
  });
  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@cafedemo.com' },
    update: {},
    create: { name: 'Cashier One', email: 'cashier1@cafedemo.com', password: hashedPassword, role: 'CASHIER' },
  });
  const cashier2 = await prisma.user.upsert({
    where: { email: 'cashier2@cafedemo.com' },
    update: {},
    create: { name: 'Cashier Two', email: 'cashier2@cafedemo.com', password: hashedPassword, role: 'CASHIER' },
  });
  await prisma.user.upsert({
    where: { email: 'kitchen@cafedemo.com' },
    update: {},
    create: { name: 'Kitchen Staff', email: 'kitchen@cafedemo.com', password: hashedPassword, role: 'KITCHEN' },
  });
  console.log('✅  Users seeded (5)');

  // ── Branch ────────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { name: 'Cafe Demo - Main Branch' },
    update: {},
    create: { name: 'Cafe Demo - Main Branch', address: '123 MG Road, Bengaluru, Karnataka', phone: '+91-9876543210' },
  });
  console.log('✅  Branch seeded');

  // ── Categories (+2 new) ───────────────────────────────────
  const [hotBev, coldBev, snacks, meals, desserts, juices] = await Promise.all([
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Hot Beverages' } }, update: {}, create: { branchId: branch.id, name: 'Hot Beverages' } }),
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Cold Beverages' } }, update: {}, create: { branchId: branch.id, name: 'Cold Beverages' } }),
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Snacks' } }, update: {}, create: { branchId: branch.id, name: 'Snacks' } }),
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Meals' } }, update: {}, create: { branchId: branch.id, name: 'Meals' } }),
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Desserts' } }, update: {}, create: { branchId: branch.id, name: 'Desserts' } }),
    prisma.category.upsert({ where: { branchId_name: { branchId: branch.id, name: 'Fresh Juices' } }, update: {}, create: { branchId: branch.id, name: 'Fresh Juices' } }),
  ]);
  console.log('✅  Categories seeded (6)');

  // ── Products (40 total: 17 original + 23 new) ─────────────
  const productDefs = [
    // Hot Beverages (removed Hot Chocolate)
    { name: 'Espresso',         price: 80,  taxRate: 5,  categoryId: hotBev.id },
    { name: 'Cappuccino',       price: 120, taxRate: 5,  categoryId: hotBev.id },
    { name: 'Latte',            price: 130, taxRate: 5,  categoryId: hotBev.id },
    { name: 'Chai',             price: 60,  taxRate: 5,  categoryId: hotBev.id },
    { name: 'Americano',        price: 100, taxRate: 5,  categoryId: hotBev.id },
    { name: 'Flat White',       price: 140, taxRate: 5,  categoryId: hotBev.id },
    { name: 'Masala Chai',      price: 70,  taxRate: 5,  categoryId: hotBev.id },
    { name: 'Green Tea',        price: 90,  taxRate: 5,  categoryId: hotBev.id },
    // Cold Beverages (kept 4, removed Chocolate Shake & Blue Lagoon)
    { name: 'Cold Coffee',      price: 150, taxRate: 5,  categoryId: coldBev.id },
    { name: 'Iced Latte',       price: 160, taxRate: 5,  categoryId: coldBev.id },
    { name: 'Mango Smoothie',   price: 180, taxRate: 5,  categoryId: coldBev.id },
    { name: 'Fresh Lime Soda',  price: 80,  taxRate: 5,  categoryId: coldBev.id },
    { name: 'Strawberry Shake', price: 210, taxRate: 5,  categoryId: coldBev.id },
    // Snacks (removed Spring Rolls)
    { name: 'Croissant',        price: 90,  taxRate: 12, categoryId: snacks.id },
    { name: 'Veg Sandwich',     price: 120, taxRate: 12, categoryId: snacks.id },
    { name: 'Club Sandwich',    price: 160, taxRate: 12, categoryId: snacks.id },
    { name: 'French Fries',     price: 100, taxRate: 12, categoryId: snacks.id },
    { name: 'Brownie',          price: 80,  taxRate: 12, categoryId: snacks.id },
    { name: 'Garlic Bread',     price: 110, taxRate: 12, categoryId: snacks.id },
    { name: 'Nachos',           price: 130, taxRate: 12, categoryId: snacks.id },
    { name: 'Cheese Toast',     price: 100, taxRate: 12, categoryId: snacks.id },
    // Meals (original 3 + 4 new = 7)
    { name: 'Paneer Wrap',      price: 220, taxRate: 12, categoryId: meals.id },
    { name: 'Pasta Arabiata',   price: 260, taxRate: 12, categoryId: meals.id },
    { name: 'Grilled Sandwich', price: 180, taxRate: 12, categoryId: meals.id },
    { name: 'Margherita Pizza', price: 320, taxRate: 12, categoryId: meals.id },  // NEW
    { name: 'Mushroom Pasta',   price: 280, taxRate: 12, categoryId: meals.id },  // NEW
    { name: 'Chicken Burger',   price: 290, taxRate: 12, categoryId: meals.id },  // NEW
    { name: 'Veg Burger',       price: 230, taxRate: 12, categoryId: meals.id },  // NEW
    // Desserts (all 4 new)
    { name: 'Chocolate Cake',   price: 160, taxRate: 12, categoryId: desserts.id }, // NEW
    { name: 'Cheesecake',       price: 180, taxRate: 12, categoryId: desserts.id }, // NEW
    { name: 'Waffle',           price: 200, taxRate: 12, categoryId: desserts.id }, // NEW
    { name: 'Ice Cream Sundae', price: 150, taxRate: 12, categoryId: desserts.id }, // NEW
    // Fresh Juices (removed Mixed Fruit Juice)
    { name: 'Orange Juice',     price: 120, taxRate: 5,  categoryId: juices.id },
    { name: 'Watermelon Juice', price: 130, taxRate: 5,  categoryId: juices.id },
    { name: 'Pineapple Juice',  price: 140, taxRate: 5,  categoryId: juices.id },
  ];

  const allProducts = [];
  for (const p of productDefs) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, branchId: branch.id } });
    const product = existing
      ? existing
      : await prisma.product.create({ data: { branchId: branch.id, ...p } });
    allProducts.push(product);
  }
  console.log(`✅  Products seeded (${allProducts.length})`);

  // ── Floors & Tables ───────────────────────────────────────
  const groundFloor = await prisma.floor.findFirst({ where: { name: 'Ground Floor', branchId: branch.id } })
    || await prisma.floor.create({ data: { branchId: branch.id, name: 'Ground Floor' } });
  const firstFloor = await prisma.floor.findFirst({ where: { name: 'First Floor', branchId: branch.id } })
    || await prisma.floor.create({ data: { branchId: branch.id, name: 'First Floor' } });

  const allTables = [];
  for (let i = 1; i <= 8; i++) {
    const t = await prisma.table.findFirst({ where: { tableNumber: i, floorId: groundFloor.id } })
      || await prisma.table.create({ data: { floorId: groundFloor.id, tableNumber: i, seats: i <= 4 ? 2 : 4 } });
    allTables.push(t);
  }
  for (let i = 9; i <= 14; i++) {
    const t = await prisma.table.findFirst({ where: { tableNumber: i, floorId: firstFloor.id } })
      || await prisma.table.create({ data: { floorId: firstFloor.id, tableNumber: i, seats: 6 } });
    allTables.push(t);
  }
  console.log(`✅  Floors & Tables seeded (${allTables.length} tables)`);

  // ── Terminals ─────────────────────────────────────────────
  const terminal1 = await prisma.posTerminal.findFirst({ where: { name: 'Counter 1' } })
    || await prisma.posTerminal.create({ data: { branchId: branch.id, name: 'Counter 1' } });
  const terminal2 = await prisma.posTerminal.findFirst({ where: { name: 'Counter 2' } })
    || await prisma.posTerminal.create({ data: { branchId: branch.id, name: 'Counter 2' } });

  for (const t of [terminal1, terminal2]) {
    await prisma.paymentSettings.upsert({
      where: { terminalId: t.id },
      update: {},
      create: { terminalId: t.id, enableCash: true, enableCard: true, enableUpi: true, upiId: 'cafedemo@upi', upiName: 'Cafe Demo' },
    });
  }
  console.log('✅  Terminals & Payment Settings seeded');

  // ── Customers (10) ────────────────────────────────────────
  const customerDefs = [
    { name: 'Rahul Mehta',    email: 'rahul@example.com',  phone: '9000000001' },
    { name: 'Priya Sharma',   email: 'priya@example.com',  phone: '9000000002' },
    { name: 'Ankit Patel',                                  phone: '9000000003' },
    { name: 'Sneha Reddy',    email: 'sneha@example.com',  phone: '9000000004' },
    { name: 'Vikram Singh',   email: 'vikram@example.com', phone: '9000000005' },
    { name: 'Pooja Nair',     email: 'pooja@example.com',  phone: '9000000006' },
    { name: 'Arjun Kumar',                                  phone: '9000000007' },
    { name: 'Divya Pillai',   email: 'divya@example.com',  phone: '9000000008' },
    { name: 'Karan Shah',     email: 'karan@example.com',  phone: '9000000009' },
    { name: 'Meera Joshi',    email: 'meera@example.com',  phone: '9000000010' },
  ];
  const allCustomers = [];
  for (const c of customerDefs) {
    const where = c.email ? { email: c.email } : { phone: c.phone };
    const cust = await prisma.customer.upsert({ where, update: {}, create: c });
    allCustomers.push(cust);
  }
  console.log(`✅  Customers seeded (${allCustomers.length})`);

  // ── Sessions (5 historical + close any stuck open ones) ───
  // Close any previously open sessions to avoid conflicts
  await prisma.posSession.updateMany({
    where: { closedAt: null },
    data: { closedAt: new Date(), totalSales: 0 },
  });

  // Reset table statuses
  await prisma.table.updateMany({ data: { status: 'FREE' } });

  const sessionDefs = [
    { terminal: terminal1, cashier: cashier1, daysBack: 6, openingCash: 2000 },
    { terminal: terminal2, cashier: cashier2, daysBack: 5, openingCash: 1500 },
    { terminal: terminal1, cashier: cashier1, daysBack: 4, openingCash: 2000 },
    { terminal: terminal2, cashier: cashier2, daysBack: 3, openingCash: 1500 },
    { terminal: terminal1, cashier: cashier1, daysBack: 2, openingCash: 2000 },
    { terminal: terminal2, cashier: cashier2, daysBack: 1, openingCash: 1500 },
  ];

  const createdSessions = [];
  for (const sd of sessionDefs) {
    const openedAt = daysAgo(sd.daysBack);
    openedAt.setHours(9, 0, 0, 0);
    const closedAt = new Date(openedAt);
    closedAt.setHours(21, 30, 0, 0);

    const session = await prisma.posSession.create({
      data: {
        terminalId: sd.terminal.id,
        openingCash: sd.openingCash,
        openedAt,
        closedAt,
        totalSales: 0, // will update after orders
      },
    });
    createdSessions.push({ ...session, cashier: sd.cashier, openedAt, closedAt });
  }
  console.log(`✅  Sessions seeded (${createdSessions.length})`);

  // ── Orders, Items, Payments, Receipts (~100 orders) ───────
  const orderStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'];
  const paymentMethods = ['CASH', 'CASH', 'CARD', 'UPI'];
  let orderCount = 0;
  let paymentCount = 0;

  for (const sess of createdSessions) {
    const ordersThisSession = randomBetween(14, 19); // 14-19 per session = ~100 total
    const sessionRevenue = { total: 0 };

    for (let i = 0; i < ordersThisSession; i++) {
      const isCompleted = Math.random() < 0.80;
      const isCancelled = !isCompleted && Math.random() < 0.50;
      const status = isCompleted ? 'COMPLETED' : isCancelled ? 'CANCELLED' : 'IN_PROGRESS';

      const orderType = Math.random() < 0.6 ? 'DINE_IN' : 'TAKEAWAY';
      const table = orderType === 'DINE_IN' ? randomFrom(allTables) : null;
      const customer = Math.random() < 0.5 ? randomFrom(allCustomers) : null;

      // Pick 1-4 items
      const numItems = randomBetween(1, 4);
      const pickedProducts = [];
      const used = new Set();
      for (let j = 0; j < numItems; j++) {
        let p;
        do { p = randomFrom(allProducts); } while (used.has(p.id));
        used.add(p.id);
        pickedProducts.push({ product: p, quantity: randomBetween(1, 3) });
      }

      let totalAmount = 0;
      let taxAmount = 0;
      const itemsData = pickedProducts.map(({ product, quantity }) => {
        const lineSubtotal = Number(product.price) * quantity;
        const lineTax = lineSubtotal * (Number(product.taxRate) / 100);
        totalAmount += lineSubtotal + lineTax;
        taxAmount += lineTax;
        return {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          taxRate: product.taxRate,
          kitchenSent: status !== 'DRAFT',
        };
      });

      totalAmount = parseFloat(totalAmount.toFixed(2));
      taxAmount = parseFloat(taxAmount.toFixed(2));

      // Spread orders across the session day
      const minutesOffset = Math.floor((i / ordersThisSession) * 12 * 60);
      const createdAt = new Date(sess.openedAt);
      createdAt.setMinutes(createdAt.getMinutes() + minutesOffset + randomBetween(0, 15));

      const order = await prisma.order.create({
        data: {
          branchId: branch.id,
          sessionId: sess.id,
          tableId: table?.id || null,
          customerId: customer?.id || null,
          cashierId: sess.cashier.id,
          orderType,
          status,
          totalAmount,
          taxAmount,
          createdAt,
          updatedAt: createdAt,
          orderItems: { create: itemsData },
        },
      });

      orderCount++;

      // Payment + Receipt for completed orders
      if (status === 'COMPLETED') {
        const method = randomFrom(paymentMethods);
        const paidAt = new Date(createdAt.getTime() + randomBetween(5, 20) * 60 * 1000);
        const receiptNumber = generateReceiptNumber(paidAt);

        await prisma.payment.create({
          data: {
            orderId: order.id,
            method,
            amount: totalAmount,
            status: 'COMPLETED',
            createdAt: paidAt,
          },
        });

        // Ensure unique receipt number
        const recNum = `${receiptNumber}-${orderCount}`;
        await prisma.receipt.create({
          data: { orderId: order.id, receiptNumber: recNum, generatedAt: paidAt },
        });

        paymentCount++;
        sessionRevenue.total += totalAmount;

        // Update customer totalSpent
        if (customer) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { totalSpent: { increment: totalAmount } },
          });
        }
      }
    }

    // Update session totalSales
    await prisma.posSession.update({
      where: { id: sess.id },
      data: { totalSales: parseFloat(sessionRevenue.total.toFixed(2)), closingCash: parseFloat((2000 + sessionRevenue.total).toFixed(2)) },
    });
  }

  console.log(`✅  Orders seeded (~${orderCount})`);
  console.log(`✅  Payments & Receipts seeded (~${paymentCount})`);

  console.log('\n✨  Seed complete!\n');
  console.log('   Seeded credentials:');
  console.log('   Admin    →  admin@cafedemo.com    / password123');
  console.log('   Manager  →  manager@cafedemo.com  / password123');
  console.log('   Cashier1 →  cashier1@cafedemo.com / password123');
  console.log('   Cashier2 →  cashier2@cafedemo.com / password123');
  console.log('   Kitchen  →  kitchen@cafedemo.com  / password123\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
