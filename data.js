/*
 * Family movie recommendations.
 *
 * Each key is the URL slug: lowercase letters, numbers and dashes only (e.g. "camryn", "dante-matt").
 * The page lives at https://milanstefanelli.github.io/family-movie-suggestions/<slug>
 *
 * Person fields:
 *   name        Shown as "For <name>"
 *   greeting    Short message under the name
 *   themeColor  Accent color: indigo, blue, sky, teal, emerald, green, amber, red, rose, violet
 *   movies      List of movies (an empty list shows a "coming soon" message)
 *
 * Movie fields:
 *   title       Movie title
 *   year        Release year, as text
 *   posterUrl   Image URL (TMDB "w500" works well); leave "" for a placeholder
 *   streaming   Where to watch, e.g. ["Netflix", "Rent on Prime"]
 *   review      Your personal note
 */
const familyData = {
  "camryn": {
    name: "Camryn",
    greeting: "Merry Christmas! Here are some handpicked movie recommendations just for you.",
    themeColor: "indigo",
    movies: [
      {
        title: "Knives Out",
        year: "2019",
        posterUrl: "",
        streaming: ["Netflix", "Rent on Prime"],
        review: "I know how much you love a good whodunit! This one has such a great cozy winter vibe and quick wit."
      }
    ]
  },
  "papa": {
    name: "Papa",
    greeting: "Merry Christmas, Papa! Grab some popcorn and check out these flicks.",
    themeColor: "blue",
    movies: []
  }
};
