// Centralized registry of the real hotel photo/video assets used across the
// marketing site (hero background + mockup slideshow) and the Auth /
// Onboarding pages. Keeping this in one place makes it trivial to add more
// properties later — every consumer just maps over these arrays.

// Landscape videos — used as the rotating Hero section background.
export const HERO_VIDEOS = [
  { src: '/videos/hero-1.mp4', poster: '/videos/hero-1-poster.jpg' },
  { src: '/videos/hero-2.mp4', poster: '/videos/hero-2-poster.jpg' },
  { src: '/videos/hero-3.mp4', poster: '/videos/hero-3-poster.jpg' },
  { src: '/videos/auth-vertical.mp4', poster: '/videos/auth-vertical-poster.jpg' },
];

// Portrait video — used on the Auth (Login/Register/Forgot/Reset) side panel
// and echoed on the Onboarding preview panel.
export const AUTH_VIDEO = {
  src: '/videos/auth-vertical.mp4',
  poster: '/videos/auth-vertical-poster.jpg',
};

// Real luxury hotel photography — used in the Hero "mockup" slideshow card
// (HeroMedia) and as trust thumbnails on Auth/Onboarding.
export const HOTEL_PHOTOS = [
  { src: '/images/hotels/hotel-01-oceanview-suite.jpg', caption: 'Oceanview suite — Lima' },
  { src: '/images/hotels/hotel-02-maldives-overwater.jpg', caption: 'Overwater villas — Maldives' },
  { src: '/images/hotels/hotel-03-grand-entrance.jpg', caption: 'Grand entrance — flagship property' },
  { src: '/images/hotels/hotel-04-modern-facade.jpg', caption: 'Radisson-style facade — India' },
  { src: '/images/hotels/hotel-05-coastal-tower.jpg', caption: 'Coastal resort tower — Asia' },
  { src: '/images/hotels/hotel-06-garden-villa.jpg', caption: 'Garden villas — Dubai' },
  { src: '/images/hotels/hotel-07-lakeside-palace.jpg', caption: 'Lakeside palace — Lucerne' },
  { src: '/images/hotels/hotel-08-cliffside-pool.jpg', caption: 'Cliffside infinity pool — Algarve' },
  { src: '/images/hotels/hotel-09-grand-lobby.jpg', caption: 'Marble lobby — flagship property' },
  { src: '/images/hotels/hotel-10-iconic-tower.jpg', caption: 'Iconic tower — Dubai' },
];
