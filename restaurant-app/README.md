# NO-WAIT Restaurant

NO-WAIT is a restaurant web app for browsing a menu, making table reservations, ordering from a table QR page, and managing restaurant operations. The frontend is a React single-page application. The backend is an Express API backed by SQLite and can also serve the built frontend.

## Features

- Public restaurant landing page, menu, restaurant information, and how-it-works pages.
- Customer sign-in flow, customer profile, reservation history, and order history.
- Table reservation flow with date, arrival and departure time, party size, table capacity, and availability checks.
- QR ordering page that accepts a table query parameter, supports a cart, and presents payment and order status flows.
- Owner dashboard for restaurant statistics, reservations, orders, customers, analytics, menu management, and table management.
- SQLite database initialization and migration logic in the backend.

Some frontend services also use browser local storage and sample menu data. Payment and sign-in integrations should be treated as development/demo flows until configured and reviewed for production use.

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

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite prints the frontend URL when it starts, normally `http://localhost:5173`. The frontend API client currently points to `http://localhost:5000/api` in `frontend/src/services/api.js`.

### Optional Firebase setup

The Firebase client reads these Vite environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Without real project values, the code falls back to demo placeholders. Google sign-in therefore requires a configured Firebase project and enabled Google provider to work correctly.

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
| POST | `/auth` | Find or create a customer record |
| GET, PATCH | `/users/profile` | Read or update a customer profile |
| GET | `/tables` | List tables |
| GET | `/tables/available` | Check basic table availability |
| GET | `/tables/availability` | Check availability for a date, time range, and party size |
| GET | `/menu` | List menu items |
| GET | `/menu/:id` | Read one menu item |
| POST, PATCH, DELETE | `/menu` and `/menu/:id` | Create, update, or remove menu items |
| POST | `/reservations` | Create a reservation |
| GET | `/reservations/my-reservations` | List the authenticated customer's reservations |
| GET | `/reservations` | List reservations for administration |
| DELETE | `/reservations/:id` | Cancel a reservation |
| POST | `/orders` | Create an order |
| GET | `/orders/my-orders` | List the authenticated customer's orders |
| GET, PATCH | `/orders/:id` | Read an order or update its status |
| GET | `/payments/:paymentId` | Read payment status/details |
| POST | `/payments/:paymentId/verify` | Run the payment verification flow |
| POST | `/payments/webhook` | Payment webhook endpoint |
| POST | `/owner/login` | Owner login |
| GET | `/admin/stats` | Dashboard summary metrics |
| GET, PATCH | `/admin/reservations` and `/admin/reservations/:id/...` | Search reservations and change status/timing |
| GET, PATCH | `/admin/orders` and `/admin/orders/:id/status` | Search orders and change order/payment status |
| GET | `/admin/customers` | List customer records |
| GET | `/admin/analytics` | Dashboard analytics |
| GET, POST | `/admin/tables` | List or create tables |
| PATCH, DELETE | `/admin/tables/:id` | Update or deactivate a table |

Availability accepts `date`, `arrivalTime` (or `time`), `leavingTime`, `guests`, and `durationHours` query parameters. Times use values such as `07:00 PM`; dates use `YYYY-MM-DD`.

## Data and development notes

- SQLite schema creation and best-effort migrations run from `backend/db.js` when the database connection is first opened.
- The checked-in `backend/data/nowait.db` may contain local development data. Keep a copy before replacing or deleting it.
- Customer API requests pass a user identifier in the `x-user-id` header. This is application-level identification, not a secure production authentication boundary by itself.
- Admin table calls currently send a static `x-admin-token` from the frontend service. Do not expose this pattern as a production security mechanism; replace it with server-validated authentication and authorization before deployment.
- The API currently enables CORS broadly and uses a fixed localhost API URL in the frontend. Configure both appropriately before public deployment.
- Payment-related API and UI flows exist, but configure a real payment provider and verify server-side callbacks before accepting real payments.
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
