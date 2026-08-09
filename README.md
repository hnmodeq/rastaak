# Vectr Website Clone

A pixel-perfect, fully interactive clone of [Vectr](https://www.vectrfl.com/).

## Features

- **3D WebGL / Three.js Hero Scene**: Custom dark-mode nuclear facility industrial site with glowing wireframes, animated turbines, rigged craft workers, particle smoke, and dynamic scroll synchronization.
- **Draco 3D Mesh Compression**: Pre-configured Draco WebAssembly decoders (`draco_decoder.wasm`) for high performance.
- **8 Pages & Sub-routes**:
  - `/` (Home)
  - `/apply` (Apply to Vectr with multi-step application modal)
  - `/industries` (Nuclear, Gas, Data Centers, Semiconductor with stacked cards)
  - `/our-mission` (Mission, Middleman model, and Outcomes)
  - `/request-crew` (24/7 Outage mobilization form)
  - `/privacy` (Privacy Policy)
  - `/privacy-request` (Privacy Requests)
  - `/terms` (Terms of Service)
- **Taxi.js Page Transitions**: Fluid, SPA routing and animated transitions between pages without full page reloads.
- **Full Backend Server (`server.js`)**:
  - Built with Node.js
  - Fast static file serving with exact MIME types
  - `POST /api/request-crew` endpoint
  - `POST /api/apply` endpoint
  - `GET /api/submissions` endpoint

## Quick Start

### 1. Install & Run
```bash
# Start server
node server.js
```
The server will be available at `http://localhost:3000`.

### 2. Available Routes
- `http://localhost:3000/`
- `http://localhost:3000/apply`
- `http://localhost:3000/industries`
- `http://localhost:3000/our-mission`
- `http://localhost:3000/request-crew`
- `http://localhost:3000/privacy`
- `http://localhost:3000/privacy-request`
- `http://localhost:3000/terms`
