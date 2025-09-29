# Multi-Instance Deployment Guide

This guide explains how to run multiple instances of ToteTrack simultaneously on the same host, each with its own database and backend.

## Overview

The Docker Compose configuration has been parameterized to support multiple instances by using:
- `COMPOSE_PROJECT_NAME` to create unique container and volume names
- Environment variables for port configuration
- Separate databases for each instance

## Quick Start

### 1. Running Multiple Instances

**Production Instance:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your production settings
# Then start the production instance
docker-compose up -d
```

**Staging Instance:**
```bash
# Start staging instance using the staging environment file
docker-compose --env-file .env.staging up -d
```

**Development Instance:**
```bash
# Start development instance using the dev environment file
docker-compose --env-file .env.dev up -d
```

### 2. Managing Multiple Instances

**Check running instances:**
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

**Stop a specific instance:**
```bash
# Stop production (using default .env)
docker-compose down

# Stop staging
docker-compose --env-file .env.staging down

# Stop development
docker-compose --env-file .env.dev down
```

**View logs for a specific instance:**
```bash
# Production logs
docker-compose logs -f

# Staging logs
docker-compose --env-file .env.staging logs -f

# Development logs
docker-compose --env-file .env.dev logs -f
```

## Environment Configuration

Each instance requires its own environment file with unique values for:

### Required Variables

- `COMPOSE_PROJECT_NAME`: Unique name for the instance (e.g., `totetrack-prod`, `totetrack-staging`)
- `POSTGRES_DB`: Database name (should be unique per instance)
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `SECRET_KEY`: JWT secret key (must be unique per instance)
- `BACKEND_PORT`: Host port for backend API (must be unique, e.g., 8880, 8881, 8882)
- `FRONTEND_PORT`: Host port for frontend (must be unique, e.g., 8888, 8889, 8890)

### Optional Variables

- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration (default: 30)
- `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`: Password reset token expiration (default: 15)
- `INITIAL_SUPERUSER_EMAIL`: Initial admin user email
- `INITIAL_SUPERUSER_PASSWORD`: Initial admin user password

## Port Allocation

Make sure each instance uses different ports to avoid conflicts:

| Instance | Frontend Port | Backend Port |
|----------|---------------|--------------|
| Production | 8888 | 8880 |
| Staging | 8889 | 8881 |
| Development | 8890 | 8882 |

## Data Isolation

Each instance has its own:
- PostgreSQL database with isolated data
- Media files volume for uploaded images
- Container namespace (no container name conflicts)

Volume names are prefixed with the `COMPOSE_PROJECT_NAME`:
- `totetrack-prod_postgres_data`
- `totetrack-staging_postgres_data` 
- `totetrack-dev_postgres_data`

## Accessing Instances

Once running, you can access your instances at:
- **Production**: http://localhost:8888 (frontend), http://localhost:8880 (API)
- **Staging**: http://localhost:8889 (frontend), http://localhost:8881 (API)
- **Development**: http://localhost:8890 (frontend), http://localhost:8882 (API)

## Troubleshooting

### Port Conflicts
If you get port binding errors, check that no other services are using the configured ports:
```bash
netstat -tlnp | grep :8888
```

### Container Name Conflicts
If you get container name conflicts, ensure each environment file has a unique `COMPOSE_PROJECT_NAME`.

### Database Connection Issues
Check that each instance's database is healthy:
```bash
# Check production database
docker-compose exec db pg_isready -U app

# Check staging database  
docker-compose --env-file .env.staging exec db pg_isready -U app
```

### Cleanup
To completely remove an instance including its data:
```bash
# Stop and remove containers, networks, and volumes
docker-compose --env-file .env.staging down -v

# Remove any orphaned containers
docker-compose --env-file .env.staging down --remove-orphans
```

## Advanced Usage

### Custom Environment Files
Create your own environment files for specific use cases:
```bash
# Create custom environment
cp .env.example .env.custom
# Edit .env.custom with your settings
docker-compose --env-file .env.custom up -d
```

### Shared Configurations
You can create a base configuration and override specific values:
```bash
# Use production as base, override specific settings
docker-compose --env-file .env --env-file .env.override up -d
```