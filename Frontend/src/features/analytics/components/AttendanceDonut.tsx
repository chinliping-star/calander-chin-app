import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  attended: number;
  missed: number;
  skipped: number;
  score: number;
}

const SLICES = [
  { key: 'Attended', color: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  { key: 'Missed',   color: '#f43f5e', bg: '#ffe4e6', text: '#be123c' },
  { key: 'Skipped',  color: '#f59e0b', bg: '#fef3c7', text: '#b45309' },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const s = SLICES.find(x => x.key === payload[0].name);
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold" style={{ color: s?.text ?? 'var(--text-h)' }}>{payload[0].name}</p>
      <p className="text-base font-bold" style={{ color: s?.color ?? 'var(--text-h)' }}>{payload[0].value}</p>
    </div>
  );
}

export function AttendanceDonut({ attended, missed, skipped, score }: Props) {
  const total = attended + missed + skipped;
  const hasData = total > 0;

  const data = [
    { name: 'Attended', value: attended },
    { name: 'Missed',   value: missed   },
    { name: 'Skipped',  value: skipped  },
  ].filter(d => d.value > 0);

  const scoreStyle = score >= 80
    ? { bg: '#dcfce7', color: '#15803d' }
    : score >= 50
    ? { bg: '#fef3c7', color: '#b45309' }
    : { bg: '#ffe4e6', color: '#be123c' };

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', boxShadow: '0 2px 12px rgba(74,62,78,0.06)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Attendance</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{total} total meetups</p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: scoreStyle.bg, color: scoreStyle.color }}
        >
          {score}% reliable
        </span>
      </div>

      {hasData ? (
        <div className="relative [&_*]:outline-none [&_.recharts-sector]:outline-none [&_svg]:focus:outline-none">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={SLICES.find(s => s.key === d.name)?.color ?? '#ccc'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-3xl font-bold" style={{ color: 'var(--text-h)' }}>{attended}</p>
            <p className="text-xs" style={{ color: 'var(--text)' }}>attended</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl" style={{ height: 220, background: 'var(--color-neutral)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>No meetup data yet</p>
        </div>
      )}

      {/* Custom legend */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Attended', value: attended, ...SLICES[0] },
          { label: 'Missed',   value: missed,   ...SLICES[1] },
          { label: 'Skipped',  value: skipped,  ...SLICES[2] },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: s.bg }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-medium" style={{ color: s.text }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
