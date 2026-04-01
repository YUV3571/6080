# Assignment 3 Backend

## Getting Started

### Installation

Install dependencies:
```bash
npm install
```

## Available Scripts

### `npm run start`

Starts the development server using Nodemon with automatic reload on file changes.

```bash
npm run start
```

The server will run and automatically restart when you modify files. Changes to `database.json` are ignored to prevent unnecessary restarts.

**Default Port:** 5005

### `npm run reset`

Resets the database by running database initialization tests.

```bash
npm run reset
```

This command executes `test/database.test.js`, which sets up a fresh database with initial test data. Use this when you need to restore the database to a clean state.

### `npm run clear`

Deletes the `database.json` file completely.

```bash
npm run clear
```

This removes the database file entirely. The next time the application runs, a new database will be created.

## Other Scripts

### `npm run test`

Runs the main test suite:
```bash
npm run test
```

### `npm run lint`

Checks code quality and style:
```bash
npm run lint
```

## API Documentation

View the complete API documentation via Swagger UI:

```
http://localhost:5005
```

Once the server is running with `npm run start`, navigate to this URL to explore all available endpoints, request parameters, and response formats interactively.

