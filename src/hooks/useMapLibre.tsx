import { useEffect, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Polygon } from 'geojson'
import type { MutableRefObject, RefObject } from 'react'
import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  LngLatBoundsLike,
} from 'maplibre-gl'
import type {
  Coordinate,
  DrainageMapDataset,
  DrainageMapPoint,
} from '../types/drainage'
import { buildDrainageGeoJson } from '../utils/buildDrainageGeoJson'
import type { DistrictData } from '../utils/districtUtils'
import { dailyRainRatioTrendValues } from '../data/mockDrainageData'
import { SiteMixingPopup } from '../components/map/SiteMixingPopup'
import { DistrictInflowPopup } from '../components/map/DistrictInflowPopup'
import { DistrictSiltationPopup } from '../components/map/DistrictSiltationPopup'
import { DailyRainRatioChart } from '../components/dashboard/DailyRainRatioChart'

interface UseMapLibreOptions {
  containerRef: RefObject<HTMLDivElement | null>
  dataset: DrainageMapDataset
  interactive?: boolean
  districtAreas?: FeatureCollection
  showFocusMask?: boolean
  onMapReady?: (map: maplibregl.Map, toggleFocusMask: (show: boolean) => void) => void
}

interface MutableGeoJsonSource {
  setData: (data: FeatureCollection) => void
}

const pipeSourceId = 'drainage-pipes'
const pipeFlowLayerId = 'pipe-flow'
const pointSourceId = 'drainage-points'
const riskAreaSourceId = 'drainage-risk-areas'
const districtSourceId = 'district-areas'
const siltationSourceId = 'siltation-area'
const siltationLayerId = 'siltation-blink'
const inflowInfiltrationSourceId = 'inflow-infiltration-area'
const inflowInfiltrationLayerId = 'inflow-infiltration-blink'
const rainAlertSourceId = 'rain-alert-area'
const rainAlertLayerId = 'rain-alert-effect'
const waterwaySourceId = 'fenkou-waterways'
const fenkouFocusSourceId = 'fenkou-focus'
const tiandituVectorSourceId = 'tianditu-vector-raster'
const tiandituVectorLayerId = 'tianditu-vector-raster'
const tiandituLabelSourceId = 'tianditu-label-raster'
const tiandituLabelLayerId = 'tianditu-label-raster'
const initialZoom = 14
const pointMinZoom = 16.01
const mapPitch = 58
const mapBearing = 0
const fiordStyleUrl = 'https://tiles.openfreemap.org/styles/fiord'
const tiandituMinZoom = 14
const tiandituDetailZoomThreshold = 16
const tiandituToken = '5ce9baeca773fde9739ec866f9e117f3'
const siteMarkerMinScale = 0.46
const siteMarkerMaxScale = 1
const siteMarkerMinScaleZoom = 13
const siteMarkerMaxScaleZoom = 16
const siteMarkerMinVisibleZoom = 14.3
const siteMarkerShowAllZoom = 15.3
const mixingAlarmSiteIds = new Set(['site-133', 'site-155'])
const pipeFlowDurationMs = 2600
const blinkDurationMs = 2000

type PopupAnchor =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

interface PopupPlacement {
  anchor: PopupAnchor
  offset: number
}

interface PopupPlacementOptions {
  preferredAnchors?: PopupAnchor[]
}

const fenkouMaxBounds: LngLatBoundsLike = [
  [118.4086, 29.2906],
  [118.7286, 29.5628],
]

function isMutableGeoJsonSource(source: unknown): source is MutableGeoJsonSource {
  if (typeof source !== 'object' || source === null || !('setData' in source)) {
    return false
  }

  return typeof (source as { setData?: unknown }).setData === 'function'
}

function updateGeoJsonSource(
  map: maplibregl.Map,
  sourceId: string,
  data: FeatureCollection,
) {
  const source = map.getSource(sourceId)

  if (isMutableGeoJsonSource(source)) {
    source.setData(data)
  }
}

function buildPopupPlacement(
  map: maplibregl.Map,
  lngLat: maplibregl.LngLatLike,
  popupSize: { width: number; height: number },
  options: PopupPlacementOptions = {},
): PopupPlacement {
  const point = map.project(lngLat)
  const canvas = map.getCanvas()
  const edgePadding = 24
  const offset = 14
  const anchors: PopupAnchor[] = [
    ...(options.preferredAnchors ?? []),
    'bottom',
    'top',
    'right',
    'left',
    'bottom-right',
    'bottom-left',
    'top-right',
    'top-left',
  ]
  const uniqueAnchors = anchors.filter((anchor, index) => anchors.indexOf(anchor) === index)

  const buildRect = (anchor: PopupAnchor) => {
    const width = popupSize.width
    const height = popupSize.height
    const horizontalCenter = point.x - width / 2
    const verticalCenter = point.y - height / 2

    switch (anchor) {
      case 'top':
        return { left: horizontalCenter, top: point.y + offset, right: horizontalCenter + width, bottom: point.y + offset + height }
      case 'left':
        return { left: point.x + offset, top: verticalCenter, right: point.x + offset + width, bottom: verticalCenter + height }
      case 'right':
        return { left: point.x - offset - width, top: verticalCenter, right: point.x - offset, bottom: verticalCenter + height }
      case 'top-left':
        return { left: point.x + offset, top: point.y + offset, right: point.x + offset + width, bottom: point.y + offset + height }
      case 'top-right':
        return { left: point.x - offset - width, top: point.y + offset, right: point.x - offset, bottom: point.y + offset + height }
      case 'bottom-left':
        return { left: point.x + offset, top: point.y - offset - height, right: point.x + offset + width, bottom: point.y - offset }
      case 'bottom-right':
        return { left: point.x - offset - width, top: point.y - offset - height, right: point.x - offset, bottom: point.y - offset }
      case 'bottom':
      default:
        return { left: horizontalCenter, top: point.y - offset - height, right: horizontalCenter + width, bottom: point.y - offset }
    }
  }

  const viewport = {
    left: edgePadding,
    top: edgePadding,
    right: canvas.clientWidth - edgePadding,
    bottom: canvas.clientHeight - edgePadding,
  }

  const placements = uniqueAnchors.map((anchor, index) => {
    const rect = buildRect(anchor)
    const visibleWidth = Math.max(
      0,
      Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left),
    )
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top),
    )
    const clippedDistance =
      Math.max(viewport.left - rect.left, 0) +
      Math.max(rect.right - viewport.right, 0) +
      Math.max(viewport.top - rect.top, 0) +
      Math.max(rect.bottom - viewport.bottom, 0)

    return {
      anchor,
      index,
      score: visibleWidth * visibleHeight - clippedDistance * 120 - index,
    }
  })

  const bestPlacement = placements.reduce((best, placement) =>
    placement.score > best.score ? placement : best,
  )

  return { anchor: bestPlacement.anchor, offset }
}

function hasSiteIcon(point: DrainageMapPoint): boolean {
  return Boolean(point.normalIconUrl && point.alarmIconUrl)
}

function buildSiteMarkerElement(point: DrainageMapPoint): HTMLElement {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = 'site-map-marker h-9 w-9'
  marker.setAttribute('aria-label', point.name)

  const shell = document.createElement('span')
  shell.className =
    'site-map-marker-shell flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-cyan-100/65 bg-slate-950/30 shadow-[0_0_14px_rgba(34,211,238,0.52)] backdrop-blur-sm'

  const image = document.createElement('img')
  image.src =
    point.status === 'critical' && point.alarmIconUrl
      ? point.alarmIconUrl
      : point.normalIconUrl ?? ''
  image.alt = ''
  image.className = 'h-8 w-8 scale-125 object-contain'
  image.draggable = false

  if (point.status === 'critical') {
    shell.classList.add('site-map-marker-alarm')
  }

  shell.append(image)
  marker.append(shell)

  return marker
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildSiteMarkerScale(zoom: number): number {
  const progress =
    (zoom - siteMarkerMinScaleZoom) /
    (siteMarkerMaxScaleZoom - siteMarkerMinScaleZoom)

  return (
    siteMarkerMinScale +
    clamp(progress, 0, 1) * (siteMarkerMaxScale - siteMarkerMinScale)
  )
}

function updateSiteMarkerScale(
  map: maplibregl.Map,
  markers: maplibregl.Marker[],
) {
  const zoom = map.getZoom()
  const isVisible = zoom >= siteMarkerMinVisibleZoom
  const shouldShowAll = zoom >= siteMarkerShowAllZoom
  const scale = buildSiteMarkerScale(map.getZoom())

  for (const marker of markers) {
    const element = marker.getElement()
    element.style.setProperty('--site-marker-scale', String(scale))
    const isAlarm = element.dataset.siteStatus === 'critical'
    element.style.display = isAlarm || (isVisible && shouldShowAll) ? 'block' : 'none'
  }
}

function buildSitePopupContent(point: DrainageMapPoint): HTMLElement {
  // 雨污混接预警站点：渲染包含图表的弹窗
  if (mixingAlarmSiteIds.has(point.id)) {
    const wrapper = document.createElement('div')
    wrapper.className = 'drainage-mixing-popup'

    // 使用 React 在弹窗中渲染图表
    const root = createRoot(wrapper)
    root.render(<SiteMixingPopup siteId={point.id} />)

    return wrapper
  }

  // 其他站点：渲染简单信息弹窗
  const wrapper = document.createElement('div')
  wrapper.className = 'min-w-[200px] text-cyan-50'

  // Header
  const header = document.createElement('div')
  header.className = 'px-4 py-2 border-b border-cyan-500/20 bg-cyan-950/95'

  const title = document.createElement('h3')
  title.className = 'text-sm font-medium text-white'
  title.textContent = point.name

  header.append(title)

  // Body
  const body = document.createElement('div')
  body.className = 'p-4 space-y-2 bg-cyan-500/20'

  const idItem = createInfoItem('编号', point.id.replace(/^site-/, ''))
  const addressItem = createInfoItem('地址', point.address || '暂无')
  const deviceItem = createInfoItem(
    '设备',
    point.deviceIds && point.deviceIds.length > 0 ? point.deviceIds.join('、') : '暂无',
  )

  body.append(idItem, addressItem, deviceItem)
  wrapper.append(header, body)

  return wrapper
}

function createInfoItem(label: string, value: string): HTMLElement {
  const item = document.createElement('div')
  item.className = 'flex items-center gap-2'

  const labelSpan = document.createElement('span')
  labelSpan.className = 'text-xs text-cyan-300/90 shrink-0'
  labelSpan.textContent = `${label}：`

  const valueSpan = document.createElement('span')
  valueSpan.className = 'text-xs text-cyan-100/80 truncate'
  valueSpan.textContent = value

  item.append(labelSpan, valueSpan)
  return item
}

function buildInflowPopupContent(districtId: string): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'drainage-inflow-popup'

  const root = createRoot(wrapper)
  root.render(<DistrictInflowPopup districtId={districtId} />)

  return wrapper
}

function buildSiltationPopupContent(districtId: string): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'drainage-siltation-popup'

  const root = createRoot(wrapper)
  root.render(<DistrictSiltationPopup districtId={districtId} />)

  return wrapper
}

function buildDistrictPopupContent(
  district: DistrictData,
  options: { showRainRatioTrend?: boolean; variant?: 'normal' | 'alert' } = {},
): HTMLElement {
  const showRainRatioTrend = options.showRainRatioTrend ?? true
  const variant = options.variant ?? 'normal'
  const wrapper = document.createElement('div')
  wrapper.className = showRainRatioTrend
    ? `${variant === 'alert' ? 'drainage-rain-alert-popup-panel' : 'drainage-district-popup-panel'} min-w-[360px] max-w-[420px] text-cyan-50`
    : 'min-w-[200px] text-cyan-50'

  const buildTag = (text: string, className: string) => {
    const tag = document.createElement('span')
    tag.className = `inline-flex h-6 items-center rounded border px-2 text-[10px] font-medium leading-none ${className}`
    tag.textContent = text
    return tag
  }

  const statusValue =
    variant === 'alert'
      ? '晴雨比异常'
      : district.status === 'warning'
        ? '警告'
        : district.status === 'critical'
          ? '异常'
          : '正常'
  const statusClass =
    variant === 'alert'
      ? 'border-red-400/50 bg-red-400/20 text-red-200'
      : district.status === 'warning'
        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
        : district.status === 'critical'
          ? 'border-red-400/40 bg-red-400/10 text-red-200'
          : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'

  // Header
  const header = document.createElement('div')
  header.className =
    variant === 'alert'
      ? 'flex items-start justify-between gap-2 border-b border-red-400/20 bg-gradient-to-r from-red-950/95 via-slate-950/95 to-cyan-950/95 px-4 py-2 pr-6'
      : 'flex items-start justify-between gap-2 border-b border-cyan-500/20 bg-cyan-950/95 px-4 py-2 pr-6'

  const title = document.createElement('h3')
  title.className = 'min-w-0 text-sm font-medium text-white'
  title.textContent = district.name

  const titleWrap = document.createElement('div')
  titleWrap.className = 'min-w-0'
  titleWrap.append(title)

  const tagWrap = document.createElement('div')
  tagWrap.className = 'min-w-0 pt-0.5'
  tagWrap.append(buildTag(statusValue, statusClass))

  header.append(titleWrap, tagWrap)

  wrapper.append(header)

  if (showRainRatioTrend && district.rainRatio !== undefined && district.rainRatio !== null) {
    const chartSection = document.createElement('div')
    chartSection.className =
      variant === 'alert'
        ? 'border-t border-red-400/10 bg-red-950/20 p-3'
        : 'border-t border-cyan-500/10 bg-cyan-950/45 p-3'

    const chartTitle = document.createElement('div')
    chartTitle.className = 'mb-2 flex items-center justify-between gap-2'

    const chartTitleText = document.createElement('span')
    chartTitleText.className =
      variant === 'alert' ? 'text-xs font-medium text-red-100' : 'text-xs font-medium text-cyan-100'
    chartTitleText.textContent = '最近一周晴雨比曲线'

    const chartRatio = document.createElement('span')
    chartRatio.className =
      variant === 'alert'
        ? 'rounded border border-red-400/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-100'
        : 'rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100'
    chartRatio.textContent = `当前 ${district.rainRatio.toFixed(2)}`

    chartTitle.append(chartTitleText, chartRatio)

    const chartHost = document.createElement('div')
    chartHost.className =
      variant === 'alert'
        ? 'h-[170px] w-full overflow-hidden rounded border border-red-400/10 bg-slate-950/35'
        : 'h-[150px] w-full overflow-hidden rounded border border-cyan-400/10 bg-cyan-950/35'

    const root = createRoot(chartHost)
    root.render(<DailyRainRatioChart data={dailyRainRatioTrendValues} className="h-full w-full" />)

    chartSection.append(chartTitle, chartHost)
    wrapper.append(chartSection)
  }

  return wrapper
}

function addMonitoringSiteMarkers(
  map: maplibregl.Map,
  points: DrainageMapPoint[],
  activePopupRef: MutableRefObject<maplibregl.Popup | null>,
  closeOtherPopups?: () => void,
): maplibregl.Marker[] {
  return points.filter(hasSiteIcon).map((point) => {
    const element = buildSiteMarkerElement(point)
    element.dataset.siteStatus = point.status
    const marker = new maplibregl.Marker({
      element,
      anchor: 'bottom',
      offset: [0, -6],
    })
      .setLngLat(point.coordinate)
      .addTo(map)

    element.style.setProperty('--site-marker-scale', String(buildSiteMarkerScale(map.getZoom())))
    updateSiteMarkerScale(map, [marker])

    element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      activePopupRef.current?.remove()
      closeOtherPopups?.()

      const isMixingAlarmSite = mixingAlarmSiteIds.has(point.id)
      const maxWidth = isMixingAlarmSite ? '440px' : '240px'
      const offset = isMixingAlarmSite ? 12 : 18

      const popup = new maplibregl.Popup({
        anchor: 'bottom',
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth,
        offset,
        className: isMixingAlarmSite ? 'drainage-mixing-popup-wrapper' : 'drainage-site-popup',
      })
        .setLngLat(point.coordinate)
        .setDOMContent(buildSitePopupContent(point))
        .addTo(map)

      activePopupRef.current = popup
    })

    return marker
  })
}

function buildPipeFlowGradient(phase: number): ExpressionSpecification {
  const base = 'rgba(8, 145, 178, 0)'
  const tail = 'rgba(6, 182, 212, 0.45)'
  const core = 'rgba(236, 254, 255, 1)'
  const stops = [
    { progress: 0, color: base },
    { progress: 1, color: base },
  ]

  for (const offset of [-1, 0, 1]) {
    const center = phase + offset

    for (const stop of [
      { progress: center - 0.14, color: base },
      { progress: center - 0.06, color: tail },
      { progress: center, color: core },
      { progress: center + 0.06, color: tail },
      { progress: center + 0.14, color: base },
    ]) {
      if (stop.progress > 0 && stop.progress < 1) {
        stops.push(stop)
      }
    }
  }

  return [
    'interpolate',
    ['linear'],
    ['line-progress'],
    ...stops
      .sort((left, right) => left.progress - right.progress)
      .flatMap((stop) => [stop.progress, stop.color]),
  ] as ExpressionSpecification
}

function buildFocusPolygon(boundary: Coordinate[]): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [boundary],
        },
      },
    ],
  }
}

function addFenkouFocusLayers(map: maplibregl.Map, boundary: Coordinate[]) {
  if (!map.getSource(fenkouFocusSourceId)) {
    map.addSource(fenkouFocusSourceId, {
      type: 'geojson',
      data: buildFocusPolygon(boundary),
    })
  }

  if (!map.getLayer('fenkou-focus-wall')) {
    map.addLayer({
      id: 'fenkou-focus-wall',
      type: 'fill-extrusion',
      source: fenkouFocusSourceId,
      paint: {
        'fill-extrusion-color': '#00e5ff',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          24,
          16,
          76,
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.24,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-outline-halo')) {
    map.addLayer({
      id: 'fenkou-focus-outline-halo',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': '#00f5ff',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          18,
          16,
          30,
        ],
        'line-opacity': 0.46,
        'line-blur': 8,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-outline-glow')) {
    map.addLayer({
      id: 'fenkou-focus-outline-glow',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': '#22d3ee',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          7,
          16,
          12,
        ],
        'line-opacity': 0.9,
        'line-blur': 2.2,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-outline')) {
    map.addLayer({
      id: 'fenkou-focus-outline',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': '#ecfeff',
        'line-width': 2.2,
        'line-opacity': 1,
      },
    })
  }
}

function addWaterwayLayers(
  map: maplibregl.Map,
  dataset: ReturnType<typeof buildDrainageGeoJson>,
) {
  map.addSource(waterwaySourceId, {
    type: 'geojson',
    data: dataset.waterways,
  })

  map.addLayer({
    id: 'waterway-glow',
    type: 'line',
    source: waterwaySourceId,
    paint: {
      'line-color': '#38bdf8',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        7,
        15,
        15,
      ],
      'line-opacity': 0.3,
      'line-blur': 5,
    },
  })

  map.addLayer({
    id: 'waterway-core',
    type: 'line',
    source: waterwaySourceId,
    paint: {
      'line-color': '#0ea5e9',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        2.2,
        15,
        6,
      ],
      'line-opacity': 0.82,
    },
  })
}

function findVectorSourceId(map: maplibregl.Map): string | undefined {
  return Object.entries(map.getStyle().sources).find(
    ([, source]) => source.type === 'vector',
  )?.[0]
}

function findFirstSymbolLayerId(map: maplibregl.Map): string | undefined {
  return map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id
}

function buildTiandituWmtsUrl(layer: 'vec' | 'cva'): string {
  return `https://t0.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tiandituToken}`
}

function addTiandituDetailLayers(map: maplibregl.Map) {
  if (
    map.getSource(tiandituVectorSourceId) ||
    map.getLayer(tiandituVectorLayerId)
  ) {
    return
  }

  map.addSource(tiandituVectorSourceId, {
    type: 'raster',
    tiles: [buildTiandituWmtsUrl('vec')],
    tileSize: 256,
    minzoom: tiandituMinZoom,
    maxzoom: 18,
    attribution: '© 天地图',
  })
  map.addSource(tiandituLabelSourceId, {
    type: 'raster',
    tiles: [buildTiandituWmtsUrl('cva')],
    tileSize: 256,
    minzoom: tiandituMinZoom,
    maxzoom: 18,
    attribution: '© 天地图',
  })

  const beforeLayerId = findFirstSymbolLayerId(map)

  map.addLayer(
    {
      id: tiandituVectorLayerId,
      type: 'raster',
      source: tiandituVectorSourceId,
      minzoom: tiandituMinZoom,
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          14.7,
          0.28,
          16,
          0.42,
          17,
          0.5,
        ],
        'raster-saturation': -0.6,
        'raster-contrast': 0.1,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.5,
        'raster-hue-rotate': -10,
      },
    },
    beforeLayerId,
  )
  map.addLayer(
    {
      id: tiandituLabelLayerId,
      type: 'raster',
      source: tiandituLabelSourceId,
      minzoom: tiandituMinZoom,
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          14.7,
          0.35,
          16,
          0.55,
          17,
          0.65,
        ],
        'raster-saturation': -0.5,
        'raster-contrast': 0.05,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.6,
        'raster-hue-rotate': -8,
      },
    },
    beforeLayerId,
  )
}

function removeTiandituDetailLayers(map: maplibregl.Map) {
  if (map.getLayer(tiandituLabelLayerId)) {
    map.removeLayer(tiandituLabelLayerId)
  }
  if (map.getLayer(tiandituVectorLayerId)) {
    map.removeLayer(tiandituVectorLayerId)
  }
  if (map.getSource(tiandituLabelSourceId)) {
    map.removeSource(tiandituLabelSourceId)
  }
  if (map.getSource(tiandituVectorSourceId)) {
    map.removeSource(tiandituVectorSourceId)
  }
}

function syncTiandituDetailLayers(map: maplibregl.Map, showFocusMask: boolean) {
  if (!map.isStyleLoaded()) {
    return
  }

  if (showFocusMask && map.getZoom() > tiandituDetailZoomThreshold) {
    addTiandituDetailLayers(map)
    return
  }

  removeTiandituDetailLayers(map)
}

function addBuildingExtrusionLayer(map: maplibregl.Map) {
  const vectorSourceId = findVectorSourceId(map)

  if (!vectorSourceId || map.getLayer('fenkou-building-extrusion')) {
    return
  }

  const layer: FillExtrusionLayerSpecification = {
    id: 'fenkou-building-extrusion',
    type: 'fill-extrusion',
    source: vectorSourceId,
    'source-layer': 'building',
    minzoom: 13.5,
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.5,
        '#24384d',
        16,
        '#74a9c8',
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.5,
        0,
        15.5,
        [
          'coalesce',
          ['to-number', ['get', 'render_height']],
          ['to-number', ['get', 'height']],
          ['*', ['to-number', ['get', 'building:levels']], 3],
          18,
        ],
      ],
      'fill-extrusion-base': [
        'coalesce',
        ['to-number', ['get', 'render_min_height']],
        ['to-number', ['get', 'min_height']],
        0,
      ],
      'fill-extrusion-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.5,
        0.22,
        16,
        0.58,
      ],
    },
  }

  map.addLayer(layer, findFirstSymbolLayerId(map))
}

function addDrainageLayers(
  map: maplibregl.Map,
  dataset: ReturnType<typeof buildDrainageGeoJson>,
) {
  map.addSource(riskAreaSourceId, {
    type: 'geojson',
    data: dataset.riskAreas,
  })
  map.addSource(pipeSourceId, {
    type: 'geojson',
    data: dataset.pipes,
    lineMetrics: true,
  })
  map.addSource(pointSourceId, {
    type: 'geojson',
    data: dataset.points,
  })

  map.addLayer({
    id: 'risk-area-fill',
    type: 'fill',
    source: riskAreaSourceId,
    paint: {
      'fill-color': [
        'match',
        ['get', 'status'],
        'critical',
        '#ef4444',
        'warning',
        '#f59e0b',
        '#38bdf8',
      ],
      'fill-opacity': [
        'match',
        ['get', 'status'],
        'critical',
        0.24,
        'warning',
        0.18,
        0.12,
      ],
    },
  })

  map.addLayer({
    id: 'risk-area-outline',
    type: 'line',
    source: riskAreaSourceId,
    paint: {
      'line-color': [
        'match',
        ['get', 'status'],
        'critical',
        '#fca5a5',
        'warning',
        '#fbbf24',
        '#67e8f9',
      ],
      'line-width': 2,
      'line-opacity': 0.86,
      'line-blur': 0.4,
    },
  })

  map.addLayer({
    id: 'pipe-glow',
    type: 'line',
    source: pipeSourceId,
    paint: {
      'line-color': [
        'match',
        ['get', 'category'],
        'rainwater',
        '#0891b2',
        '#475569',
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        6,
        15,
        14,
      ],
      'line-opacity': 0.26,
      'line-blur': 5,
    },
  })

  map.addLayer({
    id: 'pipe-core',
    type: 'line',
    source: pipeSourceId,
    paint: {
      'line-color': [
        'match',
        ['get', 'category'],
        'rainwater',
        '#06b6d4',
        '#334155',
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        2.8,
        15,
        7,
      ],
      'line-opacity': [
        'match',
        ['get', 'status'],
        'critical',
        1,
        'warning',
        0.92,
        0.78,
      ],
    },
  })

  map.addLayer({
    id: pipeFlowLayerId,
    type: 'line',
    source: pipeSourceId,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-gradient': buildPipeFlowGradient(0),
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        2,
        15,
        4.8,
      ],
      'line-opacity': 0.92,
      'line-blur': 0.1,
    },
  })

  map.addLayer({
    id: 'pipe-alert',
    type: 'line',
    source: pipeSourceId,
    filter: ['==', ['get', 'status'], 'critical'],
    paint: {
      'line-color': '#fb7185',
      'line-width': 3,
      'line-opacity': 0.9,
      'line-dasharray': [1.2, 1.4],
    },
  })

  map.addLayer({
    id: 'point-halo',
    type: 'circle',
    source: pointSourceId,
    minzoom: pointMinZoom,
    paint: {
      'circle-radius': [
        'match',
        ['get', 'status'],
        'critical',
        11,
        'warning',
        10,
        9,
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'critical',
        '#ef4444',
        'warning',
        '#f59e0b',
        '#22d3ee',
      ],
      'circle-opacity': 0.18,
      'circle-blur': 0.35,
    },
  })

  map.addLayer({
    id: 'point-core',
    type: 'circle',
    source: pointSourceId,
    minzoom: pointMinZoom,
    paint: {
      'circle-radius': 4,
      'circle-color': [
        'match',
        ['get', 'status'],
        'critical',
        '#f87171',
        'warning',
        '#fbbf24',
        '#67e8f9',
      ],
      'circle-stroke-color': '#ecfeff',
      'circle-stroke-width': 1.2,
      'circle-opacity': 0.95,
    },
  })

}

function addDistrictLayers(
  map: maplibregl.Map,
  districts: FeatureCollection,
  activePopupRef: MutableRefObject<maplibregl.Popup | null>,
  closeOtherPopups?: () => void,
) {
  // 过滤不同类型的区域
  // 普通区域排除晴雨比超限的区域，避免与呼吸动画图层重叠
  const normalFeatures = districts.features.filter(
    (f) => f.properties?.areaType === 'normal' && (f.properties?.rainRatio ?? 0) < 2.5,
  )
  const siltationFeatures = districts.features.filter((f) => f.properties?.areaType === 'siltation')
  const inflowFeatures = districts.features.filter((f) => f.properties?.areaType === 'inflow')

  // 普通区域图层 - 根据晴雨比显示蓝色深浅
  if (normalFeatures.length > 0) {
    const normalGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: normalFeatures,
    }

    map.addSource(districtSourceId, {
      type: 'geojson',
      data: normalGeoJson,
    })

    map.addLayer({
      id: 'district-fill',
      type: 'fill',
      source: districtSourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'rainRatio'], 0],
          // 晴雨比范围 1.5 - 4.5+
          1.8, 'rgba(99, 102, 241, 0.12)',   // 浅蓝紫
          2.2, 'rgba(99, 102, 241, 0.18)',   // 浅蓝紫
          2.6, 'rgba(79, 70, 229, 0.25)',    // 中蓝紫
          3.0, 'rgba(67, 56, 202, 0.32)',    // 中深蓝紫
          3.5, 'rgba(55, 48, 163, 0.40)',    // 深蓝紫
          4.0, 'rgba(49, 46, 129, 0.50)',    // 很深蓝紫
        ],
        'fill-opacity': 1,
      },
    })

    map.addLayer({
      id: 'district-outline',
      type: 'line',
      source: districtSourceId,
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'rainRatio'], 0],
          1.8, 'rgba(129, 140, 248, 0.5)',   // 浅轮廓
          2.2, 'rgba(129, 140, 248, 0.6)',
          2.6, 'rgba(109, 109, 224, 0.7)',    // 中轮廓
          3.0, 'rgba(99, 102, 241, 0.75)',
          3.5, 'rgba(91, 87, 204, 0.8)',
          4.0, 'rgba(79, 70, 229, 0.9)',      // 深轮廓
        ],
        'line-width': 1.5,
        'line-opacity': 0.8,
        'line-dasharray': [4, 4],
      },
    })

    // 普通区域点击处理
    const handleNormalDistrictClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['district-fill'],
      })

      if (features.length === 0) return

      const feature = features[0]
      const props = feature.properties

      if (!props || !props.id || !props.name) return

      activePopupRef.current?.remove()
      closeOtherPopups?.()

      const lngLat = event.lngLat
      const popupPlacement = buildPopupPlacement(map, lngLat, { width: 420, height: 320 })
      const popup = new maplibregl.Popup({
        anchor: popupPlacement.anchor,
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: '420px',
        offset: popupPlacement.offset,
        className: 'drainage-district-popup',
      })
        .setLngLat(lngLat)
        .setDOMContent(
          buildDistrictPopupContent({
            id: props.id as string,
            name: props.name as string,
            sewageSystem: props.sewageSystem as string | undefined,
            status: props.status as 'healthy' | 'warning' | 'critical' | undefined,
            rainyWeatherFlow: props.rainyWeatherFlow as number | undefined,
            dryWeatherFlow: props.dryWeatherFlow as number | undefined,
            rainRatio: props.rainRatio as number | undefined,
          }),
        )
        .addTo(map)

      activePopupRef.current = popup
    }

    // 在 fill 和 outline 图层上都设置点击和光标事件
    map.on('click', 'district-fill', handleNormalDistrictClick)
    map.on('click', 'district-outline', handleNormalDistrictClick)

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const resetCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('mouseenter', 'district-fill', setPointerCursor)
    map.on('mouseleave', 'district-fill', resetCursor)
    map.on('mouseenter', 'district-outline', setPointerCursor)
    map.on('mouseleave', 'district-outline', resetCursor)
  }

  // 管道淤积区域 - 红色呼吸闪烁
  if (siltationFeatures.length > 0) {
    const siltationGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: siltationFeatures,
    }

    map.addSource(siltationSourceId, {
      type: 'geojson',
      data: siltationGeoJson,
    })

    map.addLayer({
      id: 'siltation-fill',
      type: 'fill',
      source: siltationSourceId,
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.3,
      },
    })

    map.addLayer({
      id: siltationLayerId,
      type: 'line',
      source: siltationSourceId,
      paint: {
        'line-color': '#f87171',
        'line-width': 3,
        'line-opacity': 0.8,
      },
    })

    // 淤积区域点击处理
    const handleSiltationClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['siltation-fill'],
      })

      if (features.length === 0) return

      const feature = features[0]
      const props = feature.properties

      if (!props || !props.id || !props.name) return

      activePopupRef.current?.remove()
      closeOtherPopups?.()

      const lngLat = event.lngLat
      const popupPlacement = buildPopupPlacement(
        map,
        lngLat,
        { width: 560, height: 480 },
        {
          preferredAnchors: ['right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
        },
      )
      const popup = new maplibregl.Popup({
        anchor: popupPlacement.anchor,
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: '560px',
        offset: popupPlacement.offset,
        className: 'drainage-siltation-popup-wrapper',
      })
        .setLngLat(lngLat)
        .setDOMContent(buildSiltationPopupContent(props.id as string))
        .addTo(map)

      activePopupRef.current = popup
    }

    // 在 fill 和 line 图层上都设置点击和光标事件
    map.on('click', 'siltation-fill', handleSiltationClick)
    map.on('click', siltationLayerId, handleSiltationClick)

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const resetCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('mouseenter', 'siltation-fill', setPointerCursor)
    map.on('mouseleave', 'siltation-fill', resetCursor)
    map.on('mouseenter', siltationLayerId, setPointerCursor)
    map.on('mouseleave', siltationLayerId, resetCursor)
  }

  // 流入渗入区域 - 黄色呼吸闪烁
  if (inflowFeatures.length > 0) {
    const inflowGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: inflowFeatures,
    }

    map.addSource(inflowInfiltrationSourceId, {
      type: 'geojson',
      data: inflowGeoJson,
    })

    map.addLayer({
      id: 'inflow-infiltration-fill',
      type: 'fill',
      source: inflowInfiltrationSourceId,
      paint: {
        'fill-color': '#eab308',
        'fill-opacity': 0.3,
      },
    })

    map.addLayer({
      id: inflowInfiltrationLayerId,
      type: 'line',
      source: inflowInfiltrationSourceId,
      paint: {
        'line-color': '#facc15',
        'line-width': 3,
        'line-opacity': 0.8,
      },
    })

    // 流入渗入区域点击处理
    const handleInflowClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['inflow-infiltration-fill'],
      })

      if (features.length === 0) return

      const feature = features[0]
      const props = feature.properties

      if (!props || !props.id || !props.name) return

      activePopupRef.current?.remove()
      closeOtherPopups?.()

      const lngLat = event.lngLat
      const popupPlacement = buildPopupPlacement(map, lngLat, { width: 460, height: 500 })
      const popup = new maplibregl.Popup({
        anchor: popupPlacement.anchor,
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: '460px',
        offset: popupPlacement.offset,
        className: 'drainage-inflow-popup-wrapper',
      })
        .setLngLat(lngLat)
        .setDOMContent(buildInflowPopupContent(props.id as string))
        .addTo(map)

      activePopupRef.current = popup
    }

    // 在 fill 和 line 图层上都设置点击和光标事件
    map.on('click', 'inflow-infiltration-fill', handleInflowClick)
    map.on('click', inflowInfiltrationLayerId, handleInflowClick)

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const resetCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('mouseenter', 'inflow-infiltration-fill', setPointerCursor)
    map.on('mouseleave', 'inflow-infiltration-fill', resetCursor)
    map.on('mouseenter', inflowInfiltrationLayerId, setPointerCursor)
    map.on('mouseleave', inflowInfiltrationLayerId, resetCursor)
  }

  // 晴雨比超限区域 - 呼吸闪烁特效
  const rainAlertFeatures = districts.features.filter(
    (f) => f.properties?.areaType === 'normal' && (f.properties?.rainRatio ?? 0) >= 2.5,
  )

  console.log('[降雨特效] 符合条件的区域数量:', rainAlertFeatures.length)
  if (rainAlertFeatures.length > 0) {
    console.log('[降雨特效] 区域名称:', rainAlertFeatures.map(f => f.properties?.name))
    const rainAlertGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: rainAlertFeatures,
    }

    map.addSource(rainAlertSourceId, {
      type: 'geojson',
      data: rainAlertGeoJson,
    })

    // 蓝色填充层 - 用于呼吸动画（深色表示警戒）
    map.addLayer({
      id: 'rain-alert-fill',
      type: 'fill',
      source: rainAlertSourceId,
      paint: {
        'fill-color': 'rgb(49, 46, 129)',
        'fill-opacity': 0.7,
      },
    })

    console.log('[降雨特效] 蓝色填充层已创建')

    // 降雨效果边框
    map.addLayer({
      id: rainAlertLayerId,
      type: 'line',
      source: rainAlertSourceId,
      paint: {
        'line-color': 'rgb(43, 40, 109)',
        'line-width': 2.5,
        'line-opacity': 0.85,
      },
    })

    // 降雨区域点击处理
    const handleRainAlertClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['rain-alert-fill', rainAlertLayerId],
      })

      if (features.length === 0) return

      const feature = features[0]
      const props = feature.properties

      if (!props || !props.id || !props.name) return

      activePopupRef.current?.remove()
      closeOtherPopups?.()

      const lngLat = event.lngLat
      const popupPlacement = buildPopupPlacement(map, lngLat, { width: 460, height: 420 })
      const popup = new maplibregl.Popup({
        anchor: popupPlacement.anchor,
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: '460px',
        offset: popupPlacement.offset,
        className: 'drainage-rain-alert-popup-wrapper',
      })
        .setLngLat(lngLat)
        .setDOMContent(
          buildDistrictPopupContent({
            id: props.id as string,
            name: props.name as string,
            sewageSystem: props.sewageSystem as string | undefined,
            status: 'warning',
            rainyWeatherFlow: props.rainyWeatherFlow as number | undefined,
            dryWeatherFlow: props.dryWeatherFlow as number | undefined,
            rainRatio: props.rainRatio as number | undefined,
          }, { variant: 'alert' }),
        )
        .addTo(map)

      activePopupRef.current = popup
    }

    map.on('click', 'rain-alert-fill', handleRainAlertClick)
    map.on('click', rainAlertLayerId, handleRainAlertClick)

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const resetCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('mouseenter', 'rain-alert-fill', setPointerCursor)
    map.on('mouseleave', 'rain-alert-fill', resetCursor)
    map.on('mouseenter', rainAlertLayerId, setPointerCursor)
    map.on('mouseleave', rainAlertLayerId, resetCursor)
  }
}

function logMapZoom(map: maplibregl.Map) {
  console.info('[DrainageMap] current zoom:', Number(map.getZoom().toFixed(2)))
}

export function useMapLibre({
  containerRef,
  dataset,
  interactive = true,
  districtAreas,
  showFocusMask = true,
  onMapReady,
}: UseMapLibreOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const siteMarkersRef = useRef<maplibregl.Marker[]>([])
  const activeSitePopupRef = useRef<maplibregl.Popup | null>(null)
  const activeDistrictPopupRef = useRef<maplibregl.Popup | null>(null)
  const pipeFlowFrameRef = useRef<number | null>(null)
  const blinkFrameRef = useRef<number | null>(null)
  const rainDropFrameRef = useRef<number | null>(null)
  const toggleFocusMaskRef = useRef<((show: boolean) => void) | null>(null)
  const isFocusMaskVisibleRef = useRef(showFocusMask)
  const geoJsonDataset = useMemo(() => buildDrainageGeoJson(dataset), [dataset])

  // 创建切换演示边界的函数（始终使用 fiord 原始样式）
  const createToggleFocusMask = (map: maplibregl.Map) => {
    return (show: boolean) => {
      const closeAllPopups = () => {
        activeSitePopupRef.current?.remove()
        activeSitePopupRef.current = null
        activeDistrictPopupRef.current?.remove()
        activeDistrictPopupRef.current = null
      }

      isFocusMaskVisibleRef.current = show

      if (show) {
        // 显示汾口镇演示边界。
        if (!map.getSource(fenkouFocusSourceId)) {
          addFenkouFocusLayers(map, dataset.focusBoundary)
        }
      } else {
        // 隐藏汾口镇演示边界。
        const layersToRemove = [
          'fenkou-focus-wall',
          'fenkou-focus-outline-halo',
          'fenkou-focus-outline-glow',
          'fenkou-focus-outline',
        ]
        for (const layerId of layersToRemove) {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
          }
        }
        if (map.getSource(fenkouFocusSourceId)) {
          map.removeSource(fenkouFocusSourceId)
        }
      }

      syncTiandituDetailLayers(map, show)

      // 关闭所有弹窗
      closeAllPopups()
    }
  }

  // 单独处理 showFocusMask 变化
  const prevShowFocusMaskRef = useRef(showFocusMask)
  const isMapReadyRef = useRef(false)

  useEffect(() => {
    const map = mapRef.current
    // 防止重复更新
    if (prevShowFocusMaskRef.current === showFocusMask) {
      return
    }
    prevShowFocusMaskRef.current = showFocusMask

    if (!map || !toggleFocusMaskRef.current || !isMapReadyRef.current) {
      return
    }
    toggleFocusMaskRef.current(showFocusMask)
  }, [showFocusMask])

  useEffect(() => {
    const container = containerRef.current

    console.log('[useMapLibre] useEffect 触发', { container: !!container, mapExists: !!mapRef.current })

    if (!container || mapRef.current) {
      console.log('[useMapLibre] 跳过初始化:', { noContainer: !container, mapExists: !!mapRef.current })
      return
    }

    console.log('[useMapLibre] 初始化地图')

    const map = new maplibregl.Map({
      container,
      style: fiordStyleUrl,
      center: dataset.center,
      zoom: initialZoom,
      pitch: mapPitch,
      bearing: mapBearing,
      minZoom: 10,
      maxZoom: 17,
      maxBounds: fenkouMaxBounds,
      attributionControl: false,
      cooperativeGestures: false,
      interactive,
    })

    mapRef.current = map
    map.dragPan.enable()
    map.scrollZoom.enable()
    map.boxZoom.enable()
    map.doubleClickZoom.enable()
    map.touchZoomRotate.enable()
    map.keyboard.enable()

    const handleLoad = () => {
      // 关闭所有弹窗的辅助函数
      const closeAllPopups = () => {
        activeSitePopupRef.current?.remove()
        activeSitePopupRef.current = null
        activeDistrictPopupRef.current?.remove()
        activeDistrictPopupRef.current = null
      }

      addBuildingExtrusionLayer(map)
      if (showFocusMask) {
        addFenkouFocusLayers(map, dataset.focusBoundary)
      }
      isFocusMaskVisibleRef.current = showFocusMask
      syncTiandituDetailLayers(map, showFocusMask)
      addWaterwayLayers(map, geoJsonDataset)
      addDrainageLayers(map, geoJsonDataset)
      siteMarkersRef.current = addMonitoringSiteMarkers(
        map,
        dataset.points,
        activeSitePopupRef,
        closeAllPopups,
      )
      updateSiteMarkerScale(map, siteMarkersRef.current)

      // 添加区域图层
      if (districtAreas) {
        addDistrictLayers(map, districtAreas, activeDistrictPopupRef, closeAllPopups)
      }

      // 管网流动动画
      const animatePipeFlow = (timestamp: number) => {
        if (map.getLayer(pipeFlowLayerId)) {
          const phase = (timestamp % pipeFlowDurationMs) / pipeFlowDurationMs
          map.setPaintProperty(
            pipeFlowLayerId,
            'line-gradient',
            buildPipeFlowGradient(phase),
          )
        }

        pipeFlowFrameRef.current = window.requestAnimationFrame(animatePipeFlow)
      }

      pipeFlowFrameRef.current = window.requestAnimationFrame(animatePipeFlow)

      // 管道淤积区域红色呼吸闪烁动画
      const animateSiltationBlink = (timestamp: number) => {
        try {
          if (map.getLayer(siltationLayerId)) {
            const phase = (timestamp % blinkDurationMs) / blinkDurationMs
            const opacity = 0.3 + Math.sin(phase * Math.PI * 2) * 0.25
            map.setPaintProperty(siltationLayerId, 'line-opacity', opacity)
            map.setPaintProperty('siltation-fill', 'fill-opacity', opacity * 0.8)
          }
        } catch {
          // 图层可能还没准备好
        }

        blinkFrameRef.current = window.requestAnimationFrame(animateSiltationBlink)
      }

      // 流入渗入区域黄色呼吸闪烁动画
      const animateInflowBlink = (timestamp: number) => {
        try {
          if (map.getLayer(inflowInfiltrationLayerId)) {
            const phase = (timestamp % blinkDurationMs) / blinkDurationMs
            const opacity = 0.3 + Math.sin(phase * Math.PI * 2) * 0.25
            map.setPaintProperty(inflowInfiltrationLayerId, 'line-opacity', opacity)
            map.setPaintProperty('inflow-infiltration-fill', 'fill-opacity', opacity * 0.8)
          }
        } catch {
          // 图层可能还没准备好
        }

        blinkFrameRef.current = window.requestAnimationFrame(animateInflowBlink)
      }

      // 立即启动闪烁动画
      blinkFrameRef.current = window.requestAnimationFrame(animateSiltationBlink)
      blinkFrameRef.current = window.requestAnimationFrame(animateInflowBlink)

      // 晴雨比超限区域蓝色呼吸闪烁动画
      const animateRainDrop = (timestamp: number) => {
        if (map.getLayer('rain-alert-fill') || map.getLayer(rainAlertLayerId)) {
          const phase = (timestamp % blinkDurationMs) / blinkDurationMs
          const opacity = 0.6 + Math.sin(phase * Math.PI * 2) * 0.35

          try {
            if (map.getLayer('rain-alert-fill')) {
              map.setPaintProperty('rain-alert-fill', 'fill-opacity', opacity)
            }
            if (map.getLayer(rainAlertLayerId)) {
              map.setPaintProperty(rainAlertLayerId, 'line-opacity', opacity * 0.9)
            }
          } catch {
            // 图层可能还没准备好
          }
        }

        rainDropFrameRef.current = window.requestAnimationFrame(animateRainDrop)
      }

      // 立即启动呼吸动画
      rainDropFrameRef.current = window.requestAnimationFrame(animateRainDrop)

      map.fitBounds(dataset.bounds, {
        padding: {
          top: 20,
          right: 36,
          bottom: 20,
          left: 36,
        },
        pitch: mapPitch,
        bearing: mapBearing,
        duration: 0,
      })
      map.easeTo({
        center: dataset.center,
        zoom: initialZoom,
        pitch: mapPitch,
        bearing: mapBearing,
        duration: 0,
      })
      logMapZoom(map)

      // 标记地图已准备好
      isMapReadyRef.current = true

      // 保存切换函数引用
      toggleFocusMaskRef.current = createToggleFocusMask(map)

      // 通过回调暴露地图实例和遮罩切换函数
      onMapReady?.(map, toggleFocusMaskRef.current)
    }

    map.once('load', handleLoad)
    const handleZoom = () => {
      updateSiteMarkerScale(map, siteMarkersRef.current)
      syncTiandituDetailLayers(map, isFocusMaskVisibleRef.current)
    }

    const handleZoomEnd = () => logMapZoom(map)

    map.on('zoom', handleZoom)
    map.on('zoomend', handleZoomEnd)

    return () => {
      console.log('[useMapLibre] 清理地图')
      map.off('zoom', handleZoom)
      map.off('zoomend', handleZoomEnd)

      if (pipeFlowFrameRef.current !== null) {
        window.cancelAnimationFrame(pipeFlowFrameRef.current)
        pipeFlowFrameRef.current = null
      }

      if (blinkFrameRef.current !== null) {
        window.cancelAnimationFrame(blinkFrameRef.current)
        blinkFrameRef.current = null
      }

      if (rainDropFrameRef.current !== null) {
        window.cancelAnimationFrame(rainDropFrameRef.current)
        rainDropFrameRef.current = null
      }

      for (const marker of siteMarkersRef.current) {
        marker.remove()
      }
      siteMarkersRef.current = []

      activeSitePopupRef.current?.remove()
      activeSitePopupRef.current = null

      activeDistrictPopupRef.current?.remove()
      activeDistrictPopupRef.current = null

      isMapReadyRef.current = false
      toggleFocusMaskRef.current = null

      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, interactive, districtAreas])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !map.isStyleLoaded()) {
      return
    }

    updateGeoJsonSource(map, pipeSourceId, geoJsonDataset.pipes)
    updateGeoJsonSource(map, pointSourceId, geoJsonDataset.points)
    updateGeoJsonSource(map, riskAreaSourceId, geoJsonDataset.riskAreas)
    updateGeoJsonSource(map, waterwaySourceId, geoJsonDataset.waterways)
  }, [geoJsonDataset])

  return mapRef
}
