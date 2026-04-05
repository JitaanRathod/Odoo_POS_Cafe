# ☕ Odoo Cafe POS

A full-stack Point of Sale system built for cafes and restaurants — featuring a real-time kitchen display, live floor/table management, multi-method payments, and a live dashboard. Built with **React + Vite** on the frontend and **Node.js + Express + Prisma + MySQL** on the backend, connected via **Socket.io** for real-time updates.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [API Reference](#-api-reference)
- [Socket Events](#-socket-events)
- [User Roles](#-user-roles)
- [Order Lifecycle](#-order-lifecycle)
- [Payment Methods](#-payment-methods)
- [Bug Fixes](#-bug-fixes)

---

## ✨ Features

- **Live Dashboard** — today's revenue, total orders, average order value, active sessions, top products, and payment method breakdown. Auto-refreshes every 30 seconds and updates instantly on payment via Socket.io.
- **Floor & Table Management** — multi-floor support, real-time table status (Free / Occupied / Reserved) pushed via sockets the moment an order is placed or paid.
- **Order Screen** — searchable product catalogue with category filters, add-to-cart with quantity controls, send to kitchen or send-and-pay in one tap.
- **Kitchen Display System (KDS)** — dark-mode display showing all active orders in real time. Staff can move orders through `CREATED → IN_PROGRESS → READY → COMPLETED`.
- **Payment Processing** — Cash, Card, UPI QR code, and Split payments. Configurable per terminal.
- **POS Sessions** — open/close sessions per terminal with opening and closing cash tracking.
- **Customer Management** — optional customer lookup/creation at order time with lifetime spend tracking.
- **Receipt Generation** — unique receipt numbers per order, full receipt data available via API.
- **Role-based Access** — ADMIN, MANAGER, CASHIER, KITCHEN roles with route guards.
- **Multi-branch / Multi-terminal** — each branch has its own floors, products, and terminals.

---

## 🛠 Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | ^4.19 | HTTP framework |
| Prisma | ^5.22 | ORM + migrations |
| MySQL | 8+ | Database |
| Socket.io | ^4.8 | Real-time events |
| jsonwebtoken | ^9.0 | Auth (JWT) |
| bcryptjs | ^3.0 | Password hashing |
| helmet | ^7.2 | Security headers |
| morgan | ^1.10 | HTTP logging |
| express-rate-limit | ^8.3 | Rate limiting |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | ^19 | UI framework |
| Vite | ^8.0 | Build tool |
| React Router DOM | ^7.14 | Client-side routing |
| Zustand | ^5.0 | Global state management |
| Socket.io Client | ^4.8 | Real-time updates |
| Axios | ^1.14 | HTTP client |
| TailwindCSS | ^4.2 | Styling |
| React Hot Toast | ^2.6 | Notifications |
| Lucide React | ^1.7 | Icons |
| React Hook Form + Zod | latest | Forms & validation |
| QRCode React | ^4.2 | UPI QR code generation |

---

## 📁 Project Structure

```
Odoo_POS_Cafe/
├── odoo-cafe-pos-backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models
│   │   ├── seed.js                # Seed data (branch, floors, tables, products)
│   │   └── migrations/            # Prisma migration history
│   └── src/
│       ├── server.js              # Entry point — HTTP + Socket.io boot
│       ├── app.js                 # Express app setup (CORS, middleware, routes)
│       ├── config/
│       │   ├── env.js             # Env var validation
│       │   └── prisma.js          # Prisma client singleton
│       ├── routes/                # One file per resource
│       ├── controllers/           # Request/response handling
│       ├── services/              # Business logic
│       │   ├── order.service.js   # Create, add items, send to kitchen, status
│       │   ├── payment.service.js # Process payment, receipts, free table
│       │   └── ...
│       └── utils/
│           ├── socket.js          # Socket.io singleton (init / emit helpers)
│           └── constants.js       # Enums, socket event names, error messages
│
└── odoo-cafe-pos-frontend/
    ├── public/
    └── src/
        ├── api/                   # Axios wrappers per resource
        ├── store/                 # Zustand stores (session, cart, kitchen, display)
        ├── lib/
        │   ├── socket.js          # Socket.io client singleton
        │   └── hooks/             # useSocket, useOrders, useFloors, etc.
        ├── components/
        │   ├── Layout/            # AuthGuard, RoleGuard, Topbar, Sidebar
        │   └── UI/                # Button, Card, Badge, Modal, Spinner, etc.
        └── pages/
            ├── auth/              # Login, Signup
            ├── backend/           # Dashboard, Products, Floors, PaymentMethods, Terminal
            ├── pos/               # SelectTerminal, FloorView, OrderScreen, Payment, UPIPayment, PaymentSuccess
            ├── kitchen/           # KitchenDisplay
            ├── customer/          # CustomerDisplay
            └── booking/           # Booking
```

---

## 🗄 Database Schema

```
User ──────────────┐
                   │ cashier
Branch ────────────┤
  │                │
  ├── Category     │
  ├── Product      │
  ├── Floor        │
  │     └── Table ─┤
  ├── PosTerminal ─┤
  │     ├── PosSession
  │     └── PaymentSettings
  └── Order ───────┘
        ├── OrderItem → Product
        ├── Payment
        └── Receipt

Customer ──── Order
```

**Key Enums:**

| Enum | Values |
|---|---|
| `OrderStatus` | `DRAFT → CREATED → IN_PROGRESS → READY → COMPLETED / CANCELLED` |
| `OrderType` | `DINE_IN`, `TAKEAWAY` |
| `TableStatus` | `FREE`, `OCCUPIED`, `RESERVED` |
| `PaymentMethod` | `CASH`, `CARD`, `UPI`, `SPLIT` |
| `UserRole` | `ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN` |

---

## ✅ Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher (running locally or remote)
- **npm** v9+

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/odoo-cafe-pos.git
cd odoo-cafe-pos
```

### 2. Install backend dependencies

```bash
cd odoo-cafe-pos-backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../odoo-cafe-pos-frontend
npm install
```

---

## 🔐 Environment Variables

### Backend — `odoo-cafe-pos-backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database (MySQL)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/cafe_pos"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS (comma-separated allowed origins, or * for all)
CORS_ORIGIN=http://localhost:5173
```

### Frontend — `odoo-cafe-pos-frontend/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## ▶️ Running the App

### 1. Set up the database

```bash
cd odoo-cafe-pos-backend

# Run migrations (creates all tables)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed with sample data (branch, floors, tables, products, admin user)
npm run db:seed
```

### 2. Start the backend

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### 3. Start the frontend

```bash
cd ../odoo-cafe-pos-frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. (Optional) Open Prisma Studio

```bash
cd odoo-cafe-pos-backend
npm run db:studio
```

Opens a visual DB browser at `http://localhost:5555`.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/signup` | Register new user |
| `GET` | `/api/auth/me` | Current user info |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List orders (filterable) |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/orders/:id/items` | Add items to order |
| `DELETE` | `/api/orders/:id/items/:itemId` | Remove item from order |
| `POST` | `/api/orders/:id/send-to-kitchen` | Mark order IN_PROGRESS, emit to KDS |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `GET` | `/api/orders/kitchen` | Active kitchen orders (CREATED / IN_PROGRESS) |
| `GET` | `/api/orders/table/:tableId/active` | Active order for a table |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments/process` | Process payment (single or split) |
| `GET` | `/api/payments/:orderId/receipt` | Get receipt data |
| `GET` | `/api/payments` | List payments with filters |

### Floors & Tables
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/floors` | List floors with tables and active orders |
| `POST` | `/api/floors` | Create floor |
| `POST` | `/api/floors/:id/tables` | Add table to floor |
| `PATCH` | `/api/floors/tables/:tableId` | Update table status |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions/open` | Open a POS session |
| `POST` | `/api/sessions/:id/close` | Close a session |
| `GET` | `/api/sessions/active/:terminalId` | Get active session for terminal |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products (with category filter) |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/dashboard` | Today's revenue, orders, top products, payment breakdown |

### Customers, Terminals, Payment Settings
Standard CRUD at `/api/customers`, `/api/terminals`, `/api/payment-settings/:terminalId`.

---

## 🔌 Socket Events

All events are broadcast globally via `io.emit()`. The canonical event names are defined in `src/utils/constants.js`.

| Event | Direction | Payload | Consumers |
|---|---|---|---|
| `kitchen:newOrder` | Server → Client | `{ order, items }` | `KitchenDisplay` |
| `kitchen:orderUpdate` | Server → Client | `{ orderId, status }` | `KitchenDisplay` |
| `table:statusChange` | Server → Client | `{ tableId, status }` | `FloorView` |
| `payment:received` | Server → Client | `{ orderId, receiptNumber, totalAmount }` | `Dashboard` |
| `session:closed` | Server → Client | `{ sessionId }` | All POS clients |

> **Important:** Always use the exact event names above. Mismatches between server `emit()` and client `on()` are silent failures — the most common source of real-time bugs in this codebase (see [Bug Fixes](#-bug-fixes)).

---

## 👤 User Roles

| Role | Access |
|---|---|
| `ADMIN` | Full access — dashboard, products, floors, terminals, all orders |
| `MANAGER` | Dashboard + POS + reports (no user management) |
| `CASHIER` | POS only — floor view, order screen, payment |
| `KITCHEN` | Kitchen display only |

The default seeded admin credentials are set in `prisma/seed.js`. Change them before going to production.

---

## 🔄 Order Lifecycle

```
[Cart built in OrderScreen]
         │
         ▼
   POST /api/orders          ← creates order, marks table OCCUPIED
         │                      emits: table:statusChange (OCCUPIED)
         ▼
POST /api/orders/:id/items   ← adds items to order
         │
         ▼
POST /api/orders/:id/send-to-kitchen
         │                      emits: kitchen:newOrder
         ▼                             table:statusChange (OCCUPIED)
  [KitchenDisplay shows order]
         │
         ▼
   PATCH status → IN_PROGRESS  emits: kitchen:orderUpdate
         │
         ▼
   PATCH status → READY        emits: kitchen:orderUpdate
         │
         ▼
  POST /api/payments/process   ← marks order COMPLETED, frees table
         │                        emits: payment:received
         │                               table:statusChange (FREE)
         ▼
  [Dashboard updates, table turns green]
```

---

## 💳 Payment Methods

| Method | Notes |
|---|---|
| **CASH** | Enabled by default. Cashier enters amount received. |
| **CARD** | Enable per-terminal in Payment Settings. |
| **UPI** | Generates a QR code via `qrcode.react`. Enable and set UPI ID in Payment Settings. |
| **SPLIT** | Pass `method: "SPLIT"` with a `splitPayments` array. Each entry needs `method` and `amount`. Sum must equal order total. |

Payment methods available on the checkout screen are controlled by the terminal's `PaymentSettings` record. Configure at `/backend/payment-methods`.

---