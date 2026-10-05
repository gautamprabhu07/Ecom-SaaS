//Path: packages/libs/analytics/geo.ts
//where to draw each country on the visitor map. Keys are the country names the IP lookup stores (what appears in
//shopAnalytics.countryStats); `atlas` is the name the same country has in the world-atlas map data, which is what the
//map uses to highlight it. Coordinates are [longitude, latitude] of a point near the middle of the country.
//Countries not listed here still appear in the "top countries" list; they just have no marker.

export interface CountryGeo {
  atlas: string;
  coordinates: [number, number];
}

export const COUNTRY_GEO: Record<string, CountryGeo> = {
  "United States": { atlas: "United States of America", coordinates: [-98, 39] },
  "Canada": { atlas: "Canada", coordinates: [-100, 58] },
  "Mexico": { atlas: "Mexico", coordinates: [-102, 23] },
  "Brazil": { atlas: "Brazil", coordinates: [-52, -11] },
  "Argentina": { atlas: "Argentina", coordinates: [-64, -34] },
  "Chile": { atlas: "Chile", coordinates: [-71, -33] },
  "Colombia": { atlas: "Colombia", coordinates: [-73, 4] },
  "Peru": { atlas: "Peru", coordinates: [-75, -10] },
  "United Kingdom": { atlas: "United Kingdom", coordinates: [-2, 54] },
  "Ireland": { atlas: "Ireland", coordinates: [-8, 53] },
  "France": { atlas: "France", coordinates: [2, 46] },
  "Germany": { atlas: "Germany", coordinates: [10, 51] },
  "Spain": { atlas: "Spain", coordinates: [-4, 40] },
  "Portugal": { atlas: "Portugal", coordinates: [-8, 39.5] },
  "Italy": { atlas: "Italy", coordinates: [12, 42.5] },
  "Netherlands": { atlas: "Netherlands", coordinates: [5.5, 52.2] },
  "Belgium": { atlas: "Belgium", coordinates: [4.5, 50.6] },
  "Switzerland": { atlas: "Switzerland", coordinates: [8, 46.8] },
  "Austria": { atlas: "Austria", coordinates: [14, 47.5] },
  "Sweden": { atlas: "Sweden", coordinates: [16, 62] },
  "Norway": { atlas: "Norway", coordinates: [9, 62] },
  "Denmark": { atlas: "Denmark", coordinates: [9.5, 56] },
  "Finland": { atlas: "Finland", coordinates: [26, 64] },
  "Poland": { atlas: "Poland", coordinates: [19, 52] },
  "Czechia": { atlas: "Czechia", coordinates: [15.5, 49.8] },
  "Russia": { atlas: "Russia", coordinates: [95, 61] },
  "Ukraine": { atlas: "Ukraine", coordinates: [32, 49] },
  "Turkey": { atlas: "Turkey", coordinates: [35, 39] },
  "Israel": { atlas: "Israel", coordinates: [35, 31] },
  "Saudi Arabia": { atlas: "Saudi Arabia", coordinates: [45, 24] },
  "United Arab Emirates": { atlas: "United Arab Emirates", coordinates: [54, 24] },
  "Egypt": { atlas: "Egypt", coordinates: [30, 27] },
  "South Africa": { atlas: "South Africa", coordinates: [25, -29] },
  "Nigeria": { atlas: "Nigeria", coordinates: [8, 9.5] },
  "Kenya": { atlas: "Kenya", coordinates: [38, 0.5] },
  "India": { atlas: "India", coordinates: [79, 22] },
  "Pakistan": { atlas: "Pakistan", coordinates: [70, 30] },
  "Bangladesh": { atlas: "Bangladesh", coordinates: [90, 24] },
  "Sri Lanka": { atlas: "Sri Lanka", coordinates: [80.7, 7.8] },
  "Nepal": { atlas: "Nepal", coordinates: [84, 28.3] },
  "China": { atlas: "China", coordinates: [103, 35] },
  "Japan": { atlas: "Japan", coordinates: [138, 36] },
  "South Korea": { atlas: "South Korea", coordinates: [128, 36] },
  "Indonesia": { atlas: "Indonesia", coordinates: [118, -2] },
  "Malaysia": { atlas: "Malaysia", coordinates: [102, 4] },
  "Singapore": { atlas: "Singapore", coordinates: [103.8, 1.35] },
  "Thailand": { atlas: "Thailand", coordinates: [101, 15] },
  "Vietnam": { atlas: "Vietnam", coordinates: [106, 16] },
  "Philippines": { atlas: "Philippines", coordinates: [122, 12.5] },
  "Australia": { atlas: "Australia", coordinates: [134, -25] },
  "New Zealand": { atlas: "New Zealand", coordinates: [172, -41] },
};
