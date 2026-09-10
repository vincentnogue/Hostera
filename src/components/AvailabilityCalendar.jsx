import React, { useMemo, useState } from 'react';
import { ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react';

const MS_PER_DAY = 86400000;
const toDateStr = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => new Date(d.getTime() + n * MS_PER_DAY);

// Given the property's rooms and active reservations, returns a Set of
// "unavailable" date strings for a given room type — a day is unavailable
// once every physical room of that type is already booked (checked in
// covers [check_in, check_out) — a guest checking out on day X frees the
// room for a new arrival that same day).
function computeUnavailableDates(roomTypeId, rooms, reservations, rangeStart, rangeEnd) {
  const totalRooms = rooms.filter(r => r.room_type_id === roomTypeId).length;
  if (totalRooms === 0) return new Set();

  const relevant = reservations.filter(r =>
    r.room_type_id === roomTypeId &&
    r.status !== 'cancelled' && r.status !== 'no_show' &&
    r.check_in && r.check_out
  );

  const unavailable = new Set();
  for (let d = new Date(rangeStart); d < rangeEnd; d = addDays(d, 1)) {
    const dateStr = toDateStr(d);
    const bookedCount = relevant.filter(r => dateStr >= r.check_in && dateStr < r.check_out).length;
    if (bookedCount >= totalRooms) unavailable.add(dateStr);
  }
  return unavailable;
}

export default function AvailabilityCalendar({
  rooms,
  reservations,
  roomTypeId,
  checkIn,
  checkOut,
  onSelectRange,
  minDate,
  maxDate,
}) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthStart = monthCursor;
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
  const daysInMonth = Math.round((monthEnd - monthStart) / MS_PER_DAY);
  const leadingBlanks = monthStart.getDay();

  const unavailable = useMemo(
    () => roomTypeId ? computeUnavailableDates(roomTypeId, rooms, reservations, monthStart, monthEnd) : new Set(),
    [roomTypeId, rooms, reservations, monthStart, monthEnd]
  );

  const todayStr = toDateStr(new Date());

  const handleDayClick = (dateStr) => {
    if (dateStr < (minDate || todayStr)) return;
    if (maxDate && dateStr > maxDate) return;
    if (unavailable.has(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onSelectRange(dateStr, '');
    } else if (dateStr <= checkIn) {
      onSelectRange(dateStr, '');
    } else {
      // Reject a checkout that would cross an unavailable day.
      let blocked = false;
      for (let d = new Date(checkIn); d < new Date(dateStr); d = addDays(d, 1)) {
        if (unavailable.has(toDateStr(d))) blocked = true;
      }
      if (blocked) {
        onSelectRange(dateStr, '');
      } else {
        onSelectRange(checkIn, dateStr);
      }
    }
  };

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-bg text-brand-slate">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-brand-ink">
          {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <button type="button" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-bg text-brand-slate">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-brand-slate-light mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={`b${i}`} />;
          const dateStr = toDateStr(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
          const isPast = dateStr < (minDate || todayStr);
          const isTooFar = maxDate && dateStr > maxDate;
          const isBlocked = unavailable.has(dateStr);
          const isDisabled = isPast || isTooFar || isBlocked;
          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

          return (
            <button
              type="button"
              key={dateStr}
              disabled={isDisabled}
              onClick={() => handleDayClick(dateStr)}
              className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                isCheckIn || isCheckOut ? 'bg-brand-navy text-white' :
                isInRange ? 'bg-brand-navy/10 text-brand-navy' :
                isDisabled ? 'text-brand-border cursor-not-allowed line-through' :
                'text-brand-ink hover:bg-brand-bg'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-border text-[11px] text-brand-slate">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-navy" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-brand-border text-center line-through" /> Unavailable</span>
      </div>
    </div>
  );
}
