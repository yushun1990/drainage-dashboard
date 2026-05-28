import type { KpiMetric } from '../../types/drainage'

interface KpiStripProps {
  metrics: KpiMetric[]
}

const statusClassName: Record<KpiMetric['status'], string> = {
  healthy: 'border-cyan-200/55 text-cyan-50',
  warning: 'border-amber-200/60 text-amber-50',
  critical: 'border-red-200/65 text-red-50',
}

export function KpiStrip({ metrics }: KpiStripProps) {
  return (
    <section
      className="flex flex-wrap justify-center gap-3"
      aria-label="核心指标"
    >
      {metrics.map((metric) => (
        <article
          className={`w-fit min-w-40 rounded border bg-[#064466]/76 px-4 py-3 shadow-[0_0_24px_rgba(56,189,248,0.24),inset_0_0_18px_rgba(14,165,233,0.12)] backdrop-blur-sm ${statusClassName[metric.status]}`}
          key={metric.id}
        >
          <p className="text-xs text-cyan-100/80">{metric.label}</p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-2xl font-semibold leading-none">
              {metric.value}
            </strong>
            {metric.unit ? (
              <span className="text-xs text-cyan-100/80">{metric.unit}</span>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
