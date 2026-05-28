import type { DrainageAlarm } from '../../types/drainage'

interface AlarmTickerProps {
  alarms: DrainageAlarm[]
  variant?: 'bar' | 'card'
}

const levelLabel: Record<DrainageAlarm['level'], string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const levelTone: Record<
  DrainageAlarm['level'],
  {
    card: string
    bar: string
    badge: string
    title: string
    message: string
    dot: string
  }
> = {
  low: {
    card: 'border-cyan-200/16 bg-cyan-950/22 shadow-[inset_0_0_12px_rgba(14,165,233,0.08)]',
    bar: 'border-cyan-200/16 bg-cyan-950/16',
    badge: 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100',
    title: 'text-cyan-50',
    message: 'text-cyan-50/86',
    dot: 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.42)]',
  },
  medium: {
    card: 'border-amber-300/24 bg-amber-500/10 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)]',
    bar: 'border-amber-300/24 bg-amber-500/8',
    badge: 'border-amber-300/30 bg-amber-500/14 text-amber-100',
    title: 'text-amber-50',
    message: 'text-amber-50/88',
    dot: 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  },
  high: {
    card: 'border-red-300/34 bg-red-500/14 shadow-[0_0_18px_rgba(239,68,68,0.16),inset_0_0_14px_rgba(239,68,68,0.12)]',
    bar: 'border-red-300/34 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.1)]',
    badge: 'border-red-300/34 bg-red-500/18 text-red-100 shadow-[0_0_10px_rgba(248,113,113,0.18)]',
    title: 'text-red-50',
    message: 'text-red-50/92',
    dot: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.72)]',
  },
}

export function AlarmTicker({ alarms, variant = 'bar' }: AlarmTickerProps) {
  if (variant === 'card') {
    const scrollingAlarms = [...alarms, ...alarms]

    return (
      <section
        className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-cyan-200/28 bg-[#053452]/48 p-4 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm"
        aria-label="实时告警"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-cyan-50">实时告警</h2>
          <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.72)]" />
        </div>
        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
          <div className="alarm-scroll-y flex flex-col gap-2">
            {scrollingAlarms.map((alarm, index) => (
              <article
                className={`rounded border px-2.5 py-1.5 text-[11px] leading-4 ${levelTone[alarm.level].card}`}
                key={`${alarm.id}-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-cyan-100/70">{alarm.time}</span>
                      <span className={`min-w-0 truncate font-medium ${levelTone[alarm.level].title}`}>
                        {alarm.location}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${levelTone[alarm.level].badge}`}
                  >
                    <span
                      className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${levelTone[alarm.level].dot}`}
                    />
                    {levelLabel[alarm.level]}
                  </span>
                </div>
                <p className={`mt-0.5 line-clamp-1 ${levelTone[alarm.level].message}`}>
                  {alarm.message}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="flex h-16 items-center gap-4 overflow-hidden rounded border border-cyan-200/28 bg-[#053452]/46 px-5 shadow-[0_0_22px_rgba(56,189,248,0.16),inset_0_0_16px_rgba(14,165,233,0.1)] backdrop-blur-sm"
      aria-label="实时告警"
    >
      <h2 className="shrink-0 text-sm font-medium text-cyan-50">实时告警</h2>
      <div className="flex min-w-0 flex-1 gap-4">
        {alarms.map((alarm) => (
          <article
            className={`min-w-[280px] rounded border px-3 py-2 text-xs ${levelTone[alarm.level].bar}`}
            key={alarm.id}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-cyan-100/70">{alarm.time}</span>
                  <span className={`min-w-0 truncate font-medium ${levelTone[alarm.level].title}`}>
                    {alarm.location}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${levelTone[alarm.level].badge}`}
              >
                <span
                  className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${levelTone[alarm.level].dot}`}
                />
                {levelLabel[alarm.level]}
              </span>
            </div>
            <span className={`mt-0.5 block ${levelTone[alarm.level].message}`}>
              {alarm.message}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
