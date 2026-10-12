// Holiday Movie Hub: loads data from the Google Sheet (or data/*.csv) and renders the page.

// Use BASE when served from GitHub Pages, '/' when previewing locally.
const base = window.location.pathname.startsWith(CONFIG.BASE) ? CONFIG.BASE : '/';

// GitHub Pages SPA redirect handling: 404.html sends /camryn to /?p=/camryn.
(function () {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) {
        const q = params.get('q');
        const cleanPath = base + p.replace(/^\//, '') + (q ? '?' + q : '');
        window.history.replaceState(null, '', cleanPath + window.location.hash);
    }
})();

// Sheet tabs and the column each one must have (used to detect a missing or misnamed tab).
const TABS = {
    Settings: 'key',
    Curators: 'id',
    Favorites: 'curator',
    People: 'slug',
    Picks: 'slug'
};

// Accent classes per themeColor. Full class strings so Tailwind can generate them.
const THEMES = {
    indigo:  { badge: 'bg-indigo-950 text-indigo-300 border-indigo-800/60',    heading: 'text-indigo-300',  back: 'bg-indigo-950 border-indigo-700/60',   quote: 'text-indigo-400',  pill: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',    glow: 'from-indigo-500/20',  note: 'border-indigo-500/80' },
    blue:    { badge: 'bg-blue-950 text-blue-300 border-blue-800/60',          heading: 'text-blue-300',    back: 'bg-blue-950 border-blue-700/60',       quote: 'text-blue-400',    pill: 'bg-blue-950/80 text-blue-300 border-blue-800/50',          glow: 'from-blue-500/20',    note: 'border-blue-500/80' },
    sky:     { badge: 'bg-sky-950 text-sky-300 border-sky-800/60',             heading: 'text-sky-300',     back: 'bg-sky-950 border-sky-700/60',         quote: 'text-sky-400',     pill: 'bg-sky-950/80 text-sky-300 border-sky-800/50',             glow: 'from-sky-500/20',     note: 'border-sky-500/80' },
    teal:    { badge: 'bg-teal-950 text-teal-300 border-teal-800/60',          heading: 'text-teal-300',    back: 'bg-teal-950 border-teal-700/60',       quote: 'text-teal-400',    pill: 'bg-teal-950/80 text-teal-300 border-teal-800/50',          glow: 'from-teal-500/20',    note: 'border-teal-500/80' },
    emerald: { badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/60', heading: 'text-emerald-300', back: 'bg-emerald-950 border-emerald-700/60', quote: 'text-emerald-400', pill: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50', glow: 'from-emerald-500/20', note: 'border-emerald-500/80' },
    green:   { badge: 'bg-green-950 text-green-300 border-green-800/60',       heading: 'text-green-300',   back: 'bg-green-950 border-green-700/60',     quote: 'text-green-400',   pill: 'bg-green-950/80 text-green-300 border-green-800/50',       glow: 'from-green-500/20',   note: 'border-green-500/80' },
    amber:   { badge: 'bg-amber-950 text-amber-300 border-amber-800/60',       heading: 'text-amber-300',   back: 'bg-amber-950 border-amber-700/60',     quote: 'text-amber-400',   pill: 'bg-amber-950/80 text-amber-300 border-amber-800/50',       glow: 'from-amber-500/20',   note: 'border-amber-500/80' },
    red:     { badge: 'bg-red-950 text-red-300 border-red-800/60',             heading: 'text-red-300',     back: 'bg-red-950 border-red-700/60',         quote: 'text-red-400',     pill: 'bg-red-950/80 text-red-300 border-red-800/50',             glow: 'from-red-500/20',     note: 'border-red-500/80' },
    rose:    { badge: 'bg-rose-950 text-rose-300 border-rose-800/60',          heading: 'text-rose-300',    back: 'bg-rose-950 border-rose-700/60',       quote: 'text-rose-400',    pill: 'bg-rose-950/80 text-rose-300 border-rose-800/50',          glow: 'from-rose-500/20',    note: 'border-rose-500/80' },
    violet:  { badge: 'bg-violet-950 text-violet-300 border-violet-800/60',    heading: 'text-violet-300',  back: 'bg-violet-950 border-violet-700/60',   quote: 'text-violet-400',  pill: 'bg-violet-950/80 text-violet-300 border-violet-800/50',    glow: 'from-violet-500/20',  note: 'border-violet-500/80' }
};

function themeFor(color) {
    return THEMES[String(color || '').trim().toLowerCase()] || THEMES.indigo;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------- Data loading ----------

// Parses CSV text into an array of rows (arrays of strings). Handles quoted commas, "" and newlines.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    text = text.replace(/^﻿/, '');

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); rows.push(row);
            row = []; field = '';
        } else {
            field += c;
        }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

// Fetches one tab and returns it as objects keyed by lowercase header.
async function fetchTab(tab, url, signal) {
    const res = await fetch(url, { cache: 'no-store', signal });
    if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);

    const [header = [], ...body] = parseCsv(await res.text());
    const keys = header.map(h => h.trim().toLowerCase());
    if (!keys.includes(TABS[tab].toLowerCase())) {
        throw new Error(`${tab}: missing "${TABS[tab]}" column (is the tab named exactly "${tab}"?)`);
    }

    return body
        .filter(r => r.some(v => v.trim()))
        .map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

function liveUrl(tab) {
    return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CONFIG.SHEET_ID)}` +
        `/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
}

// Loads every tab live from the sheet, falling back to data/<Tab>.csv per tab.
async function loadData() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.LIVE_TIMEOUT_MS);

    const entries = await Promise.all(Object.keys(TABS).map(async tab => {
        if (CONFIG.SHEET_ID) {
            try {
                return [tab, await fetchTab(tab, liveUrl(tab), controller.signal)];
            } catch (err) {
                console.warn(`Live sheet unavailable, using backup for ${tab}.`, err);
            }
        }
        try {
            return [tab, await fetchTab(tab, `${base}data/${tab}.csv`)];
        } catch (err) {
            console.error(`Could not load ${tab}.`, err);
            return [tab, []];
        }
    }));

    clearTimeout(timer);
    return Object.fromEntries(entries);
}

// ---------- Data shaping ----------

function byOrder(a, b) {
    return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function toMovie(row) {
    return {
        title: row.title,
        year: row.year,
        posterUrl: row.posterurl,
        genres: (row.genres || '').split(',').map(s => s.trim()).filter(Boolean),
        backType: (row.backtype || 'why').toLowerCase() === 'quote' ? 'quote' : 'why',
        backText: row.backtext,
        quoteBy: row.quoteby
    };
}

// Movies for one curator or person, sorted and capped.
function moviesFor(rows, key, value, max, label) {
    const matches = rows
        .filter(r => r.title && (r[key] || '').toLowerCase() === value)
        .sort(byOrder);
    if (matches.length > max) {
        console.warn(`${label} has ${matches.length} movies; only the first ${max} are shown.`);
    }
    return matches.slice(0, max).map(toMovie);
}

function settingsFrom(rows) {
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
        homeTitle: settings.homeTitle || 'Holiday Movie Hub',
        homeIntro: settings.homeIntro || '',
        favoritesYear: settings.favoritesYear || '',
        familySignature: settings.familySignature || ''
    };
}

// ---------- Rendering ----------

function renderFlipCard(movie, theme, sizeClass) {
    const back = movie.backType === 'quote'
        ? `
            <span class="text-5xl leading-none font-black ${theme.quote}" aria-hidden="true">“</span>
            <p class="text-slate-100 text-base italic leading-relaxed -mt-2">${escapeHtml(movie.backText)}</p>
            ${movie.quoteBy ? `<p class="mt-3 text-sm font-semibold ${theme.heading}">— ${escapeHtml(movie.quoteBy)}</p>` : ''}
        `
        : `
            <p class="text-xs font-bold uppercase tracking-widest ${theme.heading} mb-2">Why we loved it</p>
            <p class="text-slate-100 text-sm leading-relaxed">${escapeHtml(movie.backText)}</p>
        `;

    return `
        <div class="flip-card ${sizeClass} shrink-0 snap-start cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
             role="button" tabindex="0" aria-pressed="false" data-flip
             aria-label="${escapeHtml(movie.title)}. Flip to read the note.">
            <div class="flip-inner">
                <div class="flip-face flip-front rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
                    ${movie.posterUrl ? `
                        <img src="${escapeHtml(movie.posterUrl)}" alt="" loading="lazy"
                             onerror="this.hidden=true; this.nextElementSibling.hidden=false;"
                             class="w-full aspect-[2/3] object-cover bg-slate-950">
                    ` : ''}
                    <div class="w-full aspect-[2/3] bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center gap-3 p-4 text-center"
                         ${movie.posterUrl ? 'hidden' : ''}>
                        <span class="text-4xl" aria-hidden="true">🎬</span>
                        <span class="text-slate-300 font-bold leading-tight">${escapeHtml(movie.title)}</span>
                    </div>
                    <div class="p-3">
                        <h3 class="text-white font-bold leading-snug">
                            ${escapeHtml(movie.title)}
                            ${movie.year ? `<span class="font-normal text-slate-400 text-sm">(${escapeHtml(movie.year)})</span>` : ''}
                        </h3>
                        ${movie.genres.length ? `
                            <div class="mt-2 flex flex-wrap gap-1.5">
                                ${movie.genres.map(s => `
                                    <span class="px-2 py-0.5 border rounded-full text-[0.68rem] font-semibold ${theme.pill}">${escapeHtml(s)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="flip-face flip-back rounded-2xl border p-5 flex flex-col overflow-y-auto ${theme.back}">
                    <div class="flex-grow">${back}</div>
                    <p class="mt-4 text-[0.68rem] uppercase tracking-widest text-slate-400">Tap to flip back</p>
                </div>
            </div>
        </div>
    `;
}

function renderCarousel(id, title, theme, movies) {
    if (!movies.length) return '';
    return `
        <section class="mb-14" aria-labelledby="${id}-title">
            <div class="flex items-end justify-between gap-4 mb-4">
                <h2 id="${id}-title" class="font-festive text-3xl md:text-4xl font-bold ${theme.heading}">
                    <span aria-hidden="true">⭐</span> ${escapeHtml(title)}
                </h2>
                <div class="hidden md:flex gap-2">
                    <button type="button" data-scroll="-1" data-target="${id}" aria-label="Scroll left"
                            class="w-10 h-10 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition">←</button>
                    <button type="button" data-scroll="1" data-target="${id}" aria-label="Scroll right"
                            class="w-10 h-10 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition">→</button>
                </div>
            </div>
            <div id="${id}" class="carousel flex items-start gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 pb-4">
                ${movies.map(m => renderFlipCard(m, theme, 'w-40 md:w-48')).join('')}
            </div>
        </section>
    `;
}

function renderHome(data) {
    const settings = settingsFrom(data.Settings);
    document.title = `${settings.homeTitle} 🎬🎄`;

    const carousels = data.Curators
        .filter(c => c.id)
        .sort(byOrder)
        .map(c => {
            const id = c.id.toLowerCase();
            const name = c.name || c.id;
            const title = `${name}'s ${settings.favoritesYear ? settings.favoritesYear + ' ' : ''}Favorites`;
            const movies = moviesFor(data.Favorites, 'curator', id, CONFIG.MAX_FAVORITES, name);
            return renderCarousel(`carousel-${id}`, title, themeFor(c.themecolor), movies);
        })
        .join('');

    return `
        <header class="text-center mb-14">
            <div class="text-5xl mb-3" aria-hidden="true">🎄</div>
            <h1 class="font-festive text-5xl md:text-7xl font-bold text-white drop-shadow-[0_0_25px_rgba(250,204,21,0.25)]">${escapeHtml(settings.homeTitle)}</h1>
            <div class="candy-cane mx-auto mt-5" aria-hidden="true"></div>
            ${settings.homeIntro ? `
                <p class="text-slate-400 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">${escapeHtml(settings.homeIntro)}</p>
            ` : ''}
        </header>
        ${carousels}
        <p class="text-center text-slate-500 text-sm mt-4">
            Got a holiday card from us? Scan its QR code to open your personal watchlist 🎁
        </p>
    `;
}

function renderPerson(person, data) {
    const settings = settingsFrom(data.Settings);
    const theme = themeFor(person.themecolor);
    const name = person.name || person.slug;
    const picks = moviesFor(data.Picks, 'slug', person.slug.toLowerCase(), CONFIG.MAX_PICKS, name);
    document.title = `${name}'s Holiday Watchlist 🎬🎄`;

    const picksHtml = picks.length
        ? `
            <div class="flex flex-wrap justify-center items-start gap-4 md:gap-5">
                ${picks.map(m => renderFlipCard(m, theme, 'w-40 md:w-44')).join('')}
            </div>
            <p class="text-center text-slate-500 text-sm mt-6">Tap a poster to read why we picked it.</p>
        `
        : `
            <div class="text-center py-20 px-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <p class="text-slate-400 text-lg">Your recommendations are being wrapped up! Check back soon 🎁</p>
            </div>
        `;

    return `
        <nav class="mb-8">
            <a href="${base}" class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/70 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white transition">
                <span aria-hidden="true">←</span> All our favorites
            </a>
        </nav>
        <header class="relative text-center mb-10">
            <div class="absolute inset-x-0 -top-12 h-48 bg-gradient-to-b ${theme.glow} to-transparent blur-3xl -z-10" aria-hidden="true"></div>
            <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border shadow-inner mb-4 ${theme.badge}">
                🎄 Holiday Watchlist
            </span>
            <h1 class="font-festive text-5xl md:text-7xl font-bold text-white">For ${escapeHtml(name)}</h1>
            <div class="candy-cane mx-auto mt-5" aria-hidden="true"></div>
        </header>
        ${person.message ? `
            <section class="relative max-w-2xl mx-auto mb-12 bg-slate-900/80 border border-slate-800 border-l-4 ${theme.note} rounded-2xl p-6 md:p-8">
                <span class="absolute -top-4 -right-3 text-4xl rotate-12" aria-hidden="true">🎀</span>
                <p class="text-xs font-bold uppercase tracking-widest ${theme.heading} mb-3">A note from all of us</p>
                <p class="text-slate-200 text-lg leading-relaxed whitespace-pre-line">${escapeHtml(person.message)}</p>
                ${settings.familySignature ? `
                    <p class="mt-4 text-slate-400 italic">${escapeHtml(settings.familySignature)}</p>
                ` : ''}
            </section>
        ` : ''}
        <section aria-label="Movie picks">
            ${picksHtml}
        </section>
    `;
}

// ---------- Interaction ----------

function toggleFlip(card) {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
}

function bindEvents(root) {
    root.addEventListener('click', e => {
        const scrollBtn = e.target.closest('[data-scroll]');
        if (scrollBtn) {
            const track = document.getElementById(scrollBtn.dataset.target);
            const card = track && track.querySelector('.flip-card');
            const step = card ? card.offsetWidth + 16 : 200;
            track.scrollBy({ left: Number(scrollBtn.dataset.scroll) * step * 2, behavior: 'smooth' });
            return;
        }
        const card = e.target.closest('[data-flip]');
        if (card) toggleFlip(card);
    });

    root.addEventListener('keydown', e => {
        const card = e.target.closest('[data-flip]');
        if (card && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleFlip(card);
        }
    });
}

// ---------- Decorations ----------

// Falling snow behind the content. Skipped when the viewer prefers reduced motion.
function startSnow() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.getElementById('snow');
    const count = window.innerWidth < 768 ? 30 : 60;
    let html = '';
    for (let i = 0; i < count; i++) {
        const size = 2 + Math.random() * 4;
        html += `<span class="snowflake" style="left:${Math.random() * 100}%;` +
            `width:${size}px;height:${size}px;opacity:${0.3 + Math.random() * 0.6};` +
            `animation-duration:${10 + Math.random() * 12}s;animation-delay:-${Math.random() * 22}s"></span>`;
    }
    layer.innerHTML = html;
}

// A string of twinkling lights across the top of the page.
function hangLights() {
    const strand = document.getElementById('lights');
    const count = Math.ceil(window.innerWidth / 48);
    strand.innerHTML = Array.from({ length: count }, () => '<span class="bulb"></span>').join('');
}

// ---------- Start ----------

(async function () {
    const app = document.getElementById('app');
    bindEvents(app);
    hangLights();
    startSnow();

    // Slug comes from the path (/family-movie-suggestions/camryn) or ?u=camryn.
    const slug = (
        new URLSearchParams(window.location.search).get('u') ||
        decodeURIComponent(window.location.pathname.slice(base.length))
    ).replace(/^\/+|\/+$/g, '').toLowerCase();

    const data = await loadData();
    const person = slug && data.People.find(p => (p.slug || '').toLowerCase() === slug);

    app.innerHTML = person ? renderPerson(person, data) : renderHome(data);
})();
