# Docker Setup

Run UniDetect using Docker containers.

## Prerequisites

- Docker Desktop

## Development

Run with hot reloading:

```bash
docker-compose up --build
```

Stop:
```bash
docker-compose down
```

## Production

Run production build:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

## What's included

- **Development**: React dev server with hot reloading on port 3000
- **Production**: Optimized build served by Nginx on port 3000