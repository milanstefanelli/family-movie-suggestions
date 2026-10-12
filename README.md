# family-movie-suggestions

Holiday movie recommendations for the family, hosted on GitHub Pages and edited in a Google Sheet.

- **Homepage:** carousels of Milan's, Camryn's and Aryanna's favorite movies of the year (up to 10 each). Tap a poster to flip it and read why they loved it, or a standout quote.
- **Personal pages:** each family member's QR code opens `https://milanstefanelli.github.io/family-movie-suggestions/<slug>`, with a note from all of us and up to 5 picks.

No build step, no dependencies: plain HTML, vanilla JS and Tailwind via CDN.

## How data flows

1. The site reads the Google Sheet **live** on every page load, so edits show up within about a minute.
2. A GitHub Action copies the sheet into `data/*.csv` every 15 minutes. If Google is slow or unreachable, the site uses those copies instead, and git keeps a history of every change.

## One-time setup

1. **Create the sheet.** In Google Sheets, create a new spreadsheet. For each file in `data/`, add a tab with **exactly** the file's name (`Settings`, `Curators`, `Favorites`, `People`, `Picks`) and use **File → Import → Upload → Replace current sheet** to load that CSV into it.
2. **Share it.** Click **Share → General access → Anyone with the link → Viewer**. Invite family members as **Editors** if they should edit too. Anyone with the link can read the sheet, just like the website.
3. **Connect the site.** Copy the sheet ID, the long string in the sheet URL between `/d/` and `/edit`:
   - Paste it into `SHEET_ID` in `config.js`, then commit and push.
   - In GitHub, go to **Settings → Secrets and variables → Actions → Variables → New repository variable**, name it `SHEET_ID` and paste the same value.
4. **Test the sync.** In GitHub, go to **Actions → Sync data from Google Sheet → Run workflow**.

## Editing the sheet

Comma-separate lists inside a cell (e.g. `Netflix, Rent on Prime`). Rows are sorted by `order`. Blank rows are ignored.

| Tab | Columns | Notes |
| --- | --- | --- |
| `Settings` | `key`, `value` | Keys: `homeTitle`, `homeIntro`, `favoritesYear` (shown as "Milan's 2026 Favorites"), `familySignature` |
| `Curators` | `id`, `name`, `themeColor`, `order` | One row per homepage carousel. `id` is what you put in `Favorites.curator` |
| `Favorites` | `curator`, `order`, `title`, `year`, `posterUrl`, `streaming`, `backType`, `backText`, `quoteBy` | Up to 10 per curator |
| `People` | `slug`, `name`, `themeColor`, `message` | `slug` is the URL path: lowercase letters, numbers and dashes. Line breaks in `message` are kept |
| `Picks` | `slug`, `order`, `title`, `year`, `posterUrl`, `streaming`, `backType`, `backText`, `quoteBy` | Up to 5 per person |

- **backType**: `why` (shows `backText` as "Why we loved it") or `quote` (shows `backText` as a quote, with `quoteBy` as the speaker).
- **themeColor**: `indigo`, `blue`, `sky`, `teal`, `emerald`, `green`, `amber`, `red`, `rose`, `violet` (anything else uses indigo).
- **posterUrl**: on [themoviedb.org](https://www.themoviedb.org), open the movie, click the poster, then right-click the image and copy its address. Swap the size segment for `w500` (e.g. `https://image.tmdb.org/t/p/w500/abc123.jpg`). Leave it blank for a placeholder showing the title.
- Google guesses each column's type. To avoid surprises, keep `year` and `order` as plain numbers, or select those columns and choose **Format → Number → Plain text**.
- Don't rename tabs or header cells. If a tab can't be found, the site falls back to the CSV copy and the Action stops with an error naming the tab.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell and flip-card styles |
| `app.js` | Loads the sheet (or `data/*.csv`), routing, rendering |
| `config.js` | Sheet ID and settings |
| `data/*.csv` | Backup copy of each sheet tab, kept up to date by the Action. Also the import templates |
| `404.html` | Sends deep links like `/camryn` back to `index.html` |
| `.github/workflows/sync-sheet.yml` | Copies the sheet into `data/` every 15 minutes |

## Previewing locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` for the homepage, or `http://localhost:8000/?u=camryn` for a personal page.

## Publishing

1. Push to `main`.
2. In GitHub, go to **Settings → Pages → Deploy from a branch** and choose `main` / `(root)`.
3. Print QR codes pointing to `https://milanstefanelli.github.io/family-movie-suggestions/<slug>`, and test each one on a phone first.

GitHub pauses scheduled Actions after 60 days without repository activity. If the backup stops updating, re-enable it from the Actions tab. The live sheet keeps working either way.

## Moving to a custom domain later

1. In `404.html`, set `pathSegmentsToKeep = 0`.
2. In `config.js`, set `BASE: '/'`.
3. Add a `CNAME` file containing your domain and configure it under **Settings → Pages**.
