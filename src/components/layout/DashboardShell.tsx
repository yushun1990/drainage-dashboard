import { useState, useCallback, useMemo } from 'react'
import { AlarmTicker } from '../alerts/AlarmTicker'
import { KpiStrip } from '../dashboard/KpiStrip'
import { RainRatioChart } from '../dashboard/RainRatioChart'
import { DailyRainRatioChart } from '../dashboard/DailyRainRatioChart'
import { DailyFlowChart } from '../dashboard/DailyFlowChart'
import { WaterQualityChart } from '../dashboard/WaterQualityChart'
import { NetworkInfoCard } from '../dashboard/NetworkInfoCard'
import { MapViewport } from '../map/MapViewport'
import {
  drainageMapDataset,
  getDrainageAlarms,
  kpiMetrics,
  mapLayerSummaries,
  districtRainRatios,
  dailyRainRatioTrendValues,
  dailyFlowTrendValues,
  networkStatistics,
  waterQualityTrendValues,
} from '../../data/mockDrainageData'
import { pipelinePipes, pipelineWells } from '../../data/pipelineGisData'
import { monitoringSites } from '../../data/monitoringSiteData'
import { buildMapLayerSummaries } from '../../utils/buildMapLayerSummaries'
import { buildDistrictGeoJson } from '../../utils/districtUtils'
import { formatDateTime } from '../../utils/dateUtils'
import { useCurrentTime } from '../../hooks/useCurrentTime'
import maplibregl from 'maplibre-gl'

function CloudIcon() {
  return (
    <svg
      className="h-8 w-8 drop-shadow-[0_0_8px_rgba(125,211,252,0.65)]"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
    >
      <path
        d="M621.7 451.6m-129.5 0a129.5 129.5 0 1 0 259 0 129.5 129.5 0 1 0-259 0Z"
        fill="#F4CE26"
      />
      <path
        d="M621.7 607.4c-85.9 0-155.8-69.9-155.8-155.8s69.9-155.8 155.8-155.8 155.8 69.9 155.8 155.8S707.6 607.4 621.7 607.4z m0-258.9c-56.8 0-103.1 46.2-103.1 103.1s46.3 103.1 103.1 103.1 103-46.3 103-103.2-46.2-103-103-103z"
        fill="#0f172a"
      />
      <path
        d="M502.1 198c11.8-6.8 26.9-2.8 33.7 9l24.7 42.7c6.8 11.8 2.8 26.9-9 33.7-11.8 6.8-26.9 2.8-33.7-9l-24.7-42.7c-6.9-11.9-2.8-26.9 9-33.7zM807.8 406.4c3.5 13.2 17 21 30.2 17.4l47.6-12.8c13.2-3.5 21-17 17.4-30.2-3.5-13.2-17-21-30.2-17.4l-47.6 12.8c-13.1 3.5-20.9 17-17.4 30.2zM794.6 517.3c-3.5 13.2 4.3 26.7 17.4 30.2l47.6 12.8c13.2 3.5 26.7-4.3 30.2-17.4 3.5-13.2-4.3-26.7-17.4-30.2l-47.6-12.8c-13.1-3.5-26.6 4.3-30.2 17.4zM665.7 161.8c13.6 0 24.7 11 24.7 24.7v49.3c0 13.6-11 24.7-24.7 24.7-13.6 0-24.7-11-24.7-24.7v-49.3c0-13.6 11-24.7 24.7-24.7zM832.8 231.3c-9.6-9.6-25.2-9.6-34.9 0L763 266.2c-9.6 9.6-9.6 25.2 0 34.9 9.6 9.6 25.2 9.6 34.9 0l34.9-34.9c9.7-9.7 9.7-25.3 0-34.9z"
        fill="#0f172a"
      />
      <path
        d="M264.5 740.8c-2.2 0.2-4.3 0.4-6.5 0.5-60.5 3.4-111-49.7-111-111s49.7-111 111-111c4.2 0 8.4 0.2 12.5 0.7-0.1-2.3-0.1-4.6-0.1-6.9 0-85.1 69-154.1 154.1-154.1 75.2 0 137.8 53.8 151.4 125 6.9-1.1 14-1.7 21.2-1.7 71.5 0 129.5 58 129.5 129.5-0.2 45.7-23.8 85.9-59.6 108.9-20.2 13-44.2 21.3-70 20.5-3.5-0.1-6.9-0.3-10.3-0.7-1.1 0.1-2.3 0.1-3.4 0.1H264.5z"
        fill="#FFFFFF"
      />
      <path
        d="M252.4 767.8c-32.4 0-63.3-12.5-87.9-35.8-27.9-26.4-43.9-63.5-43.9-101.7 0-71.3 54.7-130.2 124.3-136.7 9.8-90.3 86.5-160.9 179.4-160.9 78.4 0 147 50.6 171.2 123.3h1.4c86 0 155.9 69.9 155.9 155.8 0 53.3-26.7 102.3-71.5 131.1-26.5 17.1-56.1 25.6-85.1 24.7-3.4-0.1-6.7-0.3-10-0.6-1 0-2 0.1-3 0.1H265.8c-2.1 0.2-4.2 0.4-6.3 0.5-2.4 0.1-4.7 0.2-7.1 0.2z m5.5-222.1c-46.6 0-84.6 38-84.6 84.6 0 23.8 10 46.9 27.4 63.4 15.7 14.9 35.7 22.5 55.7 21.2 1.7-0.1 3.5-0.2 5.2-0.4l2.8-0.2h324.9c2.8 0.3 5.6 0.5 8.4 0.6 23.2 0.8 42.8-8.5 54.9-16.4 29.8-19 47.5-51.4 47.5-86.7 0-56.8-46.3-103.1-103.1-103.1-5.7 0-11.4 0.5-16.9 1.4l-25.4 4.2-4.8-25.3c-11.5-60-64.2-103.6-125.5-103.6-70.5 0-127.8 57.3-127.8 127.8 0 1.9 0 3.8 0.1 5.7l1.4 30.9-30.7-3.5c-3.1-0.4-6.2-0.6-9.5-0.6z"
        fill="#0f172a"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      className="h-4 w-4 text-cyan-100 drop-shadow-[0_0_6px_rgba(103,232,249,0.6)]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12.1a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5.3 19.2c.8-3.1 3.2-4.8 6.7-4.8s5.9 1.7 6.7 4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function DashboardShell() {
  const [showFocusMask, setShowFocusMask] = useState(true)
  const [toggleFocusMask, setToggleFocusMask] = useState<((show: boolean) => void) | null>(null)
  const currentTime = useCurrentTime()
  const currentTimeText = useMemo(() => formatDateTime(currentTime), [currentTime])
  const alarms = useMemo(() => getDrainageAlarms(currentTime), [currentTime])

  const mapDatasetWithWells = useMemo(
    () => ({
      ...drainageMapDataset,
      pipes: pipelinePipes,
      points: [...pipelineWells, ...monitoringSites],
    }),
    [],
  )

  const layerSummaries = useMemo(
    () => buildMapLayerSummaries(mapLayerSummaries, pipelinePipes, pipelineWells),
    [],
  )

  // 使用工具函数将区域数据转换为 GeoJSON 格式
  const districtGeoJson = useMemo(() => buildDistrictGeoJson(), [])

  const handleToggleMask = () => {
    const newValue = !showFocusMask
    setShowFocusMask(newValue)
    toggleFocusMask?.(newValue)
  }

  const handleMapReady = useCallback((_map: maplibregl.Map, toggleFn: (show: boolean) => void) => {
    setToggleFocusMask(() => toggleFn)
  }, [])

  return (
    <main className="relative h-screen min-h-[720px] overflow-hidden bg-[#021927] pb-4 text-cyan-50">
      <div className="absolute inset-0">
        <MapViewport
          dataset={mapDatasetWithWells}
          interactive
          layers={layerSummaries}
          showChrome={false}
          districtAreas={districtGeoJson}
          showFocusMask={showFocusMask}
          onMapReady={handleMapReady}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center_top,rgba(21,176,255,0.05),transparent_34%),linear-gradient(180deg,rgba(1,12,22,0.08)_0%,rgba(2,23,36,0.04)_48%,rgba(1,10,18,0.16)_100%)]" />

      <div className="pointer-events-none relative z-10 flex h-full flex-col gap-3">
        <div className="pointer-events-auto relative h-[72px] shrink-0">
          <header className="relative grid h-16 grid-cols-[1fr_1.5fr_1fr] items-center gap-4 overflow-hidden bg-[linear-gradient(180deg,rgba(2,15,28,0.78)_0%,rgba(3,27,43,0.48)_62%,rgba(3,34,52,0.08)_100%)] shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_-28px_34px_rgba(2,23,36,0.24)]">
            <div className="relative z-10 flex items-center px-4">
              <div className="flex items-center gap-2 text-sm text-cyan-100/72">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.85)]" />
                <span className="font-medium tabular-nums tracking-wide">
                  {currentTimeText}
                </span>
              </div>
            </div>
            <h1 className="relative z-10 text-center text-3xl font-semibold text-white drop-shadow-[0_0_12px_rgba(125,211,252,0.9)]">
              <span>排水管网运行智能分析平台</span>
            </h1>
            <div className="relative z-10 flex items-center justify-end px-4">
              <div className="flex items-center gap-5 text-sm text-cyan-100/72">
                <div className="flex items-center gap-2">
                  <CloudIcon />
                  <span className="font-medium">多云</span>
                  <span className="tabular-nums text-cyan-50">24°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-950/18 shadow-[0_0_8px_rgba(34,211,238,0.12)]">
                    <UserIcon />
                  </span>
                  <span>演示用户</span>
                </div>
              </div>
            </div>
          </header>
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-4 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 16"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="headerBottomRule" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(34,211,238,0.04)" />
                <stop offset="18%" stopColor="rgba(34,211,238,0.38)" />
                <stop offset="38%" stopColor="rgba(125,211,252,0.72)" />
                <stop offset="50%" stopColor="rgba(224,242,254,0.9)" />
                <stop offset="62%" stopColor="rgba(125,211,252,0.72)" />
                <stop offset="82%" stopColor="rgba(34,211,238,0.38)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0.04)" />
              </linearGradient>
              <linearGradient id="headerCenterRule" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(224,242,254,0)" />
                <stop offset="18%" stopColor="rgba(224,242,254,0.42)" />
                <stop offset="34%" stopColor="rgba(224,242,254,0.86)" />
                <stop offset="50%" stopColor="rgba(224,242,254,0.96)" />
                <stop offset="66%" stopColor="rgba(224,242,254,0.86)" />
                <stop offset="82%" stopColor="rgba(224,242,254,0.42)" />
                <stop offset="100%" stopColor="rgba(224,242,254,0)" />
              </linearGradient>
            </defs>
            <path
              d="M0 2 H382 L402 13 H598 L618 2 H1000"
              fill="none"
              stroke="url(#headerBottomRule)"
              strokeWidth="1"
            />
            <path
              d="M366 2 H382 L402 13 H598 L618 2 H634"
              fill="none"
              stroke="url(#headerCenterRule)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
            />
            <path
              d="M414 12 H586"
              fill="none"
              stroke="rgba(125,211,252,0.42)"
              strokeLinecap="round"
              strokeWidth="1"
            />
            <path
              d="M392 6 H608"
              fill="none"
              stroke="rgba(34,211,238,0.12)"
              strokeWidth="1"
            />
          </svg>
        </div>

        <section className="grid min-h-0 flex-1 grid-cols-[320px_1fr_320px] gap-0">
          <aside className="pointer-events-auto min-h-0 px-4">
            <div className="flex h-full flex-col gap-3">
              {/* 水质趋势图表 */}
              <article className="flex flex-1 flex-col rounded border border-cyan-200/28 bg-[#053452]/48 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm">
                <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
                  <h2 className="text-sm font-medium text-cyan-50">最近一周进水水质</h2>
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
                </div>
                <div className="mt-3 min-h-0 flex-1 px-4 pb-4">
                  <WaterQualityChart data={waterQualityTrendValues} />
                </div>
              </article>

              {/* 进水量趋势 */}
              <article className="flex flex-1 flex-col rounded border border-cyan-200/28 bg-[#053452]/48 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm">
                <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
                  <h2 className="text-sm font-medium text-cyan-50">最近一周进水量</h2>
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
                </div>
                <div className="mt-3 min-h-0 flex-1 px-4 pb-4">
                  <DailyFlowChart data={dailyFlowTrendValues} />
                </div>
              </article>

              {/* 晴雨比趋势 */}
              <article className="flex flex-1 flex-col rounded border border-cyan-200/28 bg-[#053452]/48 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm">
                <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
                  <h2 className="text-sm font-medium text-cyan-50">最近一周晴雨比</h2>
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
                </div>
                <div className="mt-3 min-h-0 flex-1 px-4 pb-4">
                  <DailyRainRatioChart data={dailyRainRatioTrendValues} />
                </div>
              </article>
            </div>
          </aside>
          <section className="flex min-h-0 flex-col gap-3">
            <div className="pointer-events-auto">
              <KpiStrip metrics={kpiMetrics} />
            </div>
            <div
              className="relative min-h-0 flex-1"
              aria-label="GIS 地图主展示区域"
            >
              {/* 演示区域遮罩开关按钮 */}
              <button
                type="button"
                onClick={handleToggleMask}
                className="pointer-events-auto absolute bottom-4 right-4 z-10 h-5 w-10 rounded-full border border-cyan-500/20 bg-cyan-950/40 shadow-[0_0_8px_rgba(34,211,238,0.15)] backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                aria-label={showFocusMask ? '隐藏演示区域遮罩' : '显示演示区域遮罩'}
                title={showFocusMask ? '隐藏演示区域遮罩' : '显示演示区域遮罩'}
              >
                <span
                  className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 ${
                    showFocusMask ? 'left-[calc(100%-0.875rem-0.25rem)] bg-cyan-300' : 'left-1 bg-gray-400'
                  }`}
                />
              </button>
            </div>
          </section>
          <aside className="pointer-events-auto min-h-0 px-4">
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className="min-h-0 flex-1">
                <NetworkInfoCard data={networkStatistics} />
              </div>
              <article className="flex h-[280px] flex-col rounded border border-cyan-200/28 bg-[#053452]/48 p-2.5 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm">
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-cyan-50">各区域晴雨比</h2>
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                </div>
                <div className="mt-1.5 min-h-0 flex-1">
                  <RainRatioChart data={districtRainRatios} />
                </div>
              </article>
              <div className="min-h-0 flex-1">
                <AlarmTicker alarms={alarms} variant="card" />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
