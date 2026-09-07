const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Star, MessageSquare, Send, TrendingUp, Filter } from 'lucide-react';

const sourceLabels = { direct: 'Direct', google: 'Google', booking: 'Booking.com', tripadvisor: 'TripAdvisor', expedia: 'Expedia' };
const sourcePills = { direct: 'bg-blue-50 text-[#123B63]', google: 'bg-amber-50 text-amber-700', booking: 'bg-blue-50 text-blue-700', tripadvisor: 'bg-green-50 text-green-700', expedia: 'bg-yellow-50 text-yellow-700' };

export default function ReputationManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    db.entities.Review.list('-review_date', 200)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const responded = reviews.filter(r => r.status === 'responded').length;
  const responseRate = reviews.length ? Math.round((responded / reviews.length) * 100) : 0;

  const filtered = reviews.filter(r =>
    (source === 'all' || r.source === source) &&
    (statusFilter === 'all' || r.status === statusFilter)
  );

  const distribution = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  const saveReply = async (review) => {
    await db.entities.Review.update(review.id, { response: replyText, status: 'responded' });
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, response: replyText, status: 'responded' } : r));
    setReplying(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Reputation Management</h1>
        <p className="text-sm text-[#64748B]">Aggregate and respond to guest reviews across every platform.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Average Rating', value: avg, icon: Star, tint: 'text-amber-500' },
          { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, tint: 'text-[#123B63]' },
          { label: 'Response Rate', value: `${responseRate}%`, icon: Send, tint: 'text-green-600' },
          { label: 'Awaiting Reply', value: reviews.filter(r => r.status !== 'responded').length, icon: TrendingUp, tint: 'text-red-500' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <Icon className={`w-4 h-4 mb-2 ${k.tint}`} />
              <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
              <p className="text-[11px] text-[#64748B]">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h3 className="text-sm font-semibold text-[#17212B] mb-4">Rating Distribution</h3>
          <div className="space-y-2.5">
            {distribution.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-[#64748B] w-3">{n}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-[#F6F8FB] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-[#64748B] w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-[#64748B]" />
            {['all', ...Object.keys(sourceLabels)].map(s => (
              <button key={s} onClick={() => setSource(s)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${source === s ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>
                {s === 'all' ? 'All Sources' : sourceLabels[s]}
              </button>
            ))}
            <span className="mx-2 w-px h-5 bg-[#E2E8F0]" />
            {['all', 'pending', 'responded'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${statusFilter === s ? 'bg-[#1F5A8A] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[#64748B]">Loading reviews…</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
              <Star className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">No reviews match these filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(review => (
                <div key={review.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#17212B]">{review.guest_name || 'Guest'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sourcePills[review.source] || 'bg-gray-100 text-gray-600'}`}>
                          {sourceLabels[review.source] || review.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0] fill-[#E2E8F0]'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#64748B]">{review.review_date ? new Date(review.review_date).toLocaleDateString() : ''}</span>
                  </div>
                  {review.title && <p className="text-sm font-medium text-[#17212B] mb-1">{review.title}</p>}
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-3">{review.comment}</p>

                  {review.response ? (
                    <div className="bg-[#F6F8FB] rounded-xl p-3 border-l-2 border-[#123B63]">
                      <p className="text-[10px] font-semibold text-[#123B63] uppercase tracking-wide mb-1">Property Response</p>
                      <p className="text-[13px] text-[#17212B] leading-relaxed">{review.response}</p>
                    </div>
                  ) : replying === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={3}
                        placeholder="Write your public response…"
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-2xl text-sm outline-none focus:border-[#123B63] resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveReply(review)} className="px-4 py-2 bg-[#123B63] text-white text-xs font-semibold rounded-full hover:bg-[#1F5A8A]">Publish Response</button>
                        <button onClick={() => setReplying(null)} className="px-4 py-2 border border-[#E2E8F0] text-xs font-medium rounded-full text-[#64748B]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReplying(review.id); setReplyText(''); }} className="px-4 py-2 bg-[#123B63] text-white text-xs font-semibold rounded-full hover:bg-[#1F5A8A]">
                      Respond
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}