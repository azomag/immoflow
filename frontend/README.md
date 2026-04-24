## ImmoFlow Frontend

This frontend uses Next.js, `next-auth`, and `shadcn`-style UI components for:

- landing page
- login and signup
- Google sign-in completion flow
- role-based dashboards for `super_admin`, `admin`, `agent`, and `locataire`
- Laravel-backed live data views and actions

## Environment

Create `frontend/.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
- `NEXTAUTH_URL=http://127.0.0.1:3000`
- `NEXTAUTH_SECRET=<random secret>`
- `GOOGLE_CLIENT_ID=<google oauth client id>`
- `GOOGLE_CLIENT_SECRET=<google oauth client secret>`

In Google Cloud Console, the OAuth redirect URI must include:

```text
http://127.0.0.1:3000/api/auth/callback/google
```

## Run

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

## Notes

- Google sign-in authenticates in Next.js first, then syncs the account into Laravel on `/auth/complete`.
- The dashboard permissions come from the Laravel API response, not hardcoded frontend-only role checks.
- Pending agent and admin accounts are redirected to `/pending` until approved.
