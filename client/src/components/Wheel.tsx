import { useEffect, useMemo, useRef, useState } from 'react';
import { WheelItem } from '../types.js';

interface WheelProps {
  items: WheelItem[];
  lastSpinItemId: string | null;
}

const colors = ['#22d3ee', '#8b5cf6', '#f97316', '#ef4444', '#10b981', '#6366f1'];

function computeSegments(items: WheelItem[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    return [];
  }
  let current = 0;
  return items.map((item, index) => {
    const start = current;
    const size = (item.weight / totalWeight) * 360;
    current += size;
    return {
      id: item.id,
      label: item.label,
      start,
      size,
      color: colors[index % colors.length],
    };
  });
}

export function Wheel({ items, lastSpinItemId }: WheelProps) {
  const segments = useMemo(() => computeSegments(items), [items]);
  const [rotation, setRotation] = useState(0);
  const [spun, setSpun] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!segments.length) {
      setRotation(0);
      setSpun(false);
      return;
    }

    const selectedIndex = segments.findIndex((segment) => segment.id === lastSpinItemId);
    if (selectedIndex === -1) {
      return;
    }

    const segment = segments[selectedIndex];
    const segmentCenter = segment.start + segment.size / 2;
    const randomSpins = Math.floor(Math.random() * 3) + 4; // 4-6 extra spins
    const targetRotation = randomSpins * 360 + (360 - segmentCenter);
    setSpun(true);
    requestAnimationFrame(() => setRotation(targetRotation));
  }, [lastSpinItemId, segments]);

  useEffect(() => {
    if (!lastSpinItemId) {
      setRotation(0);
      setSpun(false);
    }
  }, [lastSpinItemId]);

  useEffect(() => {
    if (!wheelRef.current) return;
    const node = wheelRef.current;
    const listener = () => {
      node.classList.add('animate-pulse');
      setTimeout(() => node.classList.remove('animate-pulse'), 800);
    };
    node.addEventListener('transitionend', listener);
    return () => node.removeEventListener('transitionend', listener);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
      <div className="relative flex h-72 w-72 items-center justify-center">
        <div
          ref={wheelRef}
          className="relative h-full w-full rounded-full transition-[transform] duration-[3200ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: segments.length
              ? `conic-gradient(${segments
                  .map((segment) => `${segment.color} ${segment.start}deg ${segment.start + segment.size}deg`)
                  .join(',')})`
              : 'radial-gradient(circle at center, rgba(148, 163, 184, 0.4), rgba(30, 41, 59, 0.2))',
          }}
        >
          {segments.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
              Add items to spin the wheel
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute top-2 flex flex-col items-center gap-2">
          <div className="h-12 w-8 -translate-y-2 rounded-b-full bg-gradient-to-b from-yellow-400 via-orange-500 to-pink-500" />
          <div className="h-0 w-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-yellow-300" />
        </div>
      </div>
      <div className="w-full text-center">
        {segments.length > 0 ? (
          <>
            <p className="text-sm uppercase tracking-widest text-slate-400">Segments</p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    {segment.label}
                  </span>
                  <span className="text-xs text-slate-400">{segment.size.toFixed(0)}°</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No segments yet.</p>
        )}
      </div>
      {spun && lastSpinItemId && (
        <div className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-emerald-200">
          🎉 Winner selected! Check the history for details.
        </div>
      )}
    </div>
  );
}
