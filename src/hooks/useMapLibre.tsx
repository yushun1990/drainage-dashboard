import { useEffect, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Polygon } from 'geojson'
import type { MutableRefObject, RefObject } from 'react'
import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  LngLatBoundsLike,
  StyleSpecification,
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
const fenkouFocusMaskSourceId = 'fenkou-focus-mask'
const fenkouFocusWallSourceId = 'fenkou-focus-wall'
const tiandituSatelliteSourceId = 'tianditu-satellite-raster'
const tiandituSatelliteLabelSourceId = 'tianditu-satellite-label-raster'
const initialZoom = 14
const pointMinZoom = 16.01
const mapPitch = 58
const mapBearing = 0
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
const focusMaskBands = [
  { id: 'fenkou-focus-outside-mask-near', band: 'near', expansion: 1, opacity: 0.14 },
  { id: 'fenkou-focus-outside-mask-soft', band: 'soft', expansion: 1.025, opacity: 0.11 },
  { id: 'fenkou-focus-outside-mask-mid', band: 'mid', expansion: 1.06, opacity: 0.1 },
  { id: 'fenkou-focus-outside-mask-far', band: 'far', expansion: 1.105, opacity: 0.11 },
] as const
const focusWallPalette = {
  mask: '#041c18',
  depth: '#022c22',
  body: '#064e3b',
  innerGlow: '#0f766e',
  topBand: '#34d399',
  topGlow: '#10b981',
  edgeShadow: '#031c16',
  bottomGlow: '#6ee7b7',
  terraceOuter: '#052e24',
  terraceMid: '#10b981',
  terraceInner: '#a7f3d0',
  outlineHalo: '#059669',
  outlineGlow: '#34d399',
  outline: '#d1fae5',
} as const

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

type FocusMaskBand = (typeof focusMaskBands)[number]

interface FocusMaskProperties {
  band: FocusMaskBand['band']
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
    : 'drainage-district-popup-panel min-w-[240px] text-cyan-50'

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
      ? 'border-red-500/50 bg-red-500/20 text-red-400'
      : district.status === 'warning'
        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
        : district.status === 'critical'
          ? 'border-red-400/40 bg-red-400/10 text-red-200'
          : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'

  // Header
  const header = document.createElement('div')
  header.className =
    variant === 'alert'
      ? 'drainage-district-popup-header flex items-center justify-between gap-2 border-b border-cyan-500/20 bg-gradient-to-r from-red-950/95 via-slate-950/95 to-cyan-950/95 px-4 py-3 pr-12'
      : 'drainage-district-popup-header flex items-center justify-between gap-3 border-b border-emerald-300/18 bg-[linear-gradient(90deg,rgba(6,78,59,0.9),rgba(13,148,136,0.7),rgba(8,47,73,0.58))] px-4 py-3 pr-16'

  const title = document.createElement('h3')
  title.className = 'min-w-0 truncate text-sm font-semibold text-white drop-shadow-[0_0_8px_rgba(125,211,252,0.68)]'
  title.textContent = district.name

  const subtitle = document.createElement('p')
  subtitle.className = variant === 'alert'
    ? 'mt-1 truncate text-[10px] leading-none text-cyan-100/60'
    : 'mt-1 truncate text-[10px] leading-none text-emerald-100/64'
  subtitle.textContent = 'SEPARATE_SYSTEM · 区域运行分析'

  const titleWrap = document.createElement('div')
  titleWrap.className = 'min-w-0'
  titleWrap.append(title, subtitle)

  const tagWrap = document.createElement('div')
  tagWrap.className = 'flex shrink-0 items-center'
  tagWrap.append(buildTag(statusValue, statusClass))

  header.append(titleWrap, tagWrap)

  wrapper.append(header)

  const metrics = document.createElement('div')
  metrics.className =
    variant === 'alert'
      ? 'grid grid-cols-3 gap-2 border-b border-red-500/10 bg-red-950/30 px-3 py-3'
      : 'grid grid-cols-3 gap-2 border-b border-emerald-300/12 bg-[linear-gradient(180deg,rgba(6,78,59,0.52),rgba(8,47,73,0.42))] px-3 py-3'

  const buildMetricCell = (label: string, value: string, toneClassName = 'text-emerald-50') => {
    const cell = document.createElement('div')
    cell.className =
      variant === 'alert'
        ? 'rounded border border-cyan-400/15 bg-cyan-950/45 px-2.5 py-2'
        : 'rounded border border-emerald-200/16 bg-emerald-950/30 px-2.5 py-2 shadow-[inset_0_0_12px_rgba(45,212,191,0.08)]'

    const labelEl = document.createElement('span')
    labelEl.className =
      variant === 'alert'
        ? 'block truncate text-[10px] leading-none text-cyan-100/55'
        : 'block truncate text-[10px] leading-none text-emerald-100/58'
    labelEl.textContent = label

    const valueEl = document.createElement('strong')
    valueEl.className = `mt-1.5 block truncate text-xs font-semibold leading-none ${toneClassName}`
    valueEl.textContent = value

    cell.append(labelEl, valueEl)
    return cell
  }

  metrics.append(
    buildMetricCell(
      '雨天流量',
      district.rainyWeatherFlow === undefined ? '--' : `${district.rainyWeatherFlow} m3/d`,
    ),
    buildMetricCell(
      '旱流流量',
      district.dryWeatherFlow === undefined ? '--' : `${district.dryWeatherFlow} m3/d`,
    ),
    buildMetricCell(
      '晴雨比',
      district.rainRatio === undefined ? '--' : district.rainRatio.toFixed(2),
      variant === 'alert' ? 'text-red-100' : 'text-cyan-50',
    ),
  )

  wrapper.append(metrics)

  if (showRainRatioTrend && district.rainRatio !== undefined && district.rainRatio !== null) {
    const chartSection = document.createElement('div')
    chartSection.className =
      variant === 'alert'
        ? 'bg-cyan-950/60 p-3'
        : 'bg-[linear-gradient(180deg,rgba(6,78,59,0.48),rgba(8,47,73,0.58))] p-3'

    const chartTitle = document.createElement('div')
    chartTitle.className = 'mb-2 flex items-center justify-between gap-2'

    const chartTitleText = document.createElement('span')
    chartTitleText.className =
      variant === 'alert' ? 'text-xs font-medium text-cyan-100' : 'text-xs font-medium text-cyan-100'
    chartTitleText.textContent = '最近一周晴雨比曲线'

    const chartRatio = document.createElement('span')
    chartRatio.className =
      variant === 'alert'
        ? 'rounded border border-red-300/25 bg-red-300/10 px-2 py-0.5 text-[10px] font-semibold text-red-100'
        : 'rounded border border-cyan-300/24 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100'
    chartRatio.textContent = `当前 ${district.rainRatio.toFixed(2)}`

    chartTitle.append(chartTitleText, chartRatio)

    const chartHost = document.createElement('div')
    chartHost.className =
      variant === 'alert'
        ? 'h-[170px] w-full overflow-hidden rounded border border-cyan-500/10 bg-cyan-950/40 shadow-[inset_0_0_18px_rgba(8,145,178,0.08)]'
        : 'h-[150px] w-full overflow-hidden rounded border border-emerald-300/14 bg-[radial-gradient(circle_at_18%_0%,rgba(45,212,191,0.14),transparent_36%),linear-gradient(180deg,rgba(6,78,59,0.58),rgba(8,47,73,0.52))] shadow-[inset_0_0_16px_rgba(45,212,191,0.07)]'

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

function closeRing(coordinates: Coordinate[]): Coordinate[] {
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]

  if (!first || !last) {
    return coordinates
  }

  if (first[0] === last[0] && first[1] === last[1]) {
    return coordinates
  }

  return [...coordinates, first]
}

function getOpenRing(coordinates: Coordinate[]): Coordinate[] {
  const ring = closeRing(coordinates)
  const first = ring[0]
  const last = ring[ring.length - 1]

  if (first && last && first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1)
  }

  return ring
}

function expandBoundaryFromCenter(boundary: Coordinate[], expansion: number): Coordinate[] {
  const ring = getOpenRing(boundary)
  const center = ring.reduce<Coordinate>(
    (sum, coordinate) => [sum[0] + coordinate[0], sum[1] + coordinate[1]],
    [0, 0],
  )
  const centerLng = center[0] / ring.length
  const centerLat = center[1] / ring.length

  return closeRing(
    ring.map((coordinate) => [
      centerLng + (coordinate[0] - centerLng) * expansion,
      centerLat + (coordinate[1] - centerLat) * expansion,
    ]),
  )
}

function buildFocusMaskPolygons(
  boundary: Coordinate[],
): FeatureCollection<Polygon, FocusMaskProperties> {
  const outerRing: Coordinate[] = [
    [118.4086, 29.2906],
    [118.7286, 29.2906],
    [118.7286, 29.5628],
    [118.4086, 29.5628],
    [118.4086, 29.2906],
  ]

  return {
    type: 'FeatureCollection',
    features: focusMaskBands.map((maskBand) => ({
      type: 'Feature',
      properties: {
        band: maskBand.band,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          outerRing,
          expandBoundaryFromCenter(boundary, maskBand.expansion).reverse(),
        ],
      },
    })),
  }
}

function buildFocusWallSegments(boundary: Coordinate[]): FeatureCollection<Polygon> {
  const ring = closeRing(boundary)
  const latitude = boundary.reduce((sum, coordinate) => sum + coordinate[1], 0) / boundary.length
  const longitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2)
  const wallWidthMeters = 6
  const metersPerLatitudeDegree = 111_320
  const metersPerLongitudeDegree = metersPerLatitudeDegree * longitudeScale

  return {
    type: 'FeatureCollection',
    features: ring.slice(0, -1).map((start, index) => {
      const end = ring[index + 1]
      const dx = (end[0] - start[0]) * metersPerLongitudeDegree
      const dy = (end[1] - start[1]) * metersPerLatitudeDegree
      const length = Math.hypot(dx, dy) || 1
      const normalX = (-dy / length) * wallWidthMeters
      const normalY = (dx / length) * wallWidthMeters
      const offsetLng = normalX / metersPerLongitudeDegree
      const offsetLat = normalY / metersPerLatitudeDegree
      const segment: Coordinate[] = [
        [start[0] + offsetLng, start[1] + offsetLat],
        [end[0] + offsetLng, end[1] + offsetLat],
        [end[0] - offsetLng, end[1] - offsetLat],
        [start[0] - offsetLng, start[1] - offsetLat],
        [start[0] + offsetLng, start[1] + offsetLat],
      ]

      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [segment],
        },
      }
    }),
  }
}

function addFenkouFocusLayers(map: maplibregl.Map, boundary: Coordinate[]) {
  if (!map.getSource(fenkouFocusMaskSourceId)) {
    map.addSource(fenkouFocusMaskSourceId, {
      type: 'geojson',
      data: buildFocusMaskPolygons(boundary),
    })
  }

  if (!map.getSource(fenkouFocusSourceId)) {
    map.addSource(fenkouFocusSourceId, {
      type: 'geojson',
      data: buildFocusPolygon(boundary),
    })
  }

  if (!map.getSource(fenkouFocusWallSourceId)) {
    map.addSource(fenkouFocusWallSourceId, {
      type: 'geojson',
      data: buildFocusWallSegments(boundary),
    })
  }

  for (const maskBand of focusMaskBands) {
    if (!map.getLayer(maskBand.id)) {
      map.addLayer({
        id: maskBand.id,
        type: 'fill',
        source: fenkouFocusMaskSourceId,
        filter: ['==', ['get', 'band'], maskBand.band],
        paint: {
          'fill-color': focusWallPalette.mask,
          'fill-opacity': maskBand.opacity,
        },
      })
    }
  }

  if (!map.getLayer('fenkou-focus-wall-depth')) {
    map.addLayer({
      id: 'fenkou-focus-wall-depth',
      type: 'fill-extrusion',
      source: fenkouFocusWallSourceId,
      paint: {
        'fill-extrusion-color': focusWallPalette.depth,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          44,
          16,
          112,
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.32,
        'fill-extrusion-vertical-gradient': true,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-wall')) {
    map.addLayer({
      id: 'fenkou-focus-wall',
      type: 'fill-extrusion',
      source: fenkouFocusWallSourceId,
      paint: {
        'fill-extrusion-color': focusWallPalette.body,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          46,
          16,
          118,
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          3,
          16,
          8,
        ],
        'fill-extrusion-opacity': 0.58,
        'fill-extrusion-vertical-gradient': true,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-wall-inner-glow')) {
    map.addLayer({
      id: 'fenkou-focus-wall-inner-glow',
      type: 'fill-extrusion',
      source: fenkouFocusWallSourceId,
      paint: {
        'fill-extrusion-color': focusWallPalette.innerGlow,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          51,
          16,
          128,
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          40,
          16,
          104,
        ],
        'fill-extrusion-opacity': 0.46,
        'fill-extrusion-vertical-gradient': true,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-wall-top-band')) {
    map.addLayer({
      id: 'fenkou-focus-wall-top-band',
      type: 'fill-extrusion',
      source: fenkouFocusWallSourceId,
      paint: {
        'fill-extrusion-color': focusWallPalette.topBand,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          52.5,
          16,
          131,
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          51,
          16,
          129,
        ],
        'fill-extrusion-opacity': 0.86,
        'fill-extrusion-vertical-gradient': false,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-wall-top-glow')) {
    map.addLayer({
      id: 'fenkou-focus-wall-top-glow',
      type: 'fill-extrusion',
      source: fenkouFocusWallSourceId,
      paint: {
        'fill-extrusion-color': focusWallPalette.topGlow,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          56,
          16,
          140,
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          49,
          16,
          126,
        ],
        'fill-extrusion-opacity': 0.58,
        'fill-extrusion-vertical-gradient': false,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-edge-shadow')) {
    map.addLayer({
      id: 'fenkou-focus-edge-shadow',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.edgeShadow,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          24,
          16,
          40,
        ],
        'line-opacity': 0.34,
        'line-blur': 11,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-bottom-glow')) {
    map.addLayer({
      id: 'fenkou-focus-bottom-glow',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.bottomGlow,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          3.2,
          16,
          5.4,
        ],
        'line-opacity': 0.96,
        'line-blur': 0.35,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-terrace-outer')) {
    map.addLayer({
      id: 'fenkou-focus-terrace-outer',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.terraceOuter,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          2.8,
          16,
          4.2,
        ],
        'line-opacity': 0.28,
        'line-blur': 0.8,
        'line-offset': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          7,
          16,
          14,
        ],
      },
    })
  }

  if (!map.getLayer('fenkou-focus-terrace-mid')) {
    map.addLayer({
      id: 'fenkou-focus-terrace-mid',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.terraceMid,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          1.8,
          16,
          2.8,
        ],
        'line-opacity': 0.48,
        'line-blur': 0.4,
        'line-offset': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          4,
          16,
          8,
        ],
      },
    })
  }

  if (!map.getLayer('fenkou-focus-terrace-inner')) {
    map.addLayer({
      id: 'fenkou-focus-terrace-inner',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.terraceInner,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          1.2,
          16,
          2,
        ],
        'line-opacity': 0.68,
        'line-blur': 0.2,
        'line-offset': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          2,
          16,
          4,
        ],
      },
    })
  }

  if (!map.getLayer('fenkou-focus-outline-halo')) {
    map.addLayer({
      id: 'fenkou-focus-outline-halo',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.outlineHalo,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          12,
          16,
          18,
        ],
        'line-opacity': 0.44,
        'line-blur': 7,
      },
    })
  }

  if (!map.getLayer('fenkou-focus-outline-glow')) {
    map.addLayer({
      id: 'fenkou-focus-outline-glow',
      type: 'line',
      source: fenkouFocusSourceId,
      paint: {
        'line-color': focusWallPalette.outlineGlow,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          4.5,
          16,
          7,
        ],
        'line-opacity': 0.82,
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
        'line-color': focusWallPalette.outline,
        'line-width': 1.6,
        'line-opacity': 0.86,
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

function buildTiandituWmtsUrl(layer: 'img' | 'cia'): string {
  return `https://t0.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tiandituToken}`
}

const tiandituSatelliteStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    [tiandituSatelliteSourceId]: {
      type: 'raster',
      tiles: [buildTiandituWmtsUrl('img')],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 18,
      attribution: '© 天地图',
    },
    [tiandituSatelliteLabelSourceId]: {
      type: 'raster',
      tiles: [buildTiandituWmtsUrl('cia')],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 18,
      attribution: '© 天地图',
    },
  },
  layers: [
    {
      id: tiandituSatelliteSourceId,
      type: 'raster',
      source: tiandituSatelliteSourceId,
      paint: {
        'raster-saturation': -0.08,
        'raster-contrast': 0.08,
        'raster-brightness-min': 0.02,
        'raster-brightness-max': 0.78,
      },
    },
    {
      id: tiandituSatelliteLabelSourceId,
      type: 'raster',
      source: tiandituSatelliteLabelSourceId,
      paint: {
        'raster-opacity': 0.82,
        'raster-saturation': -0.15,
        'raster-contrast': 0.08,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.82,
      },
    },
  ],
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

  // 普通区域图层 - 根据晴雨比显示深蓝色深浅
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
          1.8, 'rgba(15, 54, 94, 0.50)',
          2.2, 'rgba(13, 70, 118, 0.56)',
          2.6, 'rgba(10, 86, 145, 0.62)',
          3.0, 'rgba(8, 104, 170, 0.68)',
          3.5, 'rgba(7, 82, 140, 0.74)',
          4.0, 'rgba(6, 64, 113, 0.80)',
        ],
        'fill-opacity': 0.96,
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
          1.8, 'rgba(147, 197, 253, 0.74)',
          2.2, 'rgba(96, 165, 250, 0.80)',
          2.6, 'rgba(59, 130, 246, 0.86)',
          3.0, 'rgba(37, 99, 235, 0.90)',
          3.5, 'rgba(29, 78, 216, 0.94)',
          4.0, 'rgba(30, 64, 175, 0.96)',
        ],
        'line-width': 1.8,
        'line-opacity': 0.94,
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

    // 深蓝色填充层 - 用于呼吸动画（深色表示警戒）
    map.addLayer({
      id: 'rain-alert-fill',
      type: 'fill',
      source: rainAlertSourceId,
      paint: {
        'fill-color': 'rgb(8, 64, 113)',
        'fill-opacity': 0.78,
      },
    })

    console.log('[降雨特效] 深蓝色填充层已创建')

    // 降雨效果边框
    map.addLayer({
      id: rainAlertLayerId,
      type: 'line',
      source: rainAlertSourceId,
      paint: {
        'line-color': 'rgb(96, 165, 250)',
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

  // 创建切换演示边界的函数
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
          'fenkou-focus-outline',
          'fenkou-focus-outline-glow',
          'fenkou-focus-outline-halo',
          'fenkou-focus-terrace-inner',
          'fenkou-focus-terrace-mid',
          'fenkou-focus-terrace-outer',
          'fenkou-focus-bottom-glow',
          'fenkou-focus-edge-shadow',
          'fenkou-focus-wall-top-glow',
          'fenkou-focus-wall-top-band',
          'fenkou-focus-wall-inner-glow',
          'fenkou-focus-wall',
          'fenkou-focus-wall-depth',
          ...focusMaskBands.map((maskBand) => maskBand.id),
          'fenkou-focus-outside-mask',
        ]
        for (const layerId of layersToRemove) {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
          }
        }
        if (map.getSource(fenkouFocusSourceId)) {
          map.removeSource(fenkouFocusSourceId)
        }
        if (map.getSource(fenkouFocusMaskSourceId)) {
          map.removeSource(fenkouFocusMaskSourceId)
        }
        if (map.getSource(fenkouFocusWallSourceId)) {
          map.removeSource(fenkouFocusWallSourceId)
        }
      }

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
      style: tiandituSatelliteStyle,
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
