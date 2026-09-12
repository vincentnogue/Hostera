const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';
import { useProperty } from '@/lib/PropertyContext';
import { PLANS } from '@/lib/marketing';

import { Sparkles, Send, Loader2, Lock, AlertTriangle, TrendingUp, BedDouble, Users } from 'lucide-react';

const SUGGESTIONS = [
  'How is occupancy trending this week?',
  'Which upcoming reservations still owe a balance?',
  'Summarize what needs my attention today.',
  'Any pricing suggestions based on current bookings?',
];

// Hostera AI — a real hospitality copilot, not a canned-response chatbot.
// It only ever sees data this specific user's session already legitimately
// has access to (fetched here via the normal, RLS-scoped db.entities
// calls), forwarded to a secure server-side proxy (functions/api/ai-chat.js)
// that holds the actual Anthropic API key. If that key isn't configured,
// this shows an honest "Not connected" state — never a fake response.
export default function HosteraAI() {
  const { selectedProperty } = useProperty();
  const [plan, setPlan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [contextSummary, setContextSummary] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    db.entities.SubscriptionSetting.list().catch(() => []).then(subs => {
      setPlan(PLANS.find(p => p.name.toLowerCase() === (subs || [])[0]?.plan) || PLANS[0]);
    });
  }, []);

  const hasAccess = plan && (plan.modules?.some(m => /hostera ai/i.test(m)) || plan?.name === 'Business' || plan?.name === 'Enterprise');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Assembles a compact, real snapshot of this property's current state —
  // exactly what a staff member asking a question would want the
  // assistant to already know, nothing more.
  const buildContext = async () => {
    const [reservations, rooms] = await Promise.all([
      db.entities.Reservation.list('-created_date', 100).catch(() => []),
      db.entities.Room.list().catch(() => []),
    ]);
    const propId = selectedProperty?.id;
    const scoped = propId ? reservations.filter(r => !r.property_id || r.property_id === propId) : reservations;
    const scopedRooms = propId ? rooms.filter(r => !r.property_id || r.property_id === propId) : rooms;
    const today = new Date().toISOString().slice(0, 10);
    const active = scoped.filter(r => r.status !== 'cancelled');
    const summary = {
      property: selectedProperty?.name || 'All properties',
      currency: selectedProperty?.currency || 'USD',
      total_rooms: scopedRooms.length,
      occupied_rooms: scopedRooms.filter(r => r.status === 'occupied').length,
      arrivals_today: active.filter(r => r.check_in === today).length,
      departures_today: active.filter(r => r.check_out === today).length,
      in_house: scoped.filter(r => r.status === 'checked_in').length,
      unpaid_balances: active
        .filter(r => (r.total_amount || 0) > (r.paid_amount || 0))
        .map(r => ({ guest: r.guest_name, balance: (r.total_amount || 0) - (r.paid_amount || 0), check_out: r.check_out }))
        .slice(0, 10),
      recent_reservations: active.slice(0, 15).map(r => ({
        guest: r.guest_name, check_in: r.check_in, check_out: r.check_out,
        status: r.status, source: r.source, total: r.total_amount,
      })),
    };
    setContextSummary(summary);
    return summary;
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setErrorMsg('');
    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const context = contextSummary || await buildContext();
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, context }),
      });
      const data = await res.json();
      if (res.status === 503 && data.error === 'not_connected') {
        setNotConnected(true);
        setMessages(nextMessages);
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.message || 'Something went wrong reaching Hostera AI.');
        return;
      }
      setMessages([...nextMessages, { role: 'assistant', content: data.text }]);
    } catch (e) {
      setErrorMsg('Could not reach Hostera AI — check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (plan && !hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-brand-border p-10 text-center max-w-lg mx-auto mt-10">
        <Lock className="w-8 h-8 text-brand-slate-light mx-auto mb-3" />
        <h2 className="text-lg font-bold text-brand-ink">Hostera AI is on Business & Enterprise</h2>
        <p className="text-sm text-brand-slate mt-2">
          You&apos;re currently on the {plan.name} plan. Upgrade to unlock a real operations copilot for this property.
        </p>
        <a href="/subscription" className="inline-block mt-5 px-5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          View plans
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Hostera AI</h1>
          <p className="text-xs text-brand-slate">Ask about occupancy, revenue, arrivals, balances — for {selectedProperty?.name || 'your property'}.</p>
        </div>
      </div>

      {notConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Hostera AI isn&apos;t connected yet</p>
            <p className="text-xs text-amber-700 mt-1">
              A platform administrator needs to configure the AI provider (ANTHROPIC_API_KEY) before this assistant can respond.
              This is not a demo — it genuinely won&apos;t answer until that&apos;s set up.
            </p>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700">{errorMsg}</div>
      )}

      <div className="bg-white rounded-xl border border-brand-border flex flex-col h-[60vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="grid grid-cols-3 gap-3 mb-6 text-brand-slate-light">
                <div className="flex flex-col items-center gap-1"><TrendingUp className="w-5 h-5" /><span className="text-[10px]">Revenue</span></div>
                <div className="flex flex-col items-center gap-1"><BedDouble className="w-5 h-5" /><span className="text-[10px]">Occupancy</span></div>
                <div className="flex flex-col items-center gap-1"><Users className="w-5 h-5" /><span className="text-[10px]">Guests</span></div>
              </div>
              <p className="text-sm text-brand-slate mb-4">Ask a real question about this property — answers are grounded in its actual current data.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} className="px-3.5 py-1.5 text-xs bg-brand-bg text-brand-ink rounded-full border border-brand-border hover:border-brand-navy">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-navy text-white' : 'bg-brand-bg text-brand-ink'}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-brand-slate">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2 p-3 border-t border-brand-border">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about this property…"
            className="flex-1 px-4 py-2.5 bg-brand-bg rounded-full text-sm outline-none"
          />
          <button type="submit" disabled={sending || !input.trim()} className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center hover:bg-brand-blue disabled:opacity-50 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
