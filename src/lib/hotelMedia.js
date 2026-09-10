// Centralized registry of the real hotel photo/video assets used across the
// marketing site (hero background + mockup slideshow) and the Auth /
// Onboarding pages. Keeping this in one place makes it trivial to add more
// properties later — every consumer just maps over these arrays.

// Landscape videos — rotated as the Hero section background (see
// HeroBackgroundVideo). Kept to 4 for a noticeable but not distracting
// cross-fade cycle.
export const HERO_VIDEOS = [
  { src: '/videos/hero-1.mp4', poster: '/videos/hero-1-poster.jpg' },
  { src: '/videos/hero-2.mp4', poster: '/videos/hero-2-poster.jpg' },
  { src: '/videos/hero-3.mp4', poster: '/videos/hero-3-poster.jpg' },
  { src: '/videos/hero-4.mp4', poster: '/videos/hero-4-poster.jpg' },
];

// Portrait videos — rotated on the Auth (Login/Register/Forgot/Reset) side
// panel and echoed on the Onboarding preview panel.
export const AUTH_VIDEOS = [
  { src: '/videos/auth-vertical.mp4', poster: '/videos/auth-vertical-poster.jpg' },
  { src: '/videos/auth-2.mp4', poster: '/videos/auth-2-poster.jpg' },
];

// Real luxury hotel photography — used in the Hero "mockup" slideshow card
// (HeroMedia), as trust thumbnails on Auth/Onboarding, and as marketplace
// preview imagery on the Landing page.
export const HOTEL_PHOTOS = [
  { src: '/images/hotels/hotel-01-oceanview-suite.jpg', caption: 'Oceanview suite — Lima', city: 'Lima', country: 'Peru', region: 'Americas' },
  { src: '/images/hotels/hotel-02-maldives-overwater.jpg', caption: 'Overwater villas — Maldives', city: 'Malé', country: 'Maldives', region: 'Asia-Pacific' },
  { src: '/images/hotels/hotel-03-grand-entrance.jpg', caption: 'Grand entrance — flagship property', city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  { src: '/images/hotels/hotel-04-modern-facade.jpg', caption: 'Radisson-style facade — India', city: 'Amritsar', country: 'India', region: 'Asia-Pacific' },
  { src: '/images/hotels/hotel-05-coastal-tower.jpg', caption: 'Coastal resort tower — Asia', city: 'Sanya', country: 'China', region: 'Asia-Pacific' },
  { src: '/images/hotels/hotel-06-garden-villa.jpg', caption: 'Garden villas — Dubai', city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { src: '/images/hotels/hotel-07-lakeside-palace.jpg', caption: 'Lakeside palace — Lucerne', city: 'Lucerne', country: 'Switzerland', region: 'Europe' },
  { src: '/images/hotels/hotel-08-cliffside-pool.jpg', caption: 'Cliffside infinity pool — Algarve', city: 'Algarve', country: 'Portugal', region: 'Europe' },
  { src: '/images/hotels/hotel-09-grand-lobby.jpg', caption: 'Marble lobby — flagship property', city: 'Doha', country: 'Qatar', region: 'Middle East' },
  { src: '/images/hotels/hotel-10-iconic-tower.jpg', caption: 'Iconic tower — Dubai', city: 'Dubai', country: 'UAE', region: 'Middle East' },
];
