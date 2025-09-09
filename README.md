# Boxly

Inventory & tote tracking with fast item capture, QR labels, and mobile-friendly scanning.

## Overview
Boxly lets you create "totes" (containers) and add items (optionally with photos) so you can search, scan, and know where everything lives. Each tote gets a UUID you can render as a QR code for printing and attaching to the tote; scanning jumps straight to the tote detail view. Great for garage / maker space / prop room / move preparation organization.

### Core Features
- Create / delete totes with name, location, description, arbitrary metadata JSON
- Add/update/remove items (name, quantity, description, image upload)
- Image storage on disk served via `/media/*`
- Fast search across all items
- QR label component for easy printing
- Mobile camera QR scanning (secure context aware)

### Stack
- Frontend: React 18 + Vite + TypeScript + Chakra UI
- Backend: FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite (file DB shipped as `totes.db`)
- Dev Environment: VS Code Dev Container (Python + Node + uv package manager)

---
## Quick Start (Dev)
Follow these 4 steps (requested flow):

1. Build / open the Dev Container
	- In VS Code: Command Palette > "Dev Containers: Rebuild and Reopen in Container" (or initial prompt when opening repo)
	- CLI (optional):
	  ```bash
	  devcontainer up --workspace-folder .
	  ```
	Post-create hooks auto install frontend deps (`npm install`) and backend deps (`uv sync`).

2. Start the frontend
	```bash
	cd frontend/
	npm run dev -- --host 0.0.0.0   # exposes on :5173 for LAN & container
	```
	Visit: http://localhost:5173 (or https variant below). Add `VITE_HTTPS=1` for a self‑signed cert.

3. Launch backend (FastAPI) in debug / auto-reload
	```bash
	cd backend/
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
	```
	Docs: http://localhost:8000/docs  |  OpenAPI JSON: http://localhost:8000/openapi.json

4. Launch a browser debugger (Chrome or Firefox)
	- In VS Code: Run & Debug panel → choose "Chrome: Frontend" or "Firefox: Frontend" (see provided `.vscode/launch.json`).
	- Or manually open your browser at the frontend URL and use devtools.

You now have:
- Frontend: 5173
- Backend API: 8000

---
## API Snapshot
| Method | Path | Description |
|--------|------|-------------|
| POST | /totes | Create tote |
| GET | /totes | List totes |
| GET | /totes/{id} | Get tote detail (includes items) |
| DELETE | /totes/{id} | Delete tote |
| POST | /totes/{id}/items | Create item (multipart form, optional image) |
| GET | /items | List all items |
| GET | /totes/{id}/items | Items in one tote |
| PUT | /items/{item_id} | Update item (fields + optional new image) |
| DELETE | /items/{item_id} | Delete item |

Image URLs in responses (if present) are relative (e.g. `/media/filename.jpg`).

### Example Tote (response)
```json
{
  "id": "6c4d4c8c-a9c4-4b6e-9a1e-7d5d5d7e1f09",
  "name": "Electronics",
  "location": "Shelf A3",
  "description": "Cables and adapters",
  "metadata_json": null,
  "items": []
}
```

---
## Dev HTTPS (mobile camera / QR scanning)
Some mobile browsers require a secure context (HTTPS or `http://localhost`) for camera access. Accessing via raw LAN IP over HTTP (e.g. `http://192.168.x.x:5173`) can block the camera.

### Options
1. Tunnel: `ngrok http 5173` (fastest; free cert)
2. Built-in Vite HTTPS with a self‑signed cert (script below)
3. Reverse proxy w/ local CA (Caddy / Nginx / Traefik)

### Self-signed Cert Script
```bash
cd frontend
./scripts/make-dev-cert.sh              # localhost only
./scripts/make-dev-cert.sh 192.168.1.50 # add LAN IP as SAN
VITE_HTTPS=1 npm run dev -- --host 0.0.0.0
```
Then browse: https://<lan-ip>:5173 and accept the warning once.

### If Camera Is Still Black
- Clear site permissions on device
- Exit private/incognito mode
- Check console for `NotAllowedError`
- Enumerate devices:
  ```js
  navigator.mediaDevices.enumerateDevices().then(d => console.log(d))
  ```

---
## Folder Structure (abridged)
```
backend/app/        # FastAPI application (models, CRUD, schemas, main)
backend/totes.db    # SQLite database file
frontend/src/       # React + TS source
frontend/scripts/   # Dev certificate helper
.devcontainer/      # Dev container config
```

---
## Debugging Tips
- Use the provided VS Code launch configs (Chrome / Firefox / FastAPI) or run commands manually.
- If FastAPI changes aren't reflected: ensure `--reload` flag is present.
- DB persistence: SQLite file `backend/totes.db`; delete it to start fresh.

---
## Roadmap (ideas)
- Auth / multi-user separation
- Bulk import & export (CSV / JSON)
- Tagging & advanced search filters
- Object storage backend for images (S3 / Supabase)
- Offline-capable PWA mode

---
## License
MIT (see `LICENSE`).

---
## Contributing
Small project for now—open an issue or PR with improvements. Please keep changes focused and include a short rationale.

---
## Acknowledgements
- FastAPI for the clean Python web framework
- Chakra UI for rapid accessible styling
- QR code components powering label generation

Happy organizing!
