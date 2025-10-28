import { SpinResult } from '../types.js';

interface SpinHistoryProps {
  spins: SpinResult[];
}

export function SpinHistory({ spins }: SpinHistoryProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-inner shadow-black/50">
      <h3 className="text-lg font-semibold text-white">Recent spins</h3>
      <p className="mt-1 text-sm text-slate-400">The latest 20 results are stored here for quick reference.</p>
      <div className="mt-4 space-y-3">
        {spins.length === 0 ? (
          <p className="text-sm text-slate-500">No spins yet. Hit the button to see the wheel in action!</p>
        ) : (
          <ul className="space-y-2">
            {spins.map((spin) => (
              <li
                key={spin.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                <span className="font-semibold text-white">{spin.label}</span>
                <span className="text-xs text-slate-400">
                  {new Date(spin.timestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
