const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Star, MessageSquare, Send, ThumbsUp } from 'lucide-react';

const sourceLabels = {
  direct: 'Direct', google: 'Google', booking: 'Booking.com',
  tripadvisor: 'TripAdvisor', expedia: 'Expedia',
};

export default function Reputation() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const fetchData = async () => {
    try {
      const data = await db.entities.Review.list();
      setReviews(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) return;
    try {
      await db.entities.Review.update(reviewId, {
        response: responseText,
        status: 'responded',
      });
      setRespondingId(null);
      setResponseText('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const totalReviews = reviews.length;
  const respondedCount = reviews.filter(r => r.status === 'responded').length;
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const satisfactionScore = Math.round((avgRating / 5) * 100);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Reputation Dashboard</h1>
        <p className="text-sm text-brand-slate mt-1">Guest ratings, reviews and satisfaction tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-brand-border p-6 text-center">
          <p className="text-5xl font-bold text-brand-ink mb-2">{avgRating}</p>
          <div className="flex justify-center gap-0.5 mb-3">{renderStars(Math.round(avgRating))}</div>
          <p className="text-sm text-brand-slate">{totalReviews} total reviews</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-ink mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-brand-slate w-6">{star}★</span>
                <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-brand-ink w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-ink mb-4">Satisfaction Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-brand-slate">Satisfaction Score</span>
                <span className="text-sm font-bold text-brand-ink">{satisfactionScore}%</span>
              </div>
              <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${satisfactionScore}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-brand-slate">Response Rate</span>
                <span className="text-sm font-bold text-brand-ink">{responseRate}%</span>
              </div>
              <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                <div className="h-full bg-brand-navy rounded-full" style={{ width: `${responseRate}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-brand-bg rounded-lg">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-brand-slate">{respondedCount} of {totalReviews} reviews responded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <Star className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No reviews yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {reviews.map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-medium">
                      {(review.guest_name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{review.guest_name || 'Anonymous'}</p>
                      <p className="text-xs text-brand-slate">
                        {sourceLabels[review.source] || review.source} · {review.review_date || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">{renderStars(review.rating || 0)}</div>
                </div>

                {review.title && <h4 className="text-sm font-semibold text-brand-ink mb-1">{review.title}</h4>}
                <p className="text-sm text-brand-slate leading-relaxed mb-3">{review.comment}</p>

                {review.response ? (
                  <div className="pl-4 border-l-2 border-brand-navy py-2">
                    <p className="text-xs font-medium text-brand-navy mb-1">Management Response</p>
                    <p className="text-sm text-brand-slate">{review.response}</p>
                  </div>
                ) : respondingId === review.id ? (
                  <div className="mt-3">
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      rows={2}
                      placeholder="Write your response..."
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setRespondingId(null); setResponseText(''); }}
                        className="px-3 py-1.5 border border-brand-border rounded-lg text-xs font-medium text-brand-slate hover:bg-brand-bg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRespond(review.id)}
                        disabled={!responseText.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-navy text-white rounded-lg text-xs font-medium hover:bg-brand-blue disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" /> Send Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setRespondingId(review.id); setResponseText(''); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-navy hover:text-brand-blue transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Respond to review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}