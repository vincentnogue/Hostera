// Shared marketplace data layer — turns raw Property + RoomType rows into
// bookable "listings". Used by both the Landing page preview section and
// the full /marketplace search page so the two never drift apart.
//
// Visibility rule: a room type is on the marketplace unless a hotel has
// explicitly opted it out (`marketplace_visible === false`). This matches
// the "list your rooms and they're bookable right away" self-service flow —
// hotels can still hide specific room types from RoomTypes settings.
const db = globalThis.__B44_DB__ || { entities: new Proxy({}, { get: () => ({ list: async () => [] }) }) };

const REGION_BY_COUNTRY = {
  'united states': 'Americas', usa: 'Americas', us: 'Americas', canada: 'Americas',
  mexico: 'Americas', brazil: 'Americas', argentina: 'Americas', peru: 'Americas',
  chile: 'Americas', colombia: 'Americas',
  'united kingdom': 'Europe', uk: 'Europe', france: 'Europe', germany: 'Europe',
  italy: 'Europe', spain: 'Europe', portugal: 'Europe', switzerland: 'Europe',
  netherlands: 'Europe', greece: 'Europe', austria: 'Europe', turkey: 'Europe',
  uae: 'Middle East', 'united arab emirates': 'Middle East', qatar: 'Middle East',
  'saudi arabia': 'Middle East', oman: 'Middle East', bahrain: 'Middle East',
  japan: 'Asia-Pacific', china: 'Asia-Pacific', thailand: 'Asia-Pacific',
  singapore: 'Asia-Pacific', maldives: 'Asia-Pacific', india: 'Asia-Pacific',
  indonesia: 'Asia-Pacific', vietnam: 'Asia-Pacific', australia: 'Asia-Pacific',
  'south korea': 'Asia-Pacific',
  'south africa': 'Africa', morocco: 'Africa', egypt: 'Africa', kenya: 'Africa',
};

export const REGIONS = ['Americas', 'Europe', 'Middle East', 'Asia-Pacific', 'Africa', 'Worldwide'];

export function regionForCountry(country) {
  if (!country) return 'Worldwide';
  return REGION_BY_COUNTRY[country.trim().toLowerCase()] || 'Worldwide';
}

// Fetches every property that has at least one marketplace-visible,
// priced room type, regardless of which organization it belongs to —
// this is the cross-tenant, worldwide inventory a guest searches.
export async function fetchMarketplaceListings() {
  const [properties, roomTypes, bookingSettings] = await Promise.all([
    db.entities.Property.list().catch(() => []),
    db.entities.RoomType.list().catch(() => []),
    db.entities.BookingEngineSetting.list().catch(() => []),
  ]);

  const settingsByProperty = new Map((bookingSettings || []).map(s => [s.property_id, s]));

  const roomTypesByProperty = new Map();
  for (const rt of roomTypes || []) {
    if (rt.marketplace_visible === false) continue;
    if (!rt.property_id) continue;
    const list = roomTypesByProperty.get(rt.property_id) || [];
    list.push(rt);
    roomTypesByProperty.set(rt.property_id, list);
  }

  return (properties || [])
    .filter(p => settingsByProperty.get(p.id)?.direct_bookings_enabled !== false)
    .map(p => {
      const rts = roomTypesByProperty.get(p.id) || [];
      const prices = rts.map(rt => rt.base_price).filter(n => typeof n === 'number' && n > 0);
      return {
        property: p,
        roomTypes: rts,
        fromPrice: prices.length ? Math.min(...prices) : null,
        currency: p.currency || 'USD',
        region: regionForCountry(p.country),
      };
    })
    .filter(l => l.roomTypes.length > 0);
}
