# Occusmart 360

Occusmart 360 is a standalone operations demo for an occupational health practice. Its dashboard draws on employer accounts, group assessment bookings, invoices and work items. The interface carries over the navy and blue design from the original Occusmart 360 prototype.

## Run locally

Install Node.js 22 or newer. From the repository root, run:

```sh
npm start
```

Open `http://127.0.0.1:4173`. The server uses loopback and defaults to port 4173. Set the `PORT` environment variable to use a different port. There are zero package dependencies and no credentials or environment files to configure.

## Build and test

```sh
npm test
npm run build
npm start -- --dist
```

Stop the source server before starting the built preview on the same port. The build checks the app script and copies the three static assets into `dist/`. Serve that folder with any static HTTP host. The relative asset paths support hosting under a subpath.

## Demo walkthrough

1. Open **Overview** to see active employers, upcoming assessments, unpaid invoices and open work.
2. Add an employer under **Employer clients**, then create a linked appointment and invoice. Search the lists by employer name.
3. Mark the invoice paid and close a task in **Work queue**. Return to **Overview** to see the figures update.
4. Reload to verify that changes persist. Use the overview JSON export for all records or download a CSV from a module.

The app starts with fictional records and dates relative to first use. Changes are stored in browser local storage under `occusmart360-demo-v1`. Storage is specific to the browser profile and site origin, including its port. To reset the demo, remove that local storage key and reload. JSON and CSV are downloadable snapshots.

Use fictional data only. The demo has browser-local storage, with no shared database, staff login, role permissions, audit trail or clinical records. Serve privately if access needs to be restricted.

## Project layout

- `src/` contains the HTML shell, styles and browser application.
- `scripts/` contains the local server and static build.
- `test/` contains automated checks for the demo workflows.

The original prototype was recovered from the closed [website prototype PR](https://github.com/CodevenientLab/Occusmart/pull/1). This repository contains the complete runnable app.
