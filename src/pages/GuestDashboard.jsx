const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Image } from "@/components/ui/image";
import { computeUnavailableDates } from "@/components/AvailabilityCalendar";
import { fetchPublicAvailability } from "@/lib/availability";
import { useToast } from "@/components/ui/use-toast";
import { Building2, CalendarDays, LogOut, MapPin, Search, Star, X, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2000&auto=format&fit=crop";
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a960c26752e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae40dc85?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f3?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200&auto=format&fit=crop",
];

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-700",
  checked_in: "bg-blue-100 text-blue-700",
  checked_out: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
  pending: "bg-amber-100 text-amber-700",
};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function StarInput({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-brand-slate">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button type="button" key={n} onClick={() => onChange(n)}>
            <Star className={`w-5 h-5 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GuestDashboard() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stays, setStays] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewingStay, setReviewingStay] = useState(null);
  const [reviewRatings, setReviewRatings] = useState({ cleanliness: 0, location: 0, service: 0, value: 0 });
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [bookingProperty, setBookingProperty] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ room_type_id: "", check_in: addDays(7), check_out: addDays(9), adults: 2, children: 0, special_requests: "" });

  useEffect(() => {
    Promise.all([
      db.auth.me().catch(() => null),
      db.entities.Property.list().catch(() => []),
      db.entities.RoomType.list().catch(() => []),
      db.entities.Room.list().catch(() => []),
      db.entities.Reservation.list().catch(() => []),
      db.entities.CertifiedReview.list().catch(() => []),
      db.entities.Invoice.list().catch(() => []),
    ])
      .then(([user, props, types, allRooms, reservations, reviews, invoiceData]) => {
        setMe(user);
        setProperties(props || []);
        setRoomTypes(types || []);
        setRooms(allRooms || []);
        // RLS already restricts this query to reservations where
        // guest_id is this user's own auth id (see the
        // "guests can access their own reservations" policy) — no
        // further client-side filtering needed. The previous filter
        // checked created_by_id, a field bookings here never actually
        // set (they set guest_id), so this list was always empty.
        setStays(reservations || []);
        setMyReviews(reviews || []);
        setInvoices(invoiceData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProperties = properties.filter(p => {
    if (!destination.trim()) return true;
    const q = destination.trim().toLowerCase();
    return [p.name, p.city, p.country].some(v => (v || "").toLowerCase().includes(q));
  });

  const typesFor = (propertyId) => roomTypes.filter(t => t.property_id === propertyId);
  const propertyById = (id) => properties.find(p => p.id === id);
  const typeById = (id) => roomTypes.find(t => t.id === id);

  const nights = () => {
    const ms = new Date(form.check_out) - new Date(form.check_in);
    return Math.max(1, Math.round(ms / 86400000));
  };
  const selectedType = typeById(form.room_type_id);
  const estimatedTotal = selectedType ? (selectedType.base_price || 0) * nights() : 0;

  const openBooking = (property) => {
    const types = typesFor(property.id);
    setForm({ room_type_id: types[0]?.id || "", check_in: addDays(7), check_out: addDays(9), adults: 2, children: 0, special_requests: "" });
    setBookingProperty(property);
  };

  const confirmBooking = async () => {
    if (!selectedType || !me) return;
    setSaving(true);
    try {
      // Revalidate immediately before creating the reservation, against a
      // fresh fetch — not the possibly-stale state loaded when the guest
      // opened this page — same real check as the public booking page.
      const freshAvailability = await fetchPublicAvailability(bookingProperty.id);
      const unavailable = computeUnavailableDates(
        selectedType.id, rooms, freshAvailability,
        new Date(form.check_in), new Date(form.check_out)
      );
      if (unavailable.size > 0) {
        setSaving(false);
        toast({ title: 'Sold out for these dates', description: 'This room type just sold out for one or more selected nights — please choose different dates or another room type.', variant: 'destructive' });
        return;
      }

      const created = await db.entities.Reservation.create({
        property_id: bookingProperty.id,
        organization_id: bookingProperty.organization_id,
        guest_id: me.id,
        room_type_id: selectedType.id,
        check_in: form.check_in,
        check_out: form.check_out,
        adults: Number(form.adults),
        children: Number(form.children),
        source: "direct",
        status: "confirmed",
        total_amount: estimatedTotal,
        currency: selectedType.currency || bookingProperty.currency || "USD",
        special_requests: form.special_requests,
      });
      setStays(prev => [created, ...prev]);
      setBookingProperty(null);
      toast({ title: 'Booking confirmed', description: `${bookingProperty.name} — ${form.check_in} to ${form.check_out}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not complete your booking', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openReview = (stay) => {
    setReviewingStay(stay);
    setReviewRatings({ cleanliness: 0, location: 0, service: 0, value: 0 });
    setReviewComment('');
  };

  const submitReview = async () => {
    const { cleanliness, location, service, value } = reviewRatings;
    if (!cleanliness || !location || !service || !value) {
      toast({ title: 'Please rate all four categories', variant: 'destructive' });
      return;
    }
    setSubmittingReview(true);
    try {
      const overall = (cleanliness + location + service + value) / 4;
      const created = await db.entities.CertifiedReview.create({
        reservation_id: reviewingStay.id,
        property_id: reviewingStay.property_id,
        organization_id: reviewingStay.organization_id,
        guest_name: me?.full_name || me?.email || '',
        rating_cleanliness: cleanliness,
        rating_location: location,
        rating_service: service,
        rating_value: value,
        overall_rating: overall,
        comment: reviewComment.trim(),
        status: 'published',
      });
      setMyReviews(prev => [...prev, created]);
      setReviewingStay(null);
      toast({ title: 'Thanks for your review!', description: 'It\u2019s now live on the property\u2019s listing, marked as a verified stay.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not submit review', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-brand-border px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-brand-ink">HOSTERA</p>
            <p className="text-[9px] text-brand-slate-light uppercase tracking-widest">Guest</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#my-stays" className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-brand-navy hover:underline">My stays</a>
          <span className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-medium">
            {(me?.email || "G").charAt(0).toUpperCase()}
          </span>
          <button onClick={() => db.auth.logout()} className="p-2 text-brand-slate hover:text-brand-navy" title="Log out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero + search */}
      <section className="relative h-[420px] overflow-hidden">
        <img src={HERO_IMG} alt="Luxury resort" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-overlay/90 via-brand-overlay/40 to-brand-overlay/20" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white">Where would you like to stay?</h1>
          <p className="text-white/70 mt-3">Search properties worldwide and book in seconds.</p>
          <div className="mt-8 bg-white rounded-full shadow-xl p-2 flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 w-full">
              <Search className="w-4 h-4 text-brand-slate shrink-0" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination, hotel or city…"
                className="w-full py-2 text-sm outline-none text-brand-ink placeholder:text-brand-slate-light"
              />
            </div>
            <a href="#explore" className="shrink-0 px-6 py-2.5 rounded-full bg-brand-navy text-white text-sm font-semibold hover:bg-brand-blue">
              Explore stays
            </a>
          </div>
        </div>
      </section>

      {/* Properties */}
      <section id="explore" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-brand-ink mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-blue" /> Available properties
        </h2>
        {loading ? (
          <p className="text-sm text-brand-slate">Loading properties…</p>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-brand-border p-10 text-center text-sm text-brand-slate">
            No properties match your search yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((p, i) => {
              const types = typesFor(p.id);
              const minPrice = types.length ? Math.min(...types.map(t => t.base_price || 0)) : null;
              const photo = (p.photos && p.photos[0]) || FALLBACK_PHOTOS[i % FALLBACK_PHOTOS.length];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-xl transition-shadow">
                  <Image src={photo} alt={p.name} className="w-full h-44 block rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-brand-ink">{p.name}</h3>
                      {p.star_rating ? (
                        <span className="flex items-center gap-1 text-xs text-brand-slate shrink-0">
                          <Star className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" /> {p.star_rating}
                        </span>
                      ) : null}
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-brand-slate mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {[p.city, p.country].filter(Boolean).join(", ") || "Worldwide"}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm font-semibold text-brand-navy">
                        {minPrice != null ? <>From {p.currency || "USD"} {minPrice}<span className="text-xs font-normal text-brand-slate"> /night</span></> : "Rates on request"}
                      </p>
                      <button onClick={() => openBooking(p)} className="px-5 py-2 rounded-full bg-brand-navy text-white text-xs font-semibold hover:bg-brand-blue">
                        Book now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My stays */}
      <section id="my-stays" className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold text-brand-ink mb-5 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-blue" /> My stays
        </h2>
        {stays.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-brand-border p-10 text-center">
            <p className="text-sm text-brand-slate mb-3">You have no bookings yet.</p>
            <a href="#explore" className="inline-block px-5 py-2 rounded-full bg-brand-navy text-white text-xs font-semibold">Find a stay</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stays.map(r => {
              const prop = propertyById(r.property_id);
              const type = typeById(r.room_type_id);
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-brand-border p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{prop?.name || "Your booking"}</p>
                    <p className="text-xs text-brand-slate mt-0.5">{type?.name || "Room"} · {r.adults} adult{r.adults > 1 ? "s" : ""}{r.children ? ` · ${r.children} child${r.children > 1 ? "ren" : ""}` : ""}</p>
                    <p className="text-xs text-brand-slate mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> {r.check_in} → {r.check_out}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[r.status] || "bg-gray-100 text-gray-500"}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <p className="text-sm font-bold text-brand-navy mt-2">{r.currency} {r.total_amount}</p>
                    {(() => {
                      const inv = invoices.find(i => i.reservation_id === r.id);
                      return inv ? (
                        <p className="text-[10px] text-brand-slate mt-1">Invoice {inv.invoice_number} · {inv.status}</p>
                      ) : null;
                    })()}
                    {r.status === 'checked_out' && !myReviews.some(rv => rv.reservation_id === r.id) && (
                      <button onClick={() => openReview(r)} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-navy hover:underline">
                        <ShieldCheck className="w-3 h-3" /> Leave a review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review modal */}
      {reviewingStay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReviewingStay(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-ink flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> Leave a certified review</h3>
              <button onClick={() => setReviewingStay(null)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-brand-slate">{propertyById(reviewingStay.property_id)?.name} · {reviewingStay.check_in} → {reviewingStay.check_out}</p>
            <StarInput label="Cleanliness" value={reviewRatings.cleanliness} onChange={v => setReviewRatings({ ...reviewRatings, cleanliness: v })} />
            <StarInput label="Location" value={reviewRatings.location} onChange={v => setReviewRatings({ ...reviewRatings, location: v })} />
            <StarInput label="Service" value={reviewRatings.service} onChange={v => setReviewRatings({ ...reviewRatings, service: v })} />
            <StarInput label="Value for money" value={reviewRatings.value} onChange={v => setReviewRatings({ ...reviewRatings, value: v })} />
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Tell future guests about your stay…"
              className="w-full px-3.5 py-2 border border-brand-border rounded-xl text-sm outline-none focus:border-brand-navy resize-none" />
            <button onClick={submitReview} disabled={submittingReview} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              {submittingReview ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </div>
      )}

      {/* Booking modal */}
      {bookingProperty && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setBookingProperty(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-ink">Book {bookingProperty.name}</h3>
                <p className="text-xs text-brand-slate">{[bookingProperty.city, bookingProperty.country].filter(Boolean).join(", ")}</p>
              </div>
              <button onClick={() => setBookingProperty(null)} className="p-1.5 text-brand-slate hover:text-brand-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1">Room type</label>
                <select value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })} className={inputCls}>
                  {typesFor(bookingProperty.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.currency || "USD"} {t.base_price}/night</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-slate block mb-1">Check-in</label>
                  <input type="date" min={today()} value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-slate block mb-1">Check-out</label>
                  <input type="date" min={form.check_in} value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-slate block mb-1">Adults</label>
                  <input type="number" min={1} max={6} value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-slate block mb-1">Children</label>
                  <input type="number" min={0} max={6} value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1">Special requests (optional)</label>
                <input placeholder="Late arrival, high floor…" value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className={inputCls} />
              </div>
              {selectedType && (
                <div className="bg-brand-bg rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-brand-slate">{nights()} night{nights() > 1 ? "s" : ""} × {selectedType.currency || "USD"} {selectedType.base_price}</span>
                  <span className="font-bold text-brand-navy">{selectedType.currency || "USD"} {estimatedTotal}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={confirmBooking}
                  disabled={!form.room_type_id || !me || saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {saving ? "Booking…" : "Confirm booking"}
                </button>
                <button onClick={() => setBookingProperty(null)} className="flex-1 py-2.5 border border-brand-border text-sm font-medium rounded-full text-brand-slate">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}