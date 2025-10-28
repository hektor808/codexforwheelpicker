# Wheel Picker

A full-stack web application for creating beautiful spinning wheels that help you make quick, random decisions from your own lists of options. Build multiple wheels, customise weights, and track previous spins with a polished, modern interface.

## Features

- ✨ Create unlimited wheels with custom names and descriptions.
- 🧾 Manage wheel items inline with optional weighting for biased spins.
- 🎡 Animated wheel visualisation with conic-gradient segments and confetti feedback.
- 📝 Automatically stores the latest 20 spins per wheel.
- 🔌 REST API built with Express and a simple JSON file store.
- ⚡️ Vite + React front end styled with Tailwind CSS.

## Getting started

### Prerequisites

- Node.js 18 or later
- npm (bundled with Node.js)

### Install dependencies

```bash
cd server
npm install
cd ../client
npm install
```

### Run the development servers

Start the API first:

```bash
cd server
npm run dev
```

Then, in a separate terminal, start the React client:

```bash
cd client
npm run dev
```

The client is configured to proxy `/api` requests to `http://localhost:4000`.

### Build for production

```bash
cd server
npm run build
cd ../client
npm run build
```

The server compiles TypeScript into `server/dist`, while the client emits static assets into `client/dist` ready to be served from any static host.

## API overview

| Method | Endpoint              | Description                 |
| ------ | --------------------- | --------------------------- |
| GET    | `/api/lists`          | Retrieve all wheels         |
| POST   | `/api/lists`          | Create a new wheel          |
| GET    | `/api/lists/:id`      | Fetch a single wheel        |
| PUT    | `/api/lists/:id`      | Update wheel details/items  |
| DELETE | `/api/lists/:id`      | Delete a wheel              |
| POST   | `/api/lists/:id/spins`| Spin a wheel and log result |

Data is persisted in `server/data/lists.json`; the file is created automatically on first run.

## Project structure

```
client/   React + Vite front end
server/   Express API with JSON store
data/     Persisted wheel data (auto-generated)
```

Feel free to extend the project with authentication, collaborative features, or persistent databases as your needs grow.
