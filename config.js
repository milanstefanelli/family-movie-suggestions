// Site configuration.
const CONFIG = {
  // Google Sheet ID: the long string in the sheet URL between /d/ and /edit.
  // Leave empty to use only the copies in data/*.csv.
  SHEET_ID: '1V5tXJUZkHirt8zc5O0_LEMaidLiMOrsioUi7pr2ewuA',

  // Repo subpath on GitHub Pages. Change to '/' if you move to a custom domain.
  BASE: '/family-movie-suggestions/',

  // How long to wait for Google before falling back to data/*.csv.
  LIVE_TIMEOUT_MS: 4000,

  // Maximum cards shown per carousel / per person.
  MAX_FAVORITES: 10,
  MAX_PICKS: 5
};
