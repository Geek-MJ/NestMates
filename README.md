# NestMates

NestMates is a bilingual household management application developed as a Software Engineering project at ESILV. It is for people who share a home. Expenses, a calendar, documents, tasks and chat live in the same application, with a French and English interface.

## Project Context

The project was written by the group ESILV-4-A4-PAR-ST-CDOF2, with Professor RIAHI Kenza. The course documents in this repository are `NestMates_BRD.docx`, `NestMates_SRS.docx` and `NestMates_SDD.docx`.

## Features

A person registers, logs in, and either creates a household or joins one with an invitation code. Members of that household share expenses, including a debt balance and settlements, a calendar, documents, and tasks. Chat is real-time. The interface can be switched between French and English.

A chat message stays in the language it was written in. If that language is French or English and it is not the reader's profile language, the message offers a translation of that same message. "See original" puts the original text back without another request. Translation is not applied when the message is sent, and it does not create a second message.

## Tech Stack

Frontend: React 19, Vite 8, React Router 7, Axios, react-i18next, Socket.IO Client 4, FullCalendar 6.1.21, CSS.

Backend: Node.js 22, Express 5, Mongoose 9, Socket.IO 4, JWT, bcrypt, Multer, Helmet, Nodemailer, `@google-cloud/translate`.

Database: MongoDB. Uploaded files are stored with GridFS.

External service: Google Cloud Translation API, called only from the server.

## Project Structure

```
frontend/                 React application
  src/pages/              auth, household, expenses, calendar, documents, tasks, chat
  src/i18n/locales/       en.json and fr.json
  src/api/                Axios client
  src/socket/             Socket.IO client
server/
  src/modules/            route, controller and service for each feature
  src/models/             Mongoose models
  src/realtime/           Socket.IO server
  src/services/           passwords, JWT, mail, translation
  src/seed/               development seed, not started with the server
  test/                   server tests
.github/workflows/ci.yml  lint, frontend build, server tests
```

## Getting Started

Install Git, Node.js 22.13 or newer (the repository `.nvmrc` is `22`), and MongoDB 7 or 8. A Google Cloud Translation API key is required only when someone translates a message, and when the development seed writes its chat. SMTP is required only for password-reset email.

```bash
git clone <repository-url>
cd NestMates
```

The frontend and the server each have their own `package.json`:

```bash
cd server
npm install
cd ../frontend
npm install
```

## Environment Configuration

```bash
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env
```

`server/.env` is required. `MONGODB_URI` and `JWT_SECRET` have to be set before the API will start. `JWT_SECRET` must be at least 32 characters:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

A local MongoDB database is enough. The development seed only accepts a database name that contains `dev` and does not contain `prod`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/nestmates-dev
FRONTEND_ORIGIN=http://localhost:5173
```

Put `GOOGLE_TRANSLATE_API_KEY` in `server/.env` only. The example file shows the placeholder `your_google_translation_api_key_here`. The frontend does not have this variable, and the API does not return it. If the key is missing, the server still starts and chat still stores messages. A translation request then responds that translation is unavailable.

`frontend/.env` can stay as copied for local development. Vite proxies `/api` and `/socket.io` to `DEV_API_TARGET`, which defaults to `http://localhost:3000`. Set `VITE_API_URL` only for a production build that calls an API on another origin.

SMTP is optional. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM` are used by the forgot-password route. When `SMTP_HOST` is empty, that route returns 503.

## Running the Application

Start MongoDB, then start the API:

```bash
cd server
npm run dev
```

`npm run dev` loads `server/.env` and listens on port 3000 unless `PORT` is set. `npm start` does not load `.env`; it expects the environment to be provided by the host.

In another terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. The API health check is http://localhost:3000/api/health.

## Development Data

Registration starts from an empty database. The seed is a separate command and is not run by `npm run dev` or `npm start`.

```bash
cd server
npm run seed:dev
```

The script sets `NODE_ENV=development` and refuses any database whose name does not look like a development database. It does not create accounts. It looks for exactly one household that already has two members, then adds sample expenses, calendar events, tasks, two small PDFs and a short French and English chat. `npm run seed:dev -- --remove` deletes only the records that seed wrote. Those records are local development data.

## Testing

The frontend has no test script. Server tests use Node's built-in runner and a disposable MongoDB database. The database name must contain `test`:

```bash
cd server
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/nestmates-test npm test
```

The same variable can be placed in `server/.env.test`. That file is ignored by Git. The tests clear the database named in `MONGODB_URI_TEST`.

## Build and Lint

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd server
npm run lint
npm test
```

`npm run build` writes `frontend/dist/`. That directory is gitignored. The server has no compile step.

`.github/workflows/ci.yml` runs the frontend lint and build, then the server lint and tests, on pushes to `main` and on pull requests. The server job starts a `mongo:8.0` container and sets `MONGODB_URI_TEST` itself. The workflow does not need repository secrets.

## Architecture

The React application calls the Express API with Axios. The JWT is kept in `localStorage` under `nestmates.token` and sent as a Bearer token. Household routes check membership on the server before reading or writing data.

Chat messages are sent with Socket.IO (`chat:send`). The socket handshake requires the same JWT, and the socket joins only the room of the user's current household. History is loaded with `GET /api/households/:id/messages`.

A translation is `POST /api/households/:id/messages/:messageId/translate` with `{ "targetLanguage": "en" }` or `"fr"`. The server calls Google Cloud Translation and can keep that result for the same message and the same target language. The original text is not replaced.

Documents are uploaded with Multer, checked as PDF, JPEG or PNG, and written to GridFS. The file bytes are returned only to a household member.

## Security

Passwords are hashed with bcrypt at cost 12. Access tokens are JWTs signed with HS256. `/api/auth` is rate limited. Helmet is enabled, and CORS allows only `FRONTEND_ORIGIN`. Socket.IO rejects a connection without a valid token. Document content requires household membership. Uploads are limited to 10 MB and to PDF, JPEG and PNG, including a check of the file header. Chat sending is limited to 10 messages per user per 10 seconds. The Google API key is read from the server environment.

## Contributors

Landzi123

ShayKrm

## Academic Context

ESILV Software Engineering project. Group ESILV-4-A4-PAR-ST-CDOF2. Professor RIAHI Kenza.

## License

This repository does not include a license file.
