
import React from 'react';

interface LiveStatusCardProps {
  pending: number;
  confirmed: number;
  completed: number;
  liveTick: number;
}

export const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  pending,
  confirmed,
  completed,
  liveTick
}) => {
  return (
    <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70 mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        Live Booking Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-400">{pending}</p>
            </div>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-amber-400">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">{confirmed}</p>
            </div>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-blue-400">{completed}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">🎉</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${liveTick % 2 === 0 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
        Auto-refreshes every 30 seconds
      </div>
    </section>
  );
};
