# NO-WAIT Restaurant

NO-WAIT is a restaurant web app for browsing a menu, making table reservations, ordering from a table QR page, and managing restaurant operations. The frontend is a React single-page application. The backend is an Express API backed by SQLite and can also serve the built frontend.

## Features

- Public restaurant landing page, menu, restaurant information, and how-it-works pages.
- Customer sign-in flow, customer profile, reservation history, and order history.
- Table reservation flow with date, arrival and departure time, party size, table capacity, and availability checks.
- QR ordering page that accepts a table query parameter, supports a cart, and presents payment and order status flows.
- Owner dashboard for restaurant statistics, reservations, orders, customers, analytics, menu management, and table management.
- SQLite database initialization and migration logic in the backend.

The backend verifies Firebase ID tokens before accepting customer actions. Administrator access is granted only to the email configured in `INITIAL_ADMIN_EMAIL`. Payment collection remains pending until a real provider and signed webhook are integrated; a browser click cannot confirm payment.

## Technology

- React 18, Vite, React Router
- Framer Motion and Lucide React
- Node.js, Express, SQLite
- Firebase Authentication client library for Google sign-in

## Project layout

```text
restaurant-app/
├── backend/
│   ├── data/                 # SQLite database is created here at runtime
│   ├── config/               # Database configuration
│   ├── models/               # Data models
│   ├── db.js                 # Schema initialization and migrations
│   ├── server.js             # REST API and production static hosting
│   └── package.json
├── frontend/
│   ├── public/               # Static assets and images
│   ├── src/
│   │   ├── components/       # Reusable UI and page sections
│   │   ├── context/          # Authentication context
│   │   ├── data/             # Sample menu data
│   │   ├── pages/            # Customer, public, and admin pages
│   │   ├── services/         # API client and app services
│   │   ├── App.jsx           # Route definitions
│   │   └── config/           # Firebase client configuration
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Open two terminals from the `restaurant-app` directory.

### 1. Start the API

```bash
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. The SQLite database is created at `backend/data/nowait.db` when the API first initializes it. Set `PORT` in the backend environment to change the port. Set `TABLE_SHARING_ENABLED=false` to prevent multiple reservations from sharing a table's capacity; the default is enabled.

`TAX_RATE_PERCENT` controls the example order tax calculation (default 5). Set it to the rate appropriate for the restaurant's location and pricing, or to 0 if displayed prices already include tax. Confirm tax rules with the restaurant before using the app for sales.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite prints the frontend URL when it starts, normally `http://localhost:5173`. Its proxy sends `/api` requests to the backend on port 5000.

### Firebase setup (required for sign-in)

The Firebase client reads these Vite environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Copy `frontend/.env.example` to `frontend/.env` and fill in the Firebase web app values. Enable Google under Firebase Console → Authentication → Sign-in method. Add `localhost` and your deployed host under Authentication → Settings → Authorized domains.

Copy `backend/.env.example` to `backend/.env`. Set `FIREBASE_PROJECT_ID` to the same Firebase project ID and set `INITIAL_ADMIN_EMAIL` to the verified Google account allowed to manage the restaurant. Do not commit `.env` files. Restart the backend after editing its settings. For Render, enter those backend values and all `VITE_FIREBASE_*` values in the service's environment settings before building.

### Build and serve the frontend through Express

```bash
cd frontend
npm install
npm run build
cd ../backend
npm install
npm start
```

Express serves `frontend/dist` when that build exists. The UI and API are then both available from the backend origin at `http://localhost:5000`.

## Routes

### Frontend pages

| Path | Purpose | Access |
|---|---|---|
| `/` | Home page | Public |
| `/menu` | Menu browsing | Public |
| `/how-it-works` | Product flow overview | Public |
| `/about` | Restaurant information | Public |
| `/login` | Customer sign-in | Public |
| `/qr-order?table=T01` | Table QR ordering | Public route; reservation checks may apply |
| `/book` | Make a reservation | Customer sign-in required |
| `/profile` | Customer profile | Customer sign-in required |
| `/orders` | Customer order history | Customer sign-in required |
| `/reservations` | Customer reservation history | Customer sign-in required |
| `/owner/login` or `/admin/login` | Owner login | Public |
| `/admin` | Owner dashboard | Admin route |

Unknown frontend paths render the home page.

### API overview

All API routes are prefixed with `/api`. Responses generally use `{ "success": true, "data": ... }` on success and `{ "success": false, "message": ... }` on errors.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | API and database health summary |
| POST | `/auth` | Verify Firebase sign-in and create/update the customer record |
| GET, PATCH | `/users/profile` | Read or update a customer profile |
| GET | `/tables` | List tables |
| GET | `/tables/available` | Check basic table availability |
| GET | `/tables/availability` | Check availability for a date, time range, and party size |
| GET | `/menu` | List menu items |
| GET | `/menu/:id` | Read one menu item |
| POST, PATCH, DELETE | `/menu` and `/menu/:id` | Administrator-only menu changes |
| POST | `/reservations` | Create a reservation |
| GET | `/reservations/my-reservations` | List the authenticated customer's reservations |
| GET | `/reservations` | Administrator-only reservation list |
| DELETE | `/reservations/:id` | Cancel a reservation |
| POST | `/orders` | Create an order |
| GET | `/orders/my-orders` | List the authenticated customer's orders |
| GET | `/orders/:id` | Read an order belonging to the signed-in customer or administrator |
| GET | `/payments/:paymentId` | Read payment status/details |
| POST | `/payments/:paymentId/verify` | Not enabled until a payment provider is integrated |
| POST | `/payments/webhook` | Not enabled until signed provider verification is implemented |
| POST | `/owner/login` | Deprecated; use Firebase administrator sign-in |
| GET | `/admin/stats` | Dashboard summary metrics |
| GET, PATCH | `/admin/reservations` and `/admin/reservations/:id/...` | Search reservations and change status/timing |
| GET, PATCH | `/admin/orders` and `/admin/orders/:id/status` | Search orders and update kitchen order status |
| GET | `/admin/customers` | List customer records |
| GET | `/admin/analytics` | Dashboard analytics |
| GET, POST | `/admin/tables` | List or create tables |
| PATCH, DELETE | `/admin/tables/:id` | Update or deactivate a table |

Availability accepts `date`, `arrivalTime` (or `time`), `leavingTime`, `guests`, and `durationHours` query parameters. Times use values such as `07:00 PM`; dates use `YYYY-MM-DD`.

## Data and development notes

- SQLite schema creation and best-effort migrations run from `backend/db.js` when the database connection is first opened.
- The checked-in `backend/data/nowait.db` may contain local development data. Keep a copy before replacing or deleting it.
- Customer identity comes from verified Firebase ID tokens. The server ignores client-supplied IDs and roles for access decisions. Admin APIs require a verified token for the email configured in `INITIAL_ADMIN_EMAIL`.
- Customer reservation and order history is restricted to the signed-in customer. Menu changes and restaurant operations require administrator access.
- Payment is not enabled. Do not use this version to collect real payments until a provider, signed webhooks, refunds, and reconciliation have been implemented and configured.
- The Render free service uses temporary storage for this SQLite database. Use durable database storage and backups before relying on customer or restaurant records.
- The initial menu and tables are example data; replace them with the restaurant's actual information before inviting customers.
- QR pages use query parameters such as `/qr-order?table=T01`; table identifiers are normalized by the order service.

## Useful commands

Run these from the relevant package directory:

```bash
npm run dev       # Vite frontend or watched backend
npm run build     # Frontend production build
npm run preview   # Preview the frontend build
npm start         # Start backend
npm run lint      # Run frontend ESLint
```

The backend also includes `test_customer_booking.mjs` and `test_phase13.mjs`. They call the running API at `http://localhost:5000`, so start the backend before using those scripts.
