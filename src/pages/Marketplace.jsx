import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin, Users, Search, Loader2, Globe2, BedDouble, ArrowRight, Building2
} from 'lucide-react';
import { fetchMarketplaceListings, REGIONS } from '@/lib/marketplace';
import { HOTEL_PHOTOS } from '@/lib/hotelMedia';

const NAVY = '#123B63';

// Deterministic fallback photo per listing (until every property has its
// own uploaded photo) — keeps the grid visually premium instead of blank.
function photoFor(listing, i) {
  return listing.property.cover_photo_url || HOTEL_PHOTOS[i % HOTEL_PHOTOS.length].src;
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('All');

  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkin') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);

  useEffect(() => {
    fetchMarketplaceListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = destination.trim().toLowerCase();
    return listings.filter(l => {
      if (region !== 'All' && l.region !== region) return false;
      if (!q) return true;
      const haystack = [l.property.name, l.property.city, l.property.country].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [listings, destination, region]);

  const regionCounts = useMemo(() => {
    const counts = { All: listings.length };
    for (const r of REGIONS) counts[r] = listings.filter(l => l.region === r).length;
    return counts;
  }, [listings]);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    if (guests) params.set('guests', String(guests));
    setSearchParams(params);
  };

  const bookingUrl = (propertyId) => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    if (guests) params.set('guests', String(guests));
    return `/book/${propertyId}${params.toString() ? `?${params}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Search header */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-4 h-4" style={{ color: NAVY }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Hostera Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: NAVY }}>
            Search hotels, worldwide
          </h1>
          <p className="text-sm text-brand-slate mt-1 mb-6">
            Every property below is real inventory, live from Hostera hotels — book direct, no middleman.
          </p>

          <form onSubmit={submit} className="bg-brand-bg rounded-2xl p-2.5 flex flex-col md:flex-row gap-2">
            <label className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-xl border border-brand-border">
              <MapPin className="w-4 h-4 text-brand-navy shrink-0" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, country or hotel name"
                className="w-full text-sm outline-none bg-transparent"
              />
            </label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
              className="px-3.5 py-2.5 bg-white rounded-xl border border-brand-border text-sm outline-none" />
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
              className="px-3.5 py-2.5 bg-white rounded-xl border border-brand-border text-sm outline-none" />
            <label className="flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl border border-brand-border">
              <Users className="w-4 h-4 text-brand-navy shrink-0" />
              <input type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))}
                className="w-12 text-sm outline-none bg-transparent" />
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-bold hover:bg-brand-blue transition-colors">
              <Search className="w-4 h-4" /> Search
            </button>
          </form>

          {/* Region tabs */}
          <div className="flex flex-wrap gap-2 mt-5">
            {['All', ...REGIONS].map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  region === r
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-brand-slate border-brand-border hover:border-brand-navy'
                }`}
              >
                {r} {regionCounts[r] ? <span className="opacity-60">({regionCounts[r]})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Building2 className="w-10 h-10 text-brand-border mx-auto mb-3" />
            <p className="text-sm font-semibold text-brand-ink">No properties match yet</p>
            <p className="text-sm text-brand-slate mt-1 max-w-sm mx-auto">
              As hotels self-register and list their rooms on Hostera, they appear here automatically — try a different destination or check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l, i) => (
              <Link
                key={l.property.id}
                to={bookingUrl(l.property.id)}
                className="group bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-xl hover:border-brand-blue/40 transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden bg-brand-overlay relative">
                  <img
                    src={photoFor(l, i)}
                    alt={l.property.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide" style={{ color: NAVY }}>
                    {l.region}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-brand-ink truncate">{l.property.name}</h3>
                  <p className="text-xs text-brand-slate flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {[l.property.city, l.property.country].filter(Boolean).join(', ') || 'Location on request'}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border">
                    <span className="text-[11px] text-brand-slate flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5" /> {l.roomTypes.length} room type{l.roomTypes.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-bold flex items-center gap-1" style={{ color: NAVY }}>
                      {l.fromPrice
                        ? new Intl.NumberFormat(undefined, { style: 'currency', currency: l.currency, maximumFractionDigits: 0 }).format(l.fromPrice)
                        : 'Inquire'}
                      {l.fromPrice && <span className="text-[10px] font-normal text-brand-slate">/night</span>}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 flex items-center justify-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-navy">
          Back to Hostera <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
