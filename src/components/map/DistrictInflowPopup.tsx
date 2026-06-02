import { useMemo, useRef, useState } from 'react'
import { getInflowInfiltrationDataMap } from '../../data/inflowInfiltrationData'
import { useCurrentTime } from '../../hooks/useCurrentTime'
import type { HealthStatus } from '../../types/drainage'
import {
  RainPipeRainfallFlowChart,
  RainPipeWaterLevelChart,
} from './charts/RainPipeHydraulicCharts'

interface DistrictInflowPopupProps {
  districtId: string
}

function buildMetricClassName(status: HealthStatus): string {
  if (status === 'critical') {
    return 'text-red-300'
  }

  if (status === 'warning') {
    return 'text-amber-300'
  }

  return 'text-emerald-300'
}

export function DistrictInflowPopup({ districtId }: DistrictInflowPopupProps) {
  const currentTime = useCurrentTime()
  const detailMap = useMemo(() => getInflowInfiltrationDataMap(currentTime), [currentTime])
  const detail = detailMap[districtId]
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  const wheelLockRef = useRef(false)

  if (!detail) {
    return null
  }

  const chartTitles = ['降雨 / 流量', '管内水位 / 外水位']
  const buildChartPanelClassName = (index: number) =>
    [
      'drainage-inflow-popup-chart border border-amber-400/10 rounded bg-cyan-950/40 overflow-hidden',
      index === activeChartIndex
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 translate-y-2 pointer-events-none',
    ].join(' ')

  const switchChart = (direction: number) => {
    setActiveChartIndex((currentIndex) => {
      const nextIndex = currentIndex + direction
      return Math.min(Math.max(nextIndex, 0), chartTitles.length - 1)
    })
  }

  return (
    <div className="drainage-inflow-popup-panel min-w-[380px] max-w-[440px] text-cyan-50">
      <div className="flex min-h-12 shrink-0 items-center border-b border-amber-400/20 bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-cyan-950/95 pl-4 pr-12">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium leading-5 text-white">
              {detail.districtName} · 雨水管网
            </h3>
          </div>
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded border border-amber-400/50 bg-amber-400/20 px-2">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
            <span className="whitespace-nowrap text-xs font-medium leading-none text-amber-200">
              外水入渗风险
            </span>
          </span>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-400/10 bg-amber-950/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-200">预警时间：</span>
            <span className="text-xs text-cyan-100">{detail.alarmTime}</span>
          </div>
          <span className="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
            风险指数 {detail.riskScore}
          </span>
        </div>
        <div className="mb-2 grid grid-cols-4 gap-1.5">
          {detail.metrics.map((metric) => (
            <div
              className="rounded border border-cyan-400/15 bg-cyan-950/45 px-2 py-1"
              key={metric.label}
            >
              <span className="block truncate text-[10px] text-cyan-100/55">{metric.label}</span>
              <strong className={`text-xs font-semibold ${buildMetricClassName(metric.status)}`}>
                {metric.value}
              </strong>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-amber-100/90">{detail.summary}</p>
      </div>

      <div
        className="drainage-inflow-popup-scroll bg-cyan-950/60 p-3"
        onWheel={(event) => {
          event.preventDefault()
          if (wheelLockRef.current || Math.abs(event.deltaY) < 8) {
            return
          }

          wheelLockRef.current = true
          switchChart(event.deltaY > 0 ? 1 : -1)
          window.setTimeout(() => {
            wheelLockRef.current = false
          }, 280)
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-100">{chartTitles[activeChartIndex]}</span>
          <div className="flex items-center gap-1.5">
            {chartTitles.map((title, index) => (
              <button
                aria-label={title}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeChartIndex ? 'w-5 bg-amber-300' : 'w-1.5 bg-cyan-500/35'
                }`}
                key={title}
                onClick={() => {
                  setActiveChartIndex(index)
                }}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="drainage-inflow-popup-chart-stage">
          <div className={buildChartPanelClassName(0)}>
            <RainPipeRainfallFlowChart data={detail.hydraulicSeries} />
          </div>
          <div className={buildChartPanelClassName(1)}>
            <RainPipeWaterLevelChart data={detail.hydraulicSeries} />
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-cyan-500/20 bg-cyan-950/80 px-3 py-2">
        <p className="text-xs leading-relaxed text-cyan-300/75">
          判断依据：{detail.evidence}
        </p>
      </div>
    </div>
  )
}
