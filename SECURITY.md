# Security

Do not commit secrets. That includes `server/.env`, `frontend/.env`, JWT secrets, MongoDB passwords, SMTP passwords and the Google Cloud Translation API key. The example env files are placeholders. A real key belongs only in a local or hosted environment, on the server.

Do not paste a credential into an issue, a pull request, or a chat message. If a secret was pushed, revoke it at the provider and replace it. Deleting the commit is not enough once the repository is public.

To report a security problem, contact the contributors listed in the README and describe the issue without including live credentials. If the GitHub repository has private security advisories enabled, use that instead of a public issue.
