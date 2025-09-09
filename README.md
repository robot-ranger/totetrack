# boxly
An inventory and tote tracking system

## Dev HTTPS (for mobile camera access)
Some mobile browsers (and newer permission models) require a secure context (HTTPS or `http://localhost`) for camera access. When loading the site from another device on your LAN (e.g. `http://192.168.x.x:5173`) the page is not secure, so the camera may appear black or permissions are silently denied.

### Quick options
1. Use a tunnel: `ngrok http 5173` (gives you an https URL) — simplest.
2. Use Vite HTTPS with a self‑signed cert (instructions below).
3. Serve via reverse proxy that terminates TLS (Caddy / Nginx with a local CA).

### Self-signed cert for Vite
Run the helper script (optionally pass your LAN IP to add as SAN):
```
cd frontend
./scripts/make-dev-cert.sh            # localhost only
./scripts/make-dev-cert.sh 192.168.1.50  # include LAN IP
```

Start dev server (from `frontend/`):
```
VITE_HTTPS=1 npm run dev
```

Visit `https://<your-lan-ip>:5173` from the phone. Accept the certificate warning once. Camera permission prompt should now appear.

If you still get black video:
- Clear site permissions in the mobile browser.
- Ensure no private/incognito mode blocking camera.
- Try removing the environment facingMode constraint.
- Check console via remote debugging for `NotAllowedError`.

### Troubleshooting
Enumerate devices in the console:
```
navigator.mediaDevices.enumerateDevices().then(d=>console.log(d))
```
You should see at least one `videoinput`. If not, the browser denied access before enumeration (likely insecure context or prior denial).
