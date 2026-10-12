# family-movie-suggestions

Personalized Christmas movie recommendations, hosted on GitHub Pages. Each family member scans a QR code on their holiday card and lands on their own page, e.g.:

```
https://milanstefanelli.github.io/family-movie-suggestions/camryn
```

No build step, no dependencies: plain HTML, vanilla JS and Tailwind via CDN.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page template, routing and rendering |
| `data.js` | Everyone's movies and reviews — the only file you normally edit |
| `404.html` | Sends deep links like `/camryn` back to `index.html` |

## Adding a person

Add an entry to `familyData` in `data.js`. The key is the URL slug (lowercase letters, numbers, dashes):

```js
"dante-matt": {
  name: "Dante & Matt",
  greeting: "Merry Christmas, you two!",
  themeColor: "emerald",
  movies: [
    {
      title: "The Holdovers",
      year: "2023",
      posterUrl: "https://image.tmdb.org/t/p/w500/....jpg",
      streaming: ["Peacock"],
      review: "Perfect snowed-in movie."
    }
  ]
},
```

- **themeColor**: `indigo`, `blue`, `sky`, `teal`, `emerald`, `green`, `amber`, `red`, `rose`, `violet` (anything else falls back to indigo).
- **posterUrl**: on [themoviedb.org](https://www.themoviedb.org), open the movie, click the poster, then right-click the image and copy its address. Swap the size segment for `w500` (e.g. `https://image.tmdb.org/t/p/w500/abc123.jpg`). Leave `""` to show a placeholder.
- An empty `movies` list shows a "being wrapped up" message.

## Previewing locally

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/?u=camryn`. (`?u=<slug>` also works on the live site.)

## Publishing

1. Push to `main`.
2. In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. Wait a minute, then visit `https://milanstefanelli.github.io/family-movie-suggestions/<slug>`.

## QR codes

Generate one per person pointing to `https://milanstefanelli.github.io/family-movie-suggestions/<slug>`. Test each one on a phone before printing.

## Moving to a custom domain later

1. In `404.html`, set `pathSegmentsToKeep = 0`.
2. In `index.html`, set `BASE = '/'`.
3. Add a `CNAME` file containing your domain and configure it under **Settings → Pages**.
