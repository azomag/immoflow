# Deployment (Vercel + Render + Aiven MySQL)

## 0) Security first

You shared real DB credentials in chat. Rotate them in Aiven before production use.

## 1) Backend on Render

This repo includes:

- `render.yaml` (Blueprint config)
- `backend/scripts/render-start.sh` (boot script, writes SSL CA file, runs migrations, starts Laravel)

### Create the service

1. In Render Dashboard: **New > Blueprint** and connect this repository.
2. Render will detect `render.yaml` and create `immoflow-backend`.
3. Set/override environment variables in Render:

- `APP_URL=https://<your-backend>.onrender.com`
- `APP_KEY=<generate once>`
- `DB_CONNECTION=mysql`
- `DB_URL=mysql://avnadmin:<password>@immoflow-immoflow.g.aivencloud.com:14271/defaultdb?ssl-mode=REQUIRED`
- `DB_SSL_CA_CONTENT=<paste your Aiven CA cert block>`
  or `DB_SSL_CA_BASE64=<base64 of the cert>`
- `CORS_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app`

Optional explicit DB vars if you prefer not to use `DB_URL`:
`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

### Generate APP_KEY

Use a local command once and copy result to Render:

```bash
cd backend
php artisan key:generate --show
```

## 2) Frontend on Vercel

1. In Vercel: **Add New Project** and import this same repository.
2. Set **Root Directory** to `frontend`.
3. Add environment variables from `frontend/.env.vercel.example`:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend>.onrender.com`
- `NEXTAUTH_URL=https://<your-frontend>.vercel.app`
- `NEXTAUTH_SECRET=<long-random-secret>`
- Google vars only if you use Google login.

4. Deploy.

## 3) CORS and auth callbacks

After both are live:

1. Ensure Render `CORS_ALLOWED_ORIGINS` includes your exact Vercel domain.
2. Ensure Vercel `NEXTAUTH_URL` matches the same frontend domain.
3. If using Google OAuth, add both production callback URLs in Google Console:
   - `https://<your-frontend>.vercel.app/api/auth/callback/google`
   - `https://<your-frontend>.vercel.app/auth/complete`

## 4) Verify

Backend:

```bash
curl https://<your-backend>.onrender.com/api/ping
```

Frontend:

- Open `https://<your-frontend>.vercel.app`
- Test login/signup, dashboard data loading, property image upload.
