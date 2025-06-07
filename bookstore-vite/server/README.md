# BookStore Backend

A simple backend for the BookStore application using Express.js and SQLite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

The server will start on port 3000 and create a SQLite database file (`database.sqlite`) in the same directory.

## Features

- User authentication (login/register)
- Book management (list, add, update stock)
- SQLite database for persistent storage
- First registered user becomes admin automatically

## API Endpoints

- `GET /api/books` - Get all books
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/books` - Add new book (admin only)
- `PATCH /api/books/:id` - Update book stock (buy book)

## Database

The application uses SQLite with Sequelize ORM. The database file (`database.sqlite`) will be created automatically when you first run the server. Initial books will be added to the database if it's empty. 