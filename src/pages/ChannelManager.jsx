const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Plug, RefreshCw, Globe, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const statusConfig = {
  connected: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Connected' },
  disconnected: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Disconnected' },
  error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
  syncing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Syncing' },
};

export default function ChannelManager() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);

  const fetchData = async () => {
    try {
      const data = await db.entities.ChannelConnection.list();
      setChannels(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async (channelId) => {
    setSyncingId(channelId);
    try {
      await db.entities.ChannelConnection.update(channelId, {
        status: 'syncing',
        last_sync: new Date().toISOString(),
      });
      setTimeout(async () => {
        await db.entities.ChannelConnection.update(channelId, { status: 'connected' });
        fetchData();
        setSyncingId(null);
      }, 2000);
    } catch (e) {
      console.error(e);
      setSyncingId(null);
    }
  };

  const handleConnect = async (channelId, currentStatus) => {
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    try {
      await db.entities.ChannelConnection.update(channelId, { status: newStatus });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const connectedCount = channels.filter(c => c.status === 'connected').length;
  const totalBookings = channels.reduce((s, c) => s + (c.bookings_this_month || 0), 0);
  const totalRevenue = channels.reduce((s, c) => s + (c.revenue_this_month || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Channel Manager</h1>
        <p className="text-sm text-[#64748B] mt-1">Monitor and sync availability across booking platforms</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Connected Channels', value: connectedCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Channels', value: channels.length, color: 'text-[#123B63]', bg: 'bg-blue-50' },
          { label: 'Bookings (Month)', value: totalBookings, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Channel Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <Globe className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-[#17212B]">{s.value}</p>
            <p className="text-xs text-[#64748B]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => {
          const config = statusConfig[channel.status] || statusConfig.disconnected;
          const StatusIcon = config.icon;
          const isSyncing = channel.status === 'syncing' || syncingId === channel.id;
          return (
            <div key={channel.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Plug className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#17212B]">{channel.channel_name}</h3>
                    <p className="text-xs text-[#64748B] capitalize">{channel.channel_type}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing' : config.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-[#F6F8FB] rounded-lg">
                  <p className="text-sm font-bold text-[#17212B]">{channel.rooms_mapped}</p>
                  <p className="text-[10px] text-[#64748B]">Rooms</p>
                </div>
                <div className="text-center p-2 bg-[#F6F8FB] rounded-lg">
                  <p className="text-sm font-bold text-[#17212B]">{channel.bookings_this_month}</p>
                  <p className="text-[10px] text-[#64748B]">Bookings</p>
                </div>
                <div className="text-center p-2 bg-[#F6F8FB] rounded-lg">
                  <p className="text-sm font-bold text-[#17212B]">${(channel.revenue_this_month || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-[#64748B]">Revenue</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Last sync: {channel.last_sync ? new Date(channel.last_sync).toLocaleString() : 'Never'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConnect(channel.id, channel.status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      channel.status === 'connected'
                        ? 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F6F8FB]'
                        : 'bg-[#123B63] text-white hover:bg-[#1F5A8A]'
                    }`}
                  >
                    {channel.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                  {channel.status === 'connected' && (
                    <button
                      onClick={() => handleSync(channel.id)}
                      disabled={isSyncing}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[#E2E8F0] text-xs font-medium rounded-lg text-[#123B63] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}