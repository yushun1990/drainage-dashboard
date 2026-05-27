import type { MapLayerSummary } from '../../types/drainage'

interface MapViewportProps {
  layers: MapLayerSummary[]
  className?: string
  showChrome?: boolean
}

const layerStatusClassName: Record<MapLayerSummary['status'], string> = {
  healthy: 'text-cyan-100',
  warning: 'text-amber-100',
  critical: 'text-red-100',
}

export function MapViewport({
  className = '',
  layers,
  showChrome = true,
}: MapViewportProps) {
  return (
    <section
      className={`relative h-full overflow-hidden bg-[#032c43] shadow-[inset_0_0_140px_rgba(2,6,23,0.62),inset_0_0_80px_rgba(2,132,199,0.14)] ${
        showChrome
          ? 'rounded border border-cyan-200/35 shadow-[0_0_36px_rgba(56,189,248,0.24),inset_0_0_70px_rgba(2,132,199,0.24)]'
          : ''
      } ${className}`}
      aria-label="GIS 地图占位"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(14,165,233,0.22),transparent_22%),linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.08)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
      <div className="absolute inset-0 bg-[linear-gradient(118deg,transparent_0_18%,rgba(2,132,199,0.2)_18%_22%,transparent_22%_58%,rgba(14,165,233,0.18)_58%_61%,transparent_61%)]" />
      <div className="absolute inset-10 rounded-full border border-cyan-100/12" />
      <div className="absolute left-[-8%] top-[58%] h-16 w-[120%] rotate-[-10deg] rounded-full bg-cyan-400/34 blur-[1px] shadow-[0_0_24px_rgba(34,211,238,0.42)]" />
      <div className="absolute left-[18%] top-[42%] h-1.5 w-[64%] rotate-[-8deg] rounded-full bg-cyan-100/62 shadow-[0_0_14px_rgba(186,230,253,0.58)]" />
      <div className="absolute left-[34%] top-[30%] h-1.5 w-[42%] rotate-[24deg] rounded-full bg-slate-100/52 shadow-[0_0_10px_rgba(226,232,240,0.36)]" />
      <div className="absolute left-[48%] top-[20%] h-[52%] w-1.5 rotate-[11deg] rounded-full bg-cyan-100/54 shadow-[0_0_12px_rgba(125,211,252,0.44)]" />
      <div className="absolute right-[24%] top-[32%] h-24 w-32 rounded border border-red-200/55 bg-red-500/12 shadow-[0_0_20px_rgba(248,113,113,0.34)]" />

      {showChrome ? (
        <div className="absolute left-5 top-5 rounded border border-cyan-100/35 bg-[#053852]/75 p-4 shadow-[0_0_22px_rgba(56,189,248,0.28)] backdrop-blur-sm">
          <p className="text-xs text-cyan-100/75">MapLibre GL JS 接入位</p>
          <h2 className="mt-1 text-base font-semibold text-white drop-shadow-[0_0_8px_rgba(125,211,252,0.65)]">
            管网 GIS 主视图
          </h2>
        </div>
      ) : null}

      {showChrome ? (
        <div className="absolute bottom-5 right-5 grid grid-cols-2 gap-2">
          {layers.map((layer) => (
            <div
              className={`rounded border border-cyan-100/30 bg-[#053852]/75 px-3 py-2 text-xs shadow-[0_0_16px_rgba(34,211,238,0.18)] ${layerStatusClassName[layer.status]}`}
              key={layer.id}
            >
              <span className="text-cyan-100/70">{layer.label}</span>
              <strong className="ml-2 text-sm">{layer.count}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
