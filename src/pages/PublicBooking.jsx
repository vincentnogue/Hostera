const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin, Users, BedDouble, Calendar, Phone, Mail, Check,
  ShieldCheck, Loader2, ChevronLeft, Building2
} from 'lucide-react';

export default function PublicBooking() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [guestInfo, setGuestInfo] = useState({ full_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [props, allRoomTypes, allSettings] = await Promise.all([
          db.entities.Property.list(),
          db.entities.RoomType.list(),
          db.entities.BookingEngineSetting.list(),
        ]);
        const prop = (props || []).find(p => p.id === propertyId);
        if (!prop) {
          setNotFound(true);
          return;
        }
        setProperty(prop);
        setRoomTypes((allRoomTypes || []).filter(rt => rt.property_id === propertyId));
        setSettings((allSettings || []).find(s => s.property_id === propertyId) || {
          direct_bookings_enabled: true,
          show_availability: true,
          show_rates_publicly: true,
          require_deposit: false,
          deposit_percent: 20,
          min_stay_default: 1,
          allow_same_day_booking: true,
          advance_booking_days: 365,
          cancellation_hours: 48,
        });
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyId]);

  const currency = property?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
    : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const minCheckIn = settings?.allow_same_day_booking === false
    ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
    : todayStr;
  const maxCheckIn = settings?.advance_booking_days
    ? new Date(Date.now() + settings.advance_booking_days * 86400000).toISOString().split('T')[0]
    : undefined;

  const canSubmit = checkIn && checkOut && nights >= (settings?.min_stay_default || 1)
    && selectedRoomType && guestInfo.full_name && guestInfo.email;

  const submitBooking = async (e) => {
    e.preventDefault();
    setFormError('');
    if (nights < (settings?.min_stay_default || 1)) {
      setFormError(`This property requires a minimum stay of ${settings.min_stay_default} night(s).`);
      return;
    }
    setSubmitting(true);
    try {
      const total = (selectedRoomType.base_price || 0) * nights;
      const reservation = await db.entities.Reservation.create({
        property_id: propertyId,
        room_type_id: selectedRoomType.id,
        guest_name: guestInfo.full_name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        reservation_number: `RES-${Date.now()}`,
        source: 'website',
        status: settings?.require_deposit ? 'pending' : 'confirmed',
        currency,
        total_amount: total,
        paid_amount: 0,
      });
      setConfirmed(reservation);
    } catch (e) {
      console.error(e);
      setFormError('Something went wrong submitting your booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-brand-bg px-6 text-center">
        <Building2 className="w-10 h-10 text-brand-slate-light" />
        <h1 className="text-lg font-semibold text-brand-ink">Property not found</h1>
        <p className="text-sm text-brand-slate">This booking link may be out of date or the property is no longer listed.</p>
      </div>
    );
  }

  if (settings && settings.direct_bookings_enabled === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-brand-bg px-6 text-center">
        <Building2 className="w-10 h-10 text-brand-navy" />
        <h1 className="text-lg font-semibold text-brand-ink">{property.name}</h1>
        <p className="text-sm text-brand-slate max-w-sm">
          Online booking isn&apos;t available for this property right now. Please contact them directly to book your stay.
        </p>
        <div className="flex flex-col gap-1.5 mt-2 text-sm text-brand-slate">
          {property.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4" />{property.phone}</span>}
          {property.email && <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{property.email}</span>}
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-bg px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-brand-ink">Booking {settings?.require_deposit ? 'received' : 'confirmed'}</h1>
        <p className="text-sm text-brand-slate max-w-sm">
          Confirmation <span className="font-semibold text-brand-ink">{confirmed.reservation_number}</span> for {property.name}.
          {settings?.require_deposit && ` A deposit of ${settings.deposit_percent}% will be requested by the property to secure your stay.`}
          {' '}A confirmation has been sent to {guestInfo.email}.
        </p>
        <div className="text-sm text-brand-slate bg-white border border-brand-border rounded-xl px-5 py-3 mt-2">
          {checkIn} → {checkOut} · {nights} night{nights > 1 ? 's' : ''} · {fmt(confirmed.total_amount)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-ink">{property.name}</h1>
          <p className="text-sm text-brand-slate flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4" />
            {[property.city, property.country].filter(Boolean).join(', ')}
          </p>
        </div>

        <form onSubmit={submitBooking} className="space-y-6">
          {/* Dates & occupancy */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-brand-slate flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Check-in</label>
              <input type="date" required min={minCheckIn} max={maxCheckIn} value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-slate flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Check-out</label>
              <input type="date" required min={checkIn || minCheckIn} value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-slate flex items-center gap-1"><Users className="w-3.5 h-3.5" />Adults</label>
              <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-slate flex items-center gap-1"><Users className="w-3.5 h-3.5" />Children</label>
              <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            </div>
            {nights > 0 && (
              <p className="col-span-2 md:col-span-4 text-xs text-brand-slate">
                {nights} night{nights > 1 ? 's' : ''}
                {settings?.min_stay_default > 1 && ` · ${settings.min_stay_default}-night minimum stay`}
              </p>
            )}
          </div>

          {/* Room types */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-ink">Choose a room</h2>
            {roomTypes.length === 0 && (
              <p className="text-sm text-brand-slate">No room types are published for this property yet.</p>
            )}
            {roomTypes.map(rt => (
              <button
                type="button"
                key={rt.id}
                onClick={() => setSelectedRoomType(rt)}
                className={`w-full text-left bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 transition ${
                  selectedRoomType?.id === rt.id ? 'border-brand-navy ring-1 ring-brand-navy' : 'border-brand-border hover:border-brand-slate-light'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
                    <BedDouble className="w-5 h-5 text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{rt.name}</p>
                    {rt.description && <p className="text-xs text-brand-slate mt-0.5 max-w-md">{rt.description}</p>}
                    <p className="text-xs text-brand-slate-light mt-1">
                      Up to {rt.capacity} guests{rt.size_sqm ? ` · ${rt.size_sqm} m²` : ''}{rt.bed_type ? ` · ${rt.bed_type}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {settings?.show_rates_publicly === false ? (
                    <span className="text-xs text-brand-slate">Contact for rate</span>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-brand-ink">{fmt(rt.base_price)}</p>
                      <p className="text-[11px] text-brand-slate">/ night</p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Guest details */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-brand-ink">Your details</h2>
            <input required placeholder="Full name" value={guestInfo.full_name}
              onChange={e => setGuestInfo(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="email" placeholder="Email" value={guestInfo.email}
                onChange={e => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
              <input placeholder="Phone" value={guestInfo.phone}
                onChange={e => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          {selectedRoomType && nights > 0 && (
            <div className="bg-brand-navy rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70">{nights} night{nights > 1 ? 's' : ''} · {selectedRoomType.name}</p>
                <p className="text-lg font-bold">{fmt((selectedRoomType.base_price || 0) * nights)}</p>
                {settings?.require_deposit && (
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {settings.deposit_percent}% deposit required to confirm
                  </p>
                )}
              </div>
              <button type="submit" disabled={!canSubmit || submitting}
                className="px-5 py-2.5 rounded-full bg-white text-brand-navy text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Booking…' : 'Book now'}
              </button>
            </div>
          )}
        </form>

        <a href={`/`} className="inline-flex items-center gap-1 text-xs text-brand-slate mt-6 hover:text-brand-navy">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Hostera
        </a>
      </div>
    </div>
  );
}
