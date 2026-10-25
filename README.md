# NO-WAIT Restaurant

A restaurant web application for menu browsing, table reservations, table QR ordering, and owner operations.

The application source and detailed project documentation are in [`restaurant-app/`](restaurant-app/).

## Run locally

Start the backend in one terminal:

```text
cd restaurant-app/backend
npm install
npm run dev
```

Start the frontend in another terminal:

```text
cd restaurant-app/frontend
npm install
npm run dev
```

## Deploy as a website

This repository includes a Render Blueprint in `render.yaml`. In Render, create a Blueprint from this GitHub repository and deploy the `nowait-restaurant` web service. The service builds the React frontend and runs it with the Express API. Render provides a public `onrender.com` URL after deployment.

The free web service may sleep when idle, and its local SQLite data is temporary. This deployment is suitable for a project demo; use persistent or managed storage if database records must survive restarts and deploys.
