# NO-WAIT Restaurant

NO-WAIT is a restaurant web app for browsing the menu, making table reservations, ordering from a table QR page, and managing restaurant operations. The frontend is React; the Express backend uses SQLite and can serve the built frontend.

## Features

- Restaurant home, menu, information, and how-it-works pages.
- Customer email-and-password registration, sign-in, profile, reservation history, and order history.
- Table reservations with date, time, party size, capacity, and availability checks.
- QR ordering with a cart and order status flow.
- Owner dashboard for reservations, orders, customers, analytics, menu, and tables.
- SQLite database initialization and migrations.

Google/Firebase sign-in has been removed. Passwords are stored as salted scrypt hashes, and the API issues signed sessions using JWT_SECRET. The administrator account is provisioned from backend environment variables. Payments are not enabled until a real provider and signed webhook are integrated.

## Technology

- React 18, Vite, React Router
- Framer Motion and Lucide React
- Node.js, Express, SQLite, Node.js crypto

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Open two terminals from the restaurant-app directory.

### Configure and start the API

```bash
cd backend
npm install
```

Copy backend/.env.example to backend/.env. Set JWT_SECRET to a random secret of at least 32 characters. To enable owner login, set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD; the password must be at least 12 characters. Keep .env private and do not commit it. The server creates or updates this administrator account at startup.

```bash
npm run dev
```

The API listens on http://localhost:5000 by default. SQLite is created at backend/data/nowait.db. TABLE_SHARING_ENABLED=false disables shared table capacity (default is enabled). TAX_RATE_PERCENT controls example tax calculation (default 5); confirm local tax rules before sales.

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite normally uses http://localhost:5173 and proxies /api requests to port 5000. No Firebase or Google configuration is needed.

### Build and serve through Express

```bash
cd frontend
npm install
npm run build
cd ../backend
npm install
npm start
```

Express serves frontend/dist when a build exists. Both UI and API are then available at http://localhost:5000.

## Frontend routes

| Path | Purpose | Access |
|---|---|---|
| / | Home | Public |
| /menu | Menu | Public |
| /how-it-works | Product flow | Public |
| /about | Restaurant information | Public |
| /login | Customer registration and sign-in | Public |
| /qr-order?table=T01 | QR ordering | Public route |
| /book | Make a reservation | Signed-in customer |
| /profile | Customer profile | Signed-in customer |
| /orders | Order history | Signed-in customer |
| /reservations | Reservation history | Signed-in customer |
| /owner/login or /admin/login | Owner login | Public |
| /admin | Owner dashboard | Administrator |

## API overview

All API routes are prefixed with /api. Responses generally use { "success": true, "data": ... } on success.

| Method | Path | Purpose |
|---|---|---|
| GET | /health | API and database health |
| POST | /auth/register | Create customer account and sign in |
| POST | /auth/login | Sign in with email and password |
| GET | /auth/me | Return current signed-in account |
| GET, PATCH | /users/profile | Read or update customer profile |
| GET | /tables | List tables |
| GET | /tables/available, /tables/availability | Check table availability |
| GET | /menu, /menu/:id | List menu or read one item |
| POST, PATCH, DELETE | /menu and /menu/:id | Administrator menu changes |
| POST | /reservations | Create a reservation |
| GET | /reservations/my-reservations | Customer reservation history |
| GET | /reservations | Administrator reservation list |
| DELETE | /reservations/:id | Cancel a reservation |
| POST | /orders | Create an order |
| GET | /orders/my-orders | Customer order history |
| GET | /orders/:id | Read an order |
| GET | /payments/:paymentId | Read payment details |
| POST | /payments/:paymentId/verify or /payments/webhook | Disabled until provider integration |
| GET | /admin/stats | Dashboard metrics |
| GET, PATCH | /admin/reservations, /admin/orders | Manage reservations and orders |
| GET | /admin/customers, /admin/analytics | Customer list and analytics |
| GET, POST | /admin/tables | List or create tables |
| PATCH, DELETE | /admin/tables/:id | Update or deactivate a table |

Availability accepts date, arrivalTime (or time), leavingTime, guests, and durationHours. Dates use YYYY-MM-DD.

## Data, security, and limitations

- SQLite schema initialization and migrations run from backend/db.js.
- Passwords use salted scrypt hashes; plaintext passwords are not stored. Protected routes verify signed tokens and read current roles from SQLite.
- Set a unique private JWT_SECRET of at least 32 characters. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to create/update the owner account. Customer registration cannot use the configured admin email.
- This demo does not include email verification or password-reset email flows. Add them before public production use.
- Payment collection is disabled. Integrate a payment provider, signed webhooks, refunds, and reconciliation before accepting real payments.
- Render's free service uses temporary storage for SQLite. Use durable storage and backups for real customer records.
- Replace example menu and table data before inviting customers.

## Useful commands

Run from the relevant package directory:

```bash
npm run dev
npm run build
npm run preview
npm start
npm run lint
```

The backend includes test_customer_booking.mjs and test_phase13.mjs, which require the API to be running at http://localhost:5000.
