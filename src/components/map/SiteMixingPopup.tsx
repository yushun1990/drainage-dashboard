import { useMemo, useRef, useState } from 'react'
import { getMixingAlarmDataMap } from '../../data/mixingAlarmData'
import { RainfallFlowChart } from './charts/RainfallFlowChart'
import { WaterQualityDetailChart } from './charts/WaterQualityDetailChart'
import { WaterQualityDiffChart } from './charts/WaterQualityDiffChart'
import { useCurrentTime } from '../../hooks/useCurrentTime'

interface SiteMixingPopupProps {
  siteId: string
}

export function SiteMixingPopup({ siteId }: SiteMixingPopupProps) {
  const currentTime = useCurrentTime()
  const mixingAlarmDataMap = useMemo(() => getMixingAlarmDataMap(currentTime), [currentTime])
  const alarmData = mixingAlarmDataMap[siteId]
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  const wheelLockRef = useRef(false)

  if (!alarmData) {
    return null
  }

  const isSewageToRain = alarmData.alarmType === 'sewage-to-rain'
  const mixingTypeLabel = isSewageToRain ? '污水混入雨水管' : '雨水混入污水管'
  const alarmBadgeLabel = isSewageToRain ? '污水入雨预警' : '雨水入污预警'
  const evidenceText = isSewageToRain
    ? '降雨后COD、电导率、流量同步异常上升，上下游水质差突变明显，符合污水混入雨水特征。'
    : '降雨后污水管流量突增，COD、氨氮和电导率同步下降，符合雨水进入污水管特征。'
  const maxRainfall = Math.max(...alarmData.rainfallData.map((item) => item.rainfall))
  const peakFlow = Math.max(...alarmData.flowData.map((item) => item.flow))
  const minCod = Math.min(...alarmData.waterQualityData.map((item) => item.cod))
  const chartTitles = ['降雨量 / 流量', '水质指标', '上下游差值']
  const chartCount = chartTitles.length
  const switchChart = (direction: number) => {
    setActiveChartIndex((currentIndex) => {
      const nextIndex = currentIndex + direction
      return Math.min(Math.max(nextIndex, 0), chartCount - 1)
    })
  }
  const buildChartPanelClassName = (index: number) =>
    [
      'drainage-mixing-popup-chart border border-cyan-500/10 rounded bg-cyan-950/40 overflow-hidden',
      index === activeChartIndex
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 translate-y-2 pointer-events-none',
    ].join(' ')

  return (
    <div className="drainage-mixing-popup-panel min-w-[360px] max-w-[420px] text-cyan-50">
      {/* Header - 站点信息 + 预警状态 */}
      <div className="flex min-h-12 shrink-0 items-center border-b border-cyan-500/20 bg-gradient-to-r from-red-950/95 via-slate-950/95 to-cyan-950/95 pl-4 pr-12">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium leading-5 text-white">{alarmData.siteName}</h3>
            <p className="text-[10px] leading-4 text-cyan-100/60">{alarmData.siteId.replace('site-', '站点')} · {alarmData.affectedPipe}</p>
          </div>
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded border border-red-500/50 bg-red-500/20 px-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="whitespace-nowrap text-xs font-medium leading-none text-red-400">{alarmBadgeLabel}</span>
          </span>
        </div>
      </div>

      {/* 预警摘要 */}
      <div className="shrink-0 p-3 bg-red-950/30 border-b border-red-500/10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-red-300">混接类型：</span>
          <span className="text-xs font-medium text-white">
            {mixingTypeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-cyan-300">预警时间：</span>
          <span className="text-xs text-cyan-100">{alarmData.alarmTime}</span>
        </div>
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          <div className="rounded border border-cyan-400/15 bg-cyan-950/45 px-2 py-1">
            <span className="block text-[10px] text-cyan-100/55">峰值流量</span>
            <strong className="text-xs font-semibold text-cyan-50">{peakFlow}L/s</strong>
          </div>
          <div className="rounded border border-cyan-400/15 bg-cyan-950/45 px-2 py-1">
            <span className="block text-[10px] text-cyan-100/55">峰值降雨</span>
            <strong className="text-xs font-semibold text-cyan-50">{maxRainfall}mm</strong>
          </div>
          <div className="rounded border border-cyan-400/15 bg-cyan-950/45 px-2 py-1">
            <span className="block text-[10px] text-cyan-100/55">最低COD</span>
            <strong className="text-xs font-semibold text-cyan-50">{minCod}mg/L</strong>
          </div>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed">{alarmData.description}</p>
      </div>

      {/* 图表区域 */}
      <div
        className="drainage-mixing-popup-scroll p-3 bg-cyan-950/60"
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
                  index === activeChartIndex ? 'w-5 bg-cyan-300' : 'w-1.5 bg-cyan-500/35'
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

        <div className="drainage-mixing-popup-chart-stage">
          {/* 图1: 降雨量 + 流量 */}
          <div className={buildChartPanelClassName(0)}>
            <RainfallFlowChart
              rainfallData={alarmData.rainfallData}
              flowData={alarmData.flowData}
            />
          </div>

          {/* 图2: 水质指标 */}
          <div className={buildChartPanelClassName(1)}>
            <WaterQualityDetailChart data={alarmData.waterQualityData} />
          </div>

          {/* 图3: 上下游差值 */}
          <div className={buildChartPanelClassName(2)}>
            <WaterQualityDiffChart data={alarmData.upstreamDownstreamDiff} />
          </div>
        </div>
      </div>

      {/* Footer - 判断说明 */}
      <div className="shrink-0 px-3 py-2 border-t border-cyan-500/20 bg-cyan-950/80">
        <p className="text-xs text-cyan-300/70 leading-relaxed">
          判断依据：{evidenceText}
        </p>
      </div>
    </div>
  )
}
