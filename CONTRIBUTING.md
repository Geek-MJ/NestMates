# Contributing

Fork the repository and create a branch from `main` for the change you want to make.

Before opening a pull request, run the checks that apply to the files you touched:

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd server
npm run lint
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/nestmates-test npm test
```

The server tests need a local MongoDB and will clear the database named in `MONGODB_URI_TEST`.

Do not commit `server/.env`, `frontend/.env`, API keys, or database dumps. `server/.env.example` and `frontend/.env.example` should keep placeholders only.

Open the pull request against `main` and describe what changed and how you checked it.
