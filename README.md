# Wedding Seat Planner

A static React wedding table finder. Guests scan a QR code, search their name,
and see every matching table with the people seated there.

## Google Sheet Format

Publish a Google Sheet as CSV with these columns:

```csv
first_name,last_name,table
Parth,Patel,4
Parth,Patel,11
Sreelatha,Mundip,8
Aarav,Shah,4
Maya,Patel,4
```

The app reads `first_name`, `last_name`, and optional `table`.

## Local Setup

```bash
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if scripts are blocked:

```powershell
npm.cmd install
npm.cmd run dev
```

## Environment

Create `.env.local`:

```text
VITE_SEATING_CSV_URL=https://docs.google.com/spreadsheets/d/e/YOUR_PUBLISHED_CSV_URL/pub?output=csv
```

If the environment variable is missing, the app uses
`public/File_Guest_Name_Sample.csv`.

## Deploy To Cloudflare Pages

1. Push this project to GitHub.
2. In Cloudflare Pages, create a project connected to the GitHub repo.
3. Use these build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add `VITE_SEATING_CSV_URL` as a production environment variable.
5. Deploy, then point the wedding QR code to the Cloudflare Pages URL or custom
   domain.
