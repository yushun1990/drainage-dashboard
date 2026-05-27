import type { PanelSummary } from '../../types/drainage'

interface PanelPlaceholderProps {
  panels: PanelSummary[]
}

const statusDotClassName: Record<PanelSummary['status'], string> = {
  healthy: 'bg-cyan-300',
  warning: 'bg-amber-300',
  critical: 'bg-red-400',
}

export function PanelPlaceholder({ panels }: PanelPlaceholderProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      {panels.map((panel) => (
        <article
          className="min-h-0 flex-1 rounded border border-cyan-200/35 bg-[#063b5c]/70 p-4 shadow-[0_0_30px_rgba(56,189,248,0.22),inset_0_0_22px_rgba(8,145,178,0.16)] backdrop-blur-sm"
          key={panel.id}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-cyan-50">{panel.title}</h2>
            <span
              className={`h-2 w-2 rounded-full ${statusDotClassName[panel.status]}`}
            />
          </div>
          <p className="mt-3 text-xl font-semibold text-white drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]">
            {panel.metric}
          </p>
          <div className="mt-4 flex h-20 items-center justify-center rounded border border-dashed border-cyan-100/35 bg-cyan-500/10 text-xs text-cyan-100/70">
            {panel.description}
          </div>
        </article>
      ))}
    </div>
  )
}
