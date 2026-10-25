# NO-WAIT Restaurant

A restaurant web application for menu browsing, table reservations, table QR ordering, and owner operations.

The application source and detailed project documentation are in restaurant-app/.

## Run locally

Start the backend in one terminal:

```text
cd restaurant-app/backend
npm install
```

Copy restaurant-app/backend/.env.example to restaurant-app/backend/.env. Choose a unique JWT_SECRET with at least 32 characters, and set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD for owner login. Keep .env private.

```text
npm run dev
```

Start the frontend in another terminal:

```text
cd restaurant-app/frontend
npm install
npm run dev
```

## Deploy as a website

This repository includes a Render Blueprint in render.yaml. Create a Blueprint from this GitHub repository and deploy the nowait-restaurant web service. Set JWT_SECRET, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD in Render. Render provides a public onrender.com URL after deployment.

The free web service may sleep when idle, and its local SQLite data is temporary. This is suitable for a project demo; use persistent or managed storage if records must survive restarts and deploys.

Customer registration and sign-in ask only for a name and mobile number. SMS ownership verification is not configured, so this demo sign-in is not suitable for protecting real customer accounts. The separate owner page uses the administrator credentials configured on the backend. Online payment is disabled until a real provider is connected.
