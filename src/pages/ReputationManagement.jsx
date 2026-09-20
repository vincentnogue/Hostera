const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Star, MessageSquare, Send, TrendingUp, Filter, ShieldCheck, HelpCircle, EyeOff, Eye, Plus, X } from 'lucide-react';
import { useProperty } from '@/lib/PropertyContext';
import { useToast } from '@/components/ui/use-toast';

const sourceLabels = { direct: 'Direct', google: 'Google', booking: 'Booking.com', tripadvisor: 'TripAdvisor', expedia: 'Expedia' };
const sourcePills = { direct: 'bg-blue-50 text-brand-navy', google: 'bg-amber-50 text-amber-700', booking: 'bg-blue-50 text-blue-700', tripadvisor: 'bg-green-50 text-green-700', expedia: 'bg-yellow-50 text-yellow-700' };

function CertifiedReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    db.entities.CertifiedReview.list('-created_date', 200).then(setReviews).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleVisibility = async (r) => {
    const status = r.status === 'published' ? 'hidden' : 'published';
    await db.entities.CertifiedReview.update(r.id, { status });
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (Number(r.overall_rating) || 0), 0) / reviews.length).toFixed(1) : '—';

  if (loading) return <p className="text-sm text-brand-slate">Loading certified reviews…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-brand-slate">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span><strong className="text-brand-ink">{avg}</strong> average across <strong className="text-brand-ink">{reviews.length}</strong> checkout-verified reviews. These come only from guests whose reservation was marked checked_out — they can&apos;t be faked or bought.</span>
      </div>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No certified reviews yet — guests can leave one from their Guest Portal after checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-brand-border p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-ink">{r.guest_name || 'Guest'}</span>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-700"><ShieldCheck className="w-3 h-3" /> Verified stay</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(r.overall_rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border fill-brand-border'}`} />
                    ))}
                  </div>
                </div>
                <button onClick={() => toggleVisibility(r)} className="flex items-center gap-1 text-xs font-medium text-brand-slate hover:text-brand-navy">
                  {r.status === 'published' ? <><Eye className="w-3.5 h-3.5" /> Published</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-[11px] text-brand-slate">
                <span>Cleanliness: {r.rating_cleanliness}/5</span>
                <span>Location: {r.rating_location}/5</span>
                <span>Service: {r.rating_service}/5</span>
                <span>Value: {r.rating_value}/5</span>
              </div>
              <p className="text-[13px] text-brand-slate leading-relaxed">{r.comment}</p>
              {r.photo_urls?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {r.photo_urls.map(u => <img key={u} src={u} alt="" className="w-16 h-16 rounded-lg object-cover" />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuestQuestionsTab() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(null);
  const [answerText, setAnswerText] = useState('');

  const load = () => {
    setLoading(true);
    db.entities.HotelQuestion.list('-created_date', 200).then(setQuestions).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submitAnswer = async (q) => {
    if (!answerText.trim()) return;
    await db.entities.HotelQuestion.update(q.id, { answer: answerText.trim(), status: 'answered' });
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, answer: answerText.trim(), status: 'answered' } : x));
    setAnswering(null);
    setAnswerText('');
  };

  if (loading) return <p className="text-sm text-brand-slate">Loading questions…</p>;

  return questions.length === 0 ? (
    <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
      <HelpCircle className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
      <p className="text-sm text-brand-slate">No guest questions yet. They&apos;ll show up here as soon as someone asks one from your listing.</p>
    </div>
  ) : (
    <div className="space-y-3">
      {questions.map(q => (
        <div key={q.id} className="bg-white rounded-xl border border-brand-border p-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-sm font-semibold text-brand-ink">{q.guest_name || 'A traveler'} asked:</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${q.status === 'answered' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{q.status === 'answered' ? 'Answered' : 'Awaiting reply'}</span>
          </div>
          <p className="text-[13px] text-brand-ink mb-3">{q.question}</p>
          {q.answer ? (
            <div className="bg-brand-bg rounded-xl p-3 border-l-2 border-brand-navy">
              <p className="text-[10px] font-semibold text-brand-navy uppercase tracking-wide mb-1">Your answer (public)</p>
              <p className="text-[13px] text-brand-ink leading-relaxed">{q.answer}</p>
            </div>
          ) : answering === q.id ? (
            <div className="space-y-2">
              <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} rows={2}
                placeholder="Your public answer…" className="w-full px-4 py-2.5 border border-brand-border rounded-2xl text-sm outline-none focus:border-brand-navy resize-none" />
              <div className="flex gap-2">
                <button onClick={() => submitAnswer(q)} className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">Post answer</button>
                <button onClick={() => setAnswering(null)} className="px-4 py-2 border border-brand-border text-xs font-medium rounded-full text-brand-slate">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setAnswering(q.id); setAnswerText(''); }} className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">Answer</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ReputationManagement() {
  const [tab, setTab] = useState('external');
  const { selectedProperty } = useProperty();
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');
  // Review rows were only ever updated (staff replying), never created —
  // there was no way to log a review an employee read on Google/
  // Booking.com/TripAdvisor into the system in the first place.
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ source: 'google', rating: 5, author_name: '', comment: '' });
  const [logging, setLogging] = useState(false);

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

  const logReview = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      const created = await db.entities.Review.create({
        organization_id: selectedProperty?.organization_id,
        property_id: selectedProperty?.id,
        source: logForm.source,
        rating: Number(logForm.rating),
        author_name: logForm.author_name.trim() || 'Guest',
        comment: logForm.comment.trim(),
        review_date: new Date().toISOString().slice(0, 10),
        status: 'new',
      });
      setReviews(prev => [created, ...prev]);
      setShowLog(false);
      setLogForm({ source: 'google', rating: 5, author_name: '', comment: '' });
      toast({ title: 'Review logged' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not log review', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Reputation Management</h1>
        <p className="text-sm text-brand-slate">Aggregate and respond to guest reviews across every platform.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { key: 'external', label: 'External Reviews', icon: MessageSquare },
            { key: 'certified', label: 'Certified Reviews', icon: ShieldCheck },
            { key: 'questions', label: 'Guest Questions', icon: HelpCircle },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        {tab === 'external' && (
          <button onClick={() => setShowLog(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
            <Plus className="w-3.5 h-3.5" /> Log a review
          </button>
        )}
      </div>

      {showLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowLog(false)}>
          <form onSubmit={logReview} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-ink">Log an external review</h2>
              <button type="button" onClick={() => setShowLog(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={logForm.source} onChange={e => setLogForm({ ...logForm, source: e.target.value })} className="px-3 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={logForm.rating} onChange={e => setLogForm({ ...logForm, rating: e.target.value })} className="px-3 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <input value={logForm.author_name} onChange={e => setLogForm({ ...logForm, author_name: e.target.value })} placeholder="Reviewer name"
              className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
            <textarea required value={logForm.comment} onChange={e => setLogForm({ ...logForm, comment: e.target.value })} placeholder="What did they write?" rows={3}
              className="w-full px-3.5 py-2 border border-brand-border rounded-2xl text-sm outline-none focus:border-brand-navy resize-none" />
            <button type="submit" disabled={logging} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              {logging ? 'Saving…' : 'Log review'}
            </button>
          </form>
        </div>
      )}

      {tab === 'certified' && <CertifiedReviewsTab />}
      {tab === 'questions' && <GuestQuestionsTab />}

      {tab === 'external' && (<>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Average Rating', value: avg, icon: Star, tint: 'text-amber-500' },
          { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, tint: 'text-brand-navy' },
          { label: 'Response Rate', value: `${responseRate}%`, icon: Send, tint: 'text-green-600' },
          { label: 'Awaiting Reply', value: reviews.filter(r => r.status !== 'responded').length, icon: TrendingUp, tint: 'text-red-500' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
              <Icon className={`w-4 h-4 mb-2 ${k.tint}`} />
              <p className="text-xl font-bold text-brand-ink">{k.value}</p>
              <p className="text-[11px] text-brand-slate">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        <div className="bg-white rounded-xl border border-brand-border p-5">
          <h3 className="text-sm font-semibold text-brand-ink mb-4">Rating Distribution</h3>
          <div className="space-y-2.5">
            {distribution.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-brand-slate w-3">{n}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-brand-slate w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-brand-slate" />
            {['all', ...Object.keys(sourceLabels)].map(s => (
              <button key={s} onClick={() => setSource(s)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${source === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
                {s === 'all' ? 'All Sources' : sourceLabels[s]}
              </button>
            ))}
            <span className="mx-2 w-px h-5 bg-brand-border" />
            {['all', 'pending', 'responded'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${statusFilter === s ? 'bg-brand-blue text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-brand-slate">Loading reviews…</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
              <Star className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
              <p className="text-sm text-brand-slate">No reviews match these filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(review => (
                <div key={review.id} className="bg-white rounded-xl border border-brand-border p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-ink">{review.guest_name || 'Guest'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sourcePills[review.source] || 'bg-gray-100 text-gray-600'}`}>
                          {sourceLabels[review.source] || review.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-brand-border fill-brand-border'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-brand-slate">{review.review_date ? new Date(review.review_date).toLocaleDateString() : ''}</span>
                  </div>
                  {review.title && <p className="text-sm font-medium text-brand-ink mb-1">{review.title}</p>}
                  <p className="text-[13px] text-brand-slate leading-relaxed mb-3">{review.comment}</p>

                  {review.response ? (
                    <div className="bg-brand-bg rounded-xl p-3 border-l-2 border-brand-navy">
                      <p className="text-[10px] font-semibold text-brand-navy uppercase tracking-wide mb-1">Property Response</p>
                      <p className="text-[13px] text-brand-ink leading-relaxed">{review.response}</p>
                    </div>
                  ) : replying === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={3}
                        placeholder="Write your public response…"
                        className="w-full px-4 py-2.5 border border-brand-border rounded-2xl text-sm outline-none focus:border-brand-navy resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveReply(review)} className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">Publish Response</button>
                        <button onClick={() => setReplying(null)} className="px-4 py-2 border border-brand-border text-xs font-medium rounded-full text-brand-slate">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReplying(review.id); setReplyText(''); }} className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">
                      Respond
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}