import { mixingAlarmDataMap } from '../../data/mixingAlarmData'
import { RainfallFlowChart } from './charts/RainfallFlowChart'
import { WaterQualityDetailChart } from './charts/WaterQualityDetailChart'
import { WaterQualityDiffChart } from './charts/WaterQualityDiffChart'

interface SiteMixingPopupProps {
  siteId: string
}

export function SiteMixingPopup({ siteId }: SiteMixingPopupProps) {
  const alarmData = mixingAlarmDataMap[siteId]

  if (!alarmData) {
    return null
  }

  const isSewageToRain = alarmData.alarmType === 'sewage-to-rain'

  return (
    <div className="min-w-[340px] max-w-[400px] text-cyan-50">
      {/* Header - 站点信息 + 预警状态 */}
      <div className="px-4 py-2 border-b border-cyan-500/20 bg-gradient-to-r from-red-950/95 to-cyan-950/95">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">{alarmData.siteId.replace('site-', '站点')}</h3>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-400">雨污混接预警</span>
          </span>
        </div>
      </div>

      {/* 预警摘要 */}
      <div className="p-3 bg-red-950/30 border-b border-red-500/10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-red-300">混接类型：</span>
          <span className="text-xs font-medium text-white">
            {isSewageToRain ? '污水混入雨水管' : '雨水混入污水管'}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-cyan-300">预警时间：</span>
          <span className="text-xs text-cyan-100">{alarmData.alarmTime}</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed">{alarmData.description}</p>
      </div>

      {/* 图表区域 */}
      <div className="p-3 space-y-3 bg-cyan-950/60">
        {/* 图1: 降雨量 + 流量 */}
        <div className="h-32 border border-cyan-500/10 rounded bg-cyan-950/40 overflow-hidden">
          <RainfallFlowChart
            rainfallData={alarmData.rainfallData}
            flowData={alarmData.flowData}
          />
        </div>

        {/* 图2: 水质指标 */}
        <div className="h-32 border border-cyan-500/10 rounded bg-cyan-950/40 overflow-hidden">
          <WaterQualityDetailChart data={alarmData.waterQualityData} />
        </div>

        {/* 图3: 上下游差值 */}
        <div className="h-32 border border-cyan-500/10 rounded bg-cyan-950/40 overflow-hidden">
          <WaterQualityDiffChart data={alarmData.upstreamDownstreamDiff} />
        </div>
      </div>

      {/* Footer - 判断说明 */}
      <div className="px-3 py-2 border-t border-cyan-500/20 bg-cyan-950/80">
        <p className="text-xs text-cyan-300/70 leading-relaxed">
          判断依据：降雨后COD、电导率、流量同步异常上升，上下游水质差突变明显，符合{isSewageToRain ? '污水混入雨水' : '雨水混入污水'}特征。
        </p>
      </div>
    </div>
  )
}
