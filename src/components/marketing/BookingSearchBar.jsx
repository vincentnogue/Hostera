import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Globe2 } from 'lucide-react';

// A worldwide destination search — Hostera's marketplace has no artificial
// geographic restriction, so a guest in Canada searching a hotel in Japan
// works the same as searching one two blocks away. Submitting takes the
// visitor to /marketplace with the query pre-filled.
export default function BookingSearchBar({ className = '' }) {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    if (guests) params.set('guests', String(guests));
    navigate(`/marketplace${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`bg-white rounded-2xl md:rounded-full shadow-xl border border-brand-border p-2.5 flex flex-col md:flex-row items-stretch gap-2 ${className}`}
    >
      <label className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 rounded-full hover:bg-brand-bg transition-colors">
        <MapPin className="w-4 h-4 text-brand-navy shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-slate-light">Destination</span>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Anywhere in the world"
            className="w-full text-sm font-medium text-brand-ink outline-none placeholder:text-brand-slate-light bg-transparent"
          />
        </div>
      </label>

      <div className="hidden md:block w-px bg-brand-border my-1.5" />

      <label className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 rounded-full hover:bg-brand-bg transition-colors">
        <Calendar className="w-4 h-4 text-brand-navy shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-slate-light">Check-in</span>
          <input
            type="date"
            min={todayStr}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full text-sm font-medium text-brand-ink outline-none bg-transparent"
          />
        </div>
      </label>

      <div className="hidden md:block w-px bg-brand-border my-1.5" />

      <label className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 rounded-full hover:bg-brand-bg transition-colors">
        <Calendar className="w-4 h-4 text-brand-navy shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-slate-light">Check-out</span>
          <input
            type="date"
            min={checkIn || todayStr}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full text-sm font-medium text-brand-ink outline-none bg-transparent"
          />
        </div>
      </label>

      <div className="hidden md:block w-px bg-brand-border my-1.5" />

      <label className="flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 rounded-full hover:bg-brand-bg transition-colors">
        <Users className="w-4 h-4 text-brand-navy shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-slate-light">Guests</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-14 text-sm font-medium text-brand-ink outline-none bg-transparent"
          />
        </div>
      </label>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 rounded-full bg-brand-navy text-white text-sm font-bold hover:bg-brand-blue transition-colors shrink-0"
      >
        <Search className="w-4 h-4" /> Search hotels
      </button>
    </form>
  );
}

export function BookingSearchWorldwideNote({ className = '' }) {
  return (
    <p className={`flex items-center gap-1.5 text-[13px] text-brand-slate ${className}`}>
      <Globe2 className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
      Bookable worldwide — search any city, any property, in real time.
    </p>
  );
}
