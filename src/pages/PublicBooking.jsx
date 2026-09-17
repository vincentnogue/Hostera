const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AvailabilityCalendar, { computeUnavailableDates } from '@/components/AvailabilityCalendar';
import { calculateStayTax } from '@/lib/tax';
import { fetchPublicAvailability } from '@/lib/availability';
import {
  MapPin, Users, BedDouble, Calendar, Phone, Mail, Check,
  ShieldCheck, Loader2, ChevronLeft, Building2, LifeBuoy, Send, CheckCircle2,
  Compass, Star, HelpCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import StripePaymentForm from '@/components/booking/StripePaymentForm';

export default function PublicBooking() {
  const { toast } = useToast();
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkIn, setCheckIn] = useState(searchParams.get('checkin') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || '');
  const [adults, setAdults] = useState(Number(searchParams.get('guests')) || 2);
  const [children, setChildren] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [guestInfo, setGuestInfo] = useState({ full_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null); // { reservation, clientSecret } once a connected hotel requires card payment
  const [formError, setFormError] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);

  const [certifiedReviews, setCertifiedReviews] = useState([]);
  const [hotelQuestions, setHotelQuestions] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState([]);
  const [askName, setAskName] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askSent, setAskSent] = useState(false);
  const [askSending, setAskSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [props, allRoomTypes, allSettings, allRooms, allReviews, allQuestions, allExperiences] = await Promise.all([
          db.entities.Property.list(),
          db.entities.RoomType.list(),
          db.entities.BookingEngineSetting.list(),
          db.entities.Room.list(),
          db.entities.CertifiedReview.list().catch(() => []),
          db.entities.HotelQuestion.list().catch(() => []),
          db.entities.Experience.list().catch(() => []),
        ]);
        const prop = (props || []).find(p => p.id === propertyId);
        if (!prop) {
          setNotFound(true);
          return;
        }
        setProperty(prop);
        setRoomTypes((allRoomTypes || []).filter(rt => rt.property_id === propertyId));
        setRooms((allRooms || []).filter(r => r.property_id === propertyId));
        setCertifiedReviews((allReviews || []).filter(r => r.property_id === propertyId));
        setHotelQuestions((allQuestions || []).filter(q => q.property_id === propertyId));
        setExperiences((allExperiences || []).filter(x => x.property_id === propertyId && x.status === 'active'));
        const availability = await fetchPublicAvailability(propertyId).catch(() => []);
        setReservations(availability);
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

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;
    setAskSending(true);
    try {
      await db.entities.HotelQuestion.create({
        property_id: property.id,
        organization_id: property.organization_id,
        guest_name: askName.trim() || 'A traveler',
        question: askQuestion.trim(),
        status: 'pending',
      });
      setAskSent(true);
      setAskQuestion('');
    } catch (e) {
      console.error(e);
    } finally {
      setAskSending(false);
    }
  };

  // Creates one ExperienceBooking per selected add-on once the room
  // reservation itself is confirmed — best-effort, never blocks the room
  // booking if an experience request happens to fail.
  const bookSelectedExperiences = async (reservation) => {
    for (const expId of selectedExperienceIds) {
      const exp = experiences.find(x => x.id === expId);
      if (!exp) continue;
      const participants = (reservation.adults || 1) + (reservation.children || 0);
      const total = Number(exp.price) * participants;
      try {
        await db.entities.ExperienceBooking.create({
          experience_id: exp.id,
          property_id: property.id,
          organization_id: property.organization_id,
          guest_name: reservation.guest_name,
          guest_email: reservation.guest_email,
          participants,
          scheduled_date: reservation.check_in,
          total_amount: total,
          commission_amount: total * ((Number(exp.commission_rate) || 0) / 100),
          status: 'requested',
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const submitSupportRequest = async (e) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setSendingSupport(true);
    try {
      await db.entities.SupportTicket.create({
        subject: 'Question from booking page',
        description: supportMsg.trim(),
        priority: 'medium',
        status: 'open',
        source: 'guest',
        requester_email: supportEmail.trim(),
        property_id: property?.id,
        organization_id: property?.organization_id,
      });
      db.entities.Notification.create({
        organization_id: property?.organization_id,
        title: 'New guest question',
        message: `From ${supportEmail.trim()}: ${supportMsg.trim().slice(0, 120)}`,
        type: 'support',
        read: false,
      }).catch(() => {});
      setSupportSent(true);
      setSupportMsg('');
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not send your message', description: 'Please try again or contact the property directly.', variant: 'destructive' });
    }
    finally { setSendingSupport(false); }
  };

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
      // Revalidate availability immediately before creating the
      // reservation, against a fresh fetch (not the state loaded when the
      // page opened) — this is what actually prevents overselling a room
      // type between when the guest started browsing and when they submit.
      const freshAvailability = await fetchPublicAvailability(propertyId);
      const unavailable = computeUnavailableDates(
        selectedRoomType.id, rooms, freshAvailability,
        new Date(checkIn), new Date(checkOut)
      );
      if (unavailable.size > 0) {
        setFormError('Sorry — this room type just sold out for one or more of your selected nights. Please choose different dates or another room type.');
        setSubmitting(false);
        return;
      }

      const subtotal = (selectedRoomType.base_price || 0) * nights;
      const { total } = calculateStayTax({ subtotal, nights, property });

      // Split-payment path: only when this property has completed Stripe
      // Connect onboarding (property.stripe_account_id, set from
      // PropertySettings.jsx's Stripe panel). Properties that haven't
      // connected Stripe keep the original "book now, pay at hotel" flow
      // below unchanged — this is additive, not a behavior change for them.
      if (property?.stripe_account_id) {
        const reservation = await db.entities.Reservation.create({
          property_id: propertyId,
          organization_id: property?.organization_id,
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
          status: 'pending_payment',
          currency,
          total_amount: total,
          paid_amount: 0,
          payment_status: 'pending',
        });

        const intentResp = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency,
            connected_account_id: property.stripe_account_id,
            booking_reference: reservation.id,
          }),
        });
        const intentData = await intentResp.json();
        if (!intentResp.ok || !intentData.client_secret) {
          setFormError(intentData.message || 'Could not start payment. Please try again.');
          setSubmitting(false);
          return;
        }
        setPaymentStep({ reservation, clientSecret: intentData.client_secret });
        setSubmitting(false);
        return;
      }

      const reservation = await db.entities.Reservation.create({
        property_id: propertyId,
        organization_id: property?.organization_id,
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
      // Real, automatic notification for staff — a guest just booked
      // while nobody may have been watching. Best-effort: a notification
      // failure should never block the guest's confirmation.
      db.entities.Notification.create({
        organization_id: property?.organization_id,
        title: 'New online booking',
        message: `${guestInfo.full_name} booked ${selectedRoomType.name} for ${checkIn} → ${checkOut}.`,
        type: 'reservation',
        read: false,
      }).catch(() => {});
      await bookSelectedExperiences(reservation);
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

  if (paymentStep) {
    const handlePaySuccess = async (paymentIntentId) => {
      try {
        await db.entities.Reservation.update(paymentStep.reservation.id, {
          status: 'confirmed',
          payment_status: 'paid',
          paid_amount: paymentStep.reservation.total_amount,
          payment_intent_id: paymentIntentId,
        });
      } catch (e) {
        console.error(e);
        // The Stripe webhook (functions/api/stripe-webhook.js) is the
        // durable source of truth and will mark this paid independently
        // even if this optimistic client-side update fails.
      }
      db.entities.Notification.create({
        organization_id: property?.organization_id,
        title: 'New online booking',
        message: `${guestInfo.full_name} booked ${selectedRoomType.name} for ${checkIn} → ${checkOut}.`,
        type: 'reservation',
        read: false,
      }).catch(() => {});
      await bookSelectedExperiences(paymentStep.reservation);
      setConfirmed(paymentStep.reservation);
      setPaymentStep(null);
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-bg px-6">
        <div className="w-full max-w-sm bg-white border border-brand-border rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-bold text-brand-ink text-center">Secure card payment</h1>
          <p className="text-xs text-brand-slate text-center">
            {property.name} · {checkIn} → {checkOut} · {fmt(paymentStep.reservation.total_amount)}
          </p>
          <StripePaymentForm
            clientSecret={paymentStep.clientSecret}
            onSuccess={handlePaySuccess}
            payLabel={`Pay ${fmt(paymentStep.reservation.total_amount)} & confirm`}
          />
          <button type="button" onClick={() => setPaymentStep(null)} className="w-full text-xs text-brand-slate hover:text-brand-ink">
            Cancel and go back
          </button>
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

  const coverPhoto = property.photo_urls?.[0];

  return (
    <div className="min-h-screen bg-brand-bg">
      {coverPhoto ? (
        <div className="relative h-56 md:h-72 w-full overflow-hidden">
          <img src={coverPhoto} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 pb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{property.name}</h1>
            <p className="text-sm text-white/90 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4" />
              {[property.city, property.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 pt-10">
          <h1 className="text-2xl font-bold text-brand-ink">{property.name}</h1>
          <p className="text-sm text-brand-slate flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4" />
            {[property.city, property.country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {property.photo_urls?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-8 -mt-2">
            {property.photo_urls.slice(1).map(url => (
              <img key={url} src={url} alt="" className="w-32 h-24 rounded-xl object-cover shrink-0" loading="lazy" />
            ))}
          </div>
        )}

        <form onSubmit={submitBooking} className="space-y-6">
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
                className={`w-full text-left bg-white border rounded-2xl p-4 flex flex-col gap-3 transition ${
                  selectedRoomType?.id === rt.id ? 'border-brand-navy ring-1 ring-brand-navy' : 'border-brand-border hover:border-brand-slate-light'
                }`}
              >
                {(rt.photo_urls || []).length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
                    {rt.photo_urls.map(url => (
                      <img key={url} src={url} alt={rt.name} className="w-24 h-16 rounded-lg object-cover shrink-0" loading="lazy" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
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
                </div>
              </button>
            ))}
          </div>

          {/* Availability calendar */}
          {selectedRoomType && (
            <div>
              <h2 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Select your dates
              </h2>
              <AvailabilityCalendar
                rooms={rooms}
                reservations={reservations}
                roomTypeId={selectedRoomType.id}
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={minCheckIn}
                maxDate={maxCheckIn}
                onSelectRange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
              />
              {nights > 0 && (
                <p className="text-xs text-brand-slate mt-2">
                  {checkIn} → {checkOut} · {nights} night{nights > 1 ? 's' : ''}
                  {settings?.min_stay_default > 1 && ` · ${settings.min_stay_default}-night minimum stay`}
                </p>
              )}
            </div>
          )}

          {/* Guests */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 grid grid-cols-2 gap-4">
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

          {experiences.length > 0 && (
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Add a local experience</h2>
              <div className="space-y-2">
                {experiences.map(exp => {
                  const checked = selectedExperienceIds.includes(exp.id);
                  return (
                    <label key={exp.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer ${checked ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={checked} onChange={() => setSelectedExperienceIds(prev => checked ? prev.filter(id => id !== exp.id) : [...prev, exp.id])} />
                        <div>
                          <p className="text-sm font-medium text-brand-ink">{exp.title}</p>
                          <p className="text-xs text-brand-slate">{exp.duration_minutes} min · {exp.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-brand-navy">{fmt(exp.price)}/person</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          {selectedRoomType && nights > 0 && (() => {
            const subtotal = (selectedRoomType.base_price || 0) * nights;
            const breakdown = calculateStayTax({ subtotal, nights, property });
            return (
              <div className="bg-brand-navy rounded-2xl p-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">{nights} night{nights > 1 ? 's' : ''} · {selectedRoomType.name}</p>
                  <div className="text-[11px] text-white/60 mt-1 space-y-0.5">
                    <p>Room total: {fmt(breakdown.subtotal)}</p>
                    {breakdown.vatRate > 0 && <p>VAT/GST ({breakdown.vatRate}%): {fmt(breakdown.vat)}</p>}
                    {breakdown.cityTax > 0 && <p>City tax: {fmt(breakdown.cityTax)}</p>}
                  </div>
                  <p className="text-lg font-bold mt-1">{fmt(breakdown.total)}</p>
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
            );
          })()}
        </form>

        {/* Certified reviews — only from guests whose reservation was actually checked_out */}
        {certifiedReviews.length > 0 && (
          <div className="mt-8 border-t border-brand-border pt-6">
            <h2 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Guest reviews
              <span className="text-brand-slate font-normal">
                ({(certifiedReviews.reduce((s, r) => s + (Number(r.overall_rating) || 0), 0) / certifiedReviews.length).toFixed(1)} avg · {certifiedReviews.length} verified stays)
              </span>
            </h2>
            <div className="space-y-3">
              {certifiedReviews.slice(0, 6).map(r => (
                <div key={r.id} className="bg-white border border-brand-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-brand-ink">{r.guest_name || 'Guest'}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3 h-3 ${n <= Math.round(r.overall_rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}`} />)}
                    </div>
                  </div>
                  <p className="text-sm text-brand-slate">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public Q&A */}
        <div className="mt-8 border-t border-brand-border pt-6">
          <h2 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-brand-navy" /> Questions & answers</h2>
          {hotelQuestions.length > 0 && (
            <div className="space-y-3 mb-4">
              {hotelQuestions.slice(0, 8).map(q => (
                <div key={q.id} className="bg-white border border-brand-border rounded-xl p-4">
                  <p className="text-sm font-medium text-brand-ink">Q: {q.question}</p>
                  {q.answer ? (
                    <p className="text-sm text-brand-slate mt-1">A: {q.answer}</p>
                  ) : (
                    <p className="text-xs text-brand-slate/60 mt-1 italic">Awaiting an answer from the property</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {askSent ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Your question was posted — the property will answer publicly here.
            </div>
          ) : (
            <form onSubmit={submitQuestion} className="flex flex-col sm:flex-row gap-2">
              <input value={askName} onChange={e => setAskName(e.target.value)} placeholder="Your name (optional)"
                className="sm:w-40 px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              <input required value={askQuestion} onChange={e => setAskQuestion(e.target.value)} placeholder="Ask the property a question…"
                className="flex-1 px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              <button type="submit" disabled={askSending} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60 shrink-0">
                <Send className="w-3.5 h-3.5" /> {askSending ? 'Posting…' : 'Ask'}
              </button>
            </form>
          )}
        </div>

        {/* Guest support — no account needed, per spec section 37 */}
        <div className="mt-6 border-t border-brand-border pt-5">
          {!showSupport ? (
            <button onClick={() => setShowSupport(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-navy hover:underline">
              <LifeBuoy className="w-3.5 h-3.5" /> Need help with this booking?
            </button>
          ) : supportSent ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Sent — the property will follow up by email.
            </div>
          ) : (
            <form onSubmit={submitSupportRequest} className="space-y-2">
              <p className="text-xs font-semibold text-brand-ink flex items-center gap-1.5"><LifeBuoy className="w-3.5 h-3.5 text-brand-navy" /> Contact the property</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" required value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="Your email"
                  className="flex-1 px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
                <input value={supportMsg} onChange={e => setSupportMsg(e.target.value)} placeholder="Your question"
                  className="flex-[2] px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
                <button type="submit" disabled={sendingSupport} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60 shrink-0">
                  <Send className="w-3.5 h-3.5" /> {sendingSupport ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>

        <a href={`/`} className="inline-flex items-center gap-1 text-xs text-brand-slate mt-6 hover:text-brand-navy">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Hostera
        </a>
      </div>
    </div>
  );
}
