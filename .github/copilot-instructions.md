# ToteTrack - AI Coding Assistant Instructions

## Architecture Overview
- **Monorepo**: `frontend/` (React + Vite + TypeScript + Chakra UI v3) + `backend/` (FastAPI + SQLAlchemy 2.x + SQLite)
- **Authentication**: JWT tokens via context provider (`frontend/src/auth.tsx`), stored in localStorage
- **Data Flow**: REST API → React components → Chakra UI v3 components
- **Image Storage**: Backend serves static files via `/media/*` mount, stored on disk

## Key Patterns & Conventions

### Frontend (React + TypeScript)
- **Chakra UI v3**: Always use the new API with `createSystem()` in `provider.tsx`, not the old `extendTheme`
- **API Client**: Centralized in `api.ts` with axios instance, uses `/api` proxy in dev (strips to backend root)
- **Types**: Shared interfaces in `types.ts` (Tote, Item, User, Location)
- **Component Aliases**: Use `const Cbx = Combobox as any` pattern to work around strict TypeScript in UI components
- **Auth Context**: Global user state via `AuthProvider`, call `refreshMe()` after profile updates
- **Form State**: Simple useState hooks, no form libraries
- **Toast Pattern**: Currently uses `console.log()` - migrate to Chakra's `createToaster()` when needed

### Backend (FastAPI + SQLAlchemy 2.x)
- **Database**: SQLite file (`totes.db`) with UUID primary keys as strings
- **Authentication**: OAuth2 password flow + JWT via `python-jose`
- **Image Upload**: Multipart forms, stored in `media/` directory, served via static mount
- **CRUD Pattern**: Separation in `crud.py`, `models.py`, `schemas.py` (Pydantic v2)
- **User Isolation**: All resources scoped by `user_id` foreign key

## Development Environment

### Starting Dev Servers
```bash
# Frontend (from /workspaces/boxly/frontend)
npm run dev -- --host 0.0.0.0

# Backend (from /workspaces/boxly/backend) 
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Key Commands
- **Python Environment**: Use existing `.venv` in `backend/` directory
- **Package Management**: `uv` for Python (see `backend/uv.lock`), `npm` for Node.js
- **Database**: SQLite file ships with repo, auto-created via SQLAlchemy
- **Images**: Uploaded to `backend/media/`, served via FastAPI static files

## Project-Specific Patterns

### Location System
- **Migration Pattern**: Totes have both `location` (string, deprecated) and `location_id` (FK to locations table)
- **Backward Compatibility**: API responses include both fields during transition

### Component Patterns
- **Forms**: Direct state management with controlled inputs, no validation libraries
- **Tables**: Custom components using Chakra UI v3 primitives
- **QR Codes**: `qrcode.react` for generation, `@yudiel/react-qr-scanner` for scanning
- **Responsive Navigation**: Sidebar (desktop) + drawer (mobile) pattern in main layout

### API Integration
- **Proxy Setup**: Vite proxies `/api/*` → `localhost:8000` (strips `/api` prefix)
- **Image URLs**: Backend returns relative paths like `/media/filename.jpg`
- **Error Handling**: Try/catch with console logging, minimal user feedback currently

### State Management
- **Global State**: Only authentication via React Context
- **Local State**: Component-level useState for forms and UI state
- **Server State**: No caching layer, direct API calls

## File Structure References
- **Types**: `frontend/src/types.ts` - shared interfaces
- **API**: `frontend/src/api.ts` - all backend communication
- **Auth**: `frontend/src/auth.tsx` - authentication context
- **UI System**: `frontend/src/components/ui/provider.tsx` - Chakra v3 setup
- **Backend Models**: `backend/app/models.py` - SQLAlchemy ORM
- **API Routes**: `backend/app/main.py` - FastAPI endpoints