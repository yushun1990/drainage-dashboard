import { useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useMapLibre } from '../../hooks/useMapLibre'
import type { DrainageMapDataset, MapLayerSummary } from '../../types/drainage'
import type { FeatureCollection } from 'geojson'

interface MapViewportProps {
  dataset: DrainageMapDataset
  layers: MapLayerSummary[]
  className?: string
  showChrome?: boolean
  interactive?: boolean
  districtAreas?: FeatureCollection
  showFocusMask?: boolean
  onMapReady?: (map: maplibregl.Map, toggleFocusMask: (show: boolean) => void) => void
}

const layerStatusClassName: Record<MapLayerSummary['status'], string> = {
  healthy: 'text-cyan-100',
  warning: 'text-amber-100',
  critical: 'text-red-100',
}

export function MapViewport({
  className = '',
  dataset,
  interactive = true,
  layers,
  showChrome = true,
  districtAreas,
  showFocusMask = true,
  onMapReady,
}: MapViewportProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useMapLibre({
    containerRef: mapContainerRef,
    dataset,
    interactive,
    districtAreas,
    showFocusMask,
    onMapReady,
  })

  return (
    <section
      className={`relative h-full w-full overflow-hidden bg-[#032c43] shadow-[inset_0_0_140px_rgba(2,6,23,0.62),inset_0_0_80px_rgba(2,132,199,0.14)] ${
        showChrome
          ? 'rounded border border-cyan-200/35 shadow-[0_0_36px_rgba(56,189,248,0.24),inset_0_0_70px_rgba(2,132,199,0.24)]'
          : ''
      } ${className}`}
      aria-label="汾口镇排水管网 GIS 地图"
    >
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {showChrome ? (
        <div className="absolute left-5 top-5 rounded border border-cyan-100/35 bg-[#053852]/75 p-4 shadow-[0_0_22px_rgba(56,189,248,0.28)] backdrop-blur-sm">
          <p className="text-xs text-cyan-100/75">浙江省杭州市淳安县汾口镇</p>
          <h2 className="mt-1 text-base font-semibold text-white drop-shadow-[0_0_8px_rgba(125,211,252,0.65)]">
            管网 GIS 主视图
          </h2>
          <p className="mt-2 text-[11px] text-cyan-100/62">
            WGS84 {dataset.center[0].toFixed(4)}, {dataset.center[1].toFixed(4)}
          </p>
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
