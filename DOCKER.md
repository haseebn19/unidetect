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

## Running Tests

Run tests in the Docker container:

```bash
docker-compose exec app npm test
```

To run specific tests:

```bash
docker-compose exec app npm test -- --testNamePattern=TextProcessor
```

## What's included

- **Development**: React dev server with hot reloading on port 3000
- **Production**: Optimized build served by Nginx on port 3000
- **Testing**: Jest test runner with full test suite