import type { DrainageAlarm } from '../../types/drainage'

interface AlarmTickerProps {
  alarms: DrainageAlarm[]
}

const levelClassName: Record<DrainageAlarm['level'], string> = {
  info: 'text-cyan-100',
  warning: 'text-amber-100',
  critical: 'text-red-100',
}

export function AlarmTicker({ alarms }: AlarmTickerProps) {
  return (
    <section
      className="flex h-16 items-center gap-4 overflow-hidden rounded border border-cyan-200/35 bg-[#063b5c]/75 px-5 shadow-[0_0_28px_rgba(56,189,248,0.22),inset_0_0_18px_rgba(14,165,233,0.12)]"
      aria-label="实时告警"
    >
      <h2 className="shrink-0 text-sm font-medium text-cyan-50">实时告警</h2>
      <div className="flex min-w-0 flex-1 gap-4">
        {alarms.map((alarm) => (
          <article
            className="min-w-[280px] rounded border border-cyan-200/15 bg-cyan-950/30 px-3 py-2 text-xs"
            key={alarm.id}
          >
            <span className="text-cyan-100/70">{alarm.time}</span>
            <span className={`ml-2 font-medium ${levelClassName[alarm.level]}`}>
              {alarm.location}
            </span>
            <span className="ml-2 text-cyan-50/90">{alarm.message}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
