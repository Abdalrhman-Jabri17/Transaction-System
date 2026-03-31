# backend-ledger

A lightweight Node.js API for ledger/account/transaction management with authentication, built for learning and production-ready extension.

## 🚀 Overview

`backend-ledger` is a RESTful API backend using:
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Modular controllers, routes, middleware, and services

## 📁 Project structure

- `server.js` — server bootstrap
- `src/app.js` — express setup, middleware, route loader
- `src/config/db.js` — mongo connection module
- `src/models/` — Mongoose schemas (user, account, transaction, ledger)
- `src/controller/` — app logic for auth/account/transaction
- `src/routes/` — API routes
- `src/middleware/auth.middleware.js` — JWT guard
- `src/services/email.service.js` — mail helper patterns

## 🛠️ Features

- Sign up / login with JWT
- Secured routes for account + transaction operations
- CRUD management for accounts and transactions
- Ledger balance handling
- Extensible architecture for role-based ACL, reporting, auditing

## ⚙️ Prerequisites

- Node.js 18+ (recommended)
- npm or yarn
- MongoDB (local or Atlas)

## ▶️ Setup

1. Clone
   ```bash
   git clone https://github.com/<your-username>/backend-ledger.git
   cd backend-ledger
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create and configure `.env`:
   ```text
   MONGO_URI=<your_mongo_connection_string>
   JWT_SECRET=<strong-secret>
   PORT=5000
   ```
4. Start server
   ```bash
   npm start
   # or
   npm run dev
   ```

## 🔌 API endpoints

Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

Accounts
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:id`
- `PUT /api/accounts/:id`
- `DELETE /api/accounts/:id`

Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

> Use header: `Authorization: Bearer <token>` for protected resources.

## ✉️ Email service notifications

`src/services/email.service.js` is designed for registering automatic notifications in these flows:

- Account creation/registation: send welcome email.
- Transaction completion: send on-chain (ledger) confirmation to sender and receiver.

Example hooks:

- `auth.controller.js` (after signup): `emailService.sendRegistrationEmail(user)`
- `transaction.controller.js` (after successful post):
  `emailService.sendTransactionConfirmation(transaction, user)`

This improves trust and auditability in real-world wallets and cashing platforms.

## 🧩 Suggested workflow

1. Register user
2. Login and save JWT
3. Create accounts
4. Add transactions
5. Observe ledger entries and balances

## 💵 Initial funding (system user)

To mimic real-world cashing and ensure system integrity, seed the system with an initial `system` user and funding entry:

1. Create a system user (in code or DB directly) with a fixed service account name, e.g. `system@ledger.local`.
2. Login as system user and capture token.
3. Create a dedicated platform account, e.g. `System Reserve`.
4. Post initial transaction using system token:
   - `sourceAccount`: OS or default account (optional)
   - `destinationAccount`: `System Reserve`
   - `amount`: starting float (e.g. 100000)
   - `description`: `Initial capital injection`.
5. Use this fund origin to seed user payouts and cashing flows in tests.

This provides a stable starting balance, allows traceability in ledger history, and simulates production cash-run behavior.

## �🛡️ Production notes

- Enforce HTTPS
- Enable strong JWT expiration + refresh tokens
- Add input validation middleware
- Add rate limit and CORS rules
- Add logging and monitoring
- Secure `.env` and use secrets manager for cloud deploy

## 🧪 Testing

Add automated tests with Jest + Supertest in future updates.

## 📄 License

MIT (or choose your license)
