import React from 'react';

export function BrowserFrame({ children, url = 'app.hostera.com/dashboard' }) {
  return (
    <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 border border-black/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#F6F8FB] border-b border-[#E2E8F0]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="mx-auto flex items-center gap-1.5 px-4 py-1 bg-white rounded-full border border-[#E2E8F0] text-[10px] text-[#64748B] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniSidebar() {
  return (
    <div className="hidden md:flex w-14 bg-[#123B63] flex-col items-center py-4 gap-2 shrink-0">
      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[8px] font-bold text-white">H</div>
      <div className="w-full px-3 space-y-1.5 mt-3">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'bg-white/50' : 'bg-white/15'}`} />
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, trend }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-left">
      <p className="text-[9px] text-[#64748B] uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-base font-bold text-[#17212B]">{value}</p>
        {trend && <span className="text-[9px] font-semibold text-green-600">{trend}</span>}
      </div>
    </div>
  );
}

export function DashboardMockup() {
  const bars = [42, 58, 48, 72, 64, 88, 78, 95, 70, 82, 90, 98];
  return (
    <BrowserFrame>
      <div className="flex">
        <MiniSidebar />
        <div className="flex-1 bg-[#F6F8FB] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm font-bold text-[#17212B]">Dashboard</p>
              <p className="text-[10px] text-[#64748B]">Hostera Grand Dubai · Monday, September 7</p>
            </div>
            <div className="px-3 py-1.5 bg-[#123B63] text-white rounded-full text-[10px] font-semibold">+ New Reservation</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Occupancy" value="84%" trend="+5.2%" />
            <Kpi label="ADR" value="$214" trend="+$12" />
            <Kpi label="RevPAR" value="$180" trend="+$9" />
            <Kpi label="Revenue" value="$12,480" trend="+15%" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#17212B] text-left">Revenue Trend</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Live</span>
              </div>
              <div className="flex items-end gap-1.5 h-24">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === bars.length - 1 ? '#1F5A8A' : '#123B63', opacity: i === bars.length - 1 ? 1 : 0.75 }} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <p className="text-xs font-semibold text-[#17212B] mb-3 text-left">Today&apos;s Arrivals</p>
              {[['A. Al-Rashid', 'Rm 505'], ['J. Anderson', 'Rm 606'], ['S. Martin', 'Rm 404']].map(([n, r], i) => (
                <div key={n} className="flex items-center justify-between py-1.5">
                  <div className="text-left">
                    <p className="text-[10px] font-medium text-[#17212B]">{n}</p>
                    <p className="text-[8px] text-[#64748B]">{r}</p>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {i === 0 ? 'Confirmed' : 'Checked In'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function RoomRackMockup() {
  const dates = ['Mon 7', 'Tue 8', 'Wed 9', 'Thu 10', 'Fri 11', 'Sat 12', 'Sun 13'];
  const rooms = [
    { n: '101', blocks: [{ col: 1, span: 3, color: 'bg-blue-500', label: 'M. Garcia' }, { col: 5, span: 2, color: 'bg-purple-500', label: 'Y. Tanaka' }] },
    { n: '102', blocks: [{ col: 2, span: 4, color: 'bg-green-500', label: 'J. Wilson' }] },
    { n: '201', blocks: [{ col: 1, span: 2, color: 'bg-amber-500', label: 'E. Schmidt' }, { col: 4, span: 3, color: 'bg-blue-500', label: 'C. Silva' }] },
    { n: '301', blocks: [{ col: 3, span: 4, color: 'bg-purple-500', label: 'F. Hassan' }] },
  ];
  return (
    <BrowserFrame url="app.hostera.com/room-rack">
      <div className="bg-white p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#17212B]">Room Rack</p>
          <div className="flex gap-1.5">
            {['All Floors', 'Available', 'Occupied'].map((f, i) => (
              <span key={f} className={`text-[9px] px-2.5 py-1 rounded-full font-medium ${i === 0 ? 'bg-[#123B63] text-white' : 'bg-[#F6F8FB] text-[#64748B] border border-[#E2E8F0]'}`}>{f}</span>
            ))}
          </div>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: '48px repeat(7, minmax(60px, 1fr))' }}>
          <div />
          {dates.map(d => <div key={d} className="text-[8px] text-[#64748B] text-center font-semibold pb-1">{d}</div>)}
          {rooms.map(r => (
            <React.Fragment key={r.n}>
              <div className="text-[9px] font-bold text-[#17212B] flex items-center">{r.n}</div>
              {Array.from({ length: 7 }, (_, col) => {
                const block = r.blocks.find(b => col + 1 >= b.col && col + 1 < b.col + b.span);
                const isStart = block && col + 1 === block.col;
                return (
                  <div key={col} className="h-7 rounded-md overflow-hidden">
                    {block && (
                      <div className={`${block.color} h-full flex items-center px-1.5 rounded-md ${isStart ? '' : ''}`}>
                        {isStart && <span className="text-[8px] text-white font-medium truncate">{block.label}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function FrontDeskMockup() {
  const rows = [
    ['Ahmed Al-Rashid', 'Rm 505 · 2 adults', 'Confirmed', true],
    ['John Anderson', 'Rm 606 · 2 adults', 'Confirmed', true],
    ['Sophie Martin', 'Rm 404 · 2 adults', 'Checked In', false],
  ];
  return (
    <BrowserFrame url="app.hostera.com/front-desk">
      <div className="bg-[#F6F8FB] p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[['Arrivals', '12'], ['Departures', '8'], ['In-House', '34'], ['Available', '21']].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 text-left">
              <p className="text-[8px] text-[#64748B] uppercase">{l}</p>
              <p className="text-sm font-bold text-[#17212B]">{v}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3">
          <p className="text-xs font-semibold text-[#17212B] mb-2 text-left">Today&apos;s Arrivals</p>
          {rows.map(([name, info, status, canCheckIn]) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
              <div className="text-left">
                <p className="text-[10px] font-semibold text-[#17212B]">{name}</p>
                <p className="text-[8px] text-[#64748B]">{info}</p>
              </div>
              {canCheckIn ? (
                <div className="px-3 py-1 bg-green-600 text-white rounded-full text-[9px] font-semibold">Check In</div>
              ) : (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

export function AnalyticsMockup() {
  return (
    <BrowserFrame url="app.hostera.com/analytics">
      <div className="bg-[#F6F8FB] p-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#17212B] text-left">Occupancy Rate</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">84% avg</span>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {[50, 62, 58, 74, 80, 92, 84].map((h, i) => (
              <div key={i} className="flex-1 bg-[#1F5A8A] rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#17212B] text-left">Revenue by Source</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">MTD</span>
          </div>
          <div className="space-y-2">
            {[['Direct', 78, 'bg-[#123B63]'], ['OTA', 60, 'bg-[#1F5A8A]'], ['Corporate', 38, 'bg-[#2563EB]'], ['Groups', 24, 'bg-[#16A34A]']].map(([l, w, c]) => (
              <div key={l} className="flex items-center gap-2">
                <span className="text-[9px] text-[#64748B] w-14 text-left">{l}</span>
                <div className="flex-1 h-2 bg-[#F6F8FB] rounded-full overflow-hidden">
                  <div className={`h-full ${c} rounded-full`} style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}