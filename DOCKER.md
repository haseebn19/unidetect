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

Access the app at `http://localhost:3000/unidetect/`

## Production

Run production build:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Access the app at `http://localhost:3000/unidetect/`

## Running Tests

Run tests in the Docker container:

```bash
docker-compose exec app npm test
```

Run tests once (no watch mode):

```bash
docker-compose exec app npx vitest run
```

Run tests with coverage:

```bash
docker-compose exec app npm run test:coverage
```

## What's included

- **Development**: Vite dev server with hot reloading on port 3000
- **Production**: Optimized build served by Nginx on port 3000
- **Testing**: Vitest test runner with full test suite
