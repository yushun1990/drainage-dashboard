import { useMemo } from 'react'
import { getSiltationWarningDataMap } from '../../data/siltationWarningData'
import { useCurrentTime } from '../../hooks/useCurrentTime'

interface DistrictSiltationPopupProps {
  districtId: string
}

interface SiltationMetricTableRow {
  category?: string
  categoryRowSpan?: number
  name: string
  currentValue: string
  benchmark: string[]
  deviation?: {
    trend: 'up' | 'down'
    value: string
  }
  conclusion?: string
}

const siltationMetricRows: SiltationMetricTableRow[] = [
  {
    category: '瞬时工况',
    categoryRowSpan: 4,
    name: '实时水位',
    currentValue: '0.45m',
    benchmark: ['180日晴时均值', '0.35m'],
    deviation: { trend: 'up', value: '28.5%' },
  },
  {
    name: '瞬时流速',
    currentValue: '0.07m/s',
    benchmark: ['180日晴时均值', '0.16m/s'],
    deviation: { trend: 'down', value: '56.2%' },
  },
  {
    name: '瞬时流量',
    currentValue: '57.3m³/h',
    benchmark: ['/'],
  },
  {
    name: '降雨强度',
    currentValue: '0',
    benchmark: ['/'],
  },
  {
    category: '长期趋势',
    categoryRowSpan: 3,
    name: '7日均水位',
    currentValue: '0.43m',
    benchmark: ['30日移动平均', '0.39m'],
    deviation: { trend: 'up', value: '10.3%' },
  },
  {
    name: '7日均流速',
    currentValue: '0.12m/s',
    benchmark: ['30日移动平均', '0.14m'],
    deviation: { trend: 'down', value: '14.3%' },
  },
  {
    name: '水位-流速背离度',
    currentValue: '0.479',
    benchmark: ['历史正常阈值', '< 0.20'],
    conclusion: '中度偏离',
  },
]

export function DistrictSiltationPopup({ districtId }: DistrictSiltationPopupProps) {
  const currentTime = useCurrentTime()
  const detailMap = useMemo(() => getSiltationWarningDataMap(currentTime), [currentTime])
  const detail = detailMap[districtId]

  if (!detail) {
    return null
  }

  return (
    <div className="drainage-siltation-popup-panel min-w-[500px] max-w-[560px] text-cyan-50">
      <div className="flex min-h-12 shrink-0 items-center border-b border-red-400/20 bg-gradient-to-r from-red-950/95 via-slate-950/95 to-cyan-950/95 pl-4 pr-12">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium leading-5 text-white">
              {detail.districtName} · 污水管网
            </h3>
          </div>
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded border border-red-400/50 bg-red-400/20 px-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-300" />
            <span className="whitespace-nowrap text-xs font-medium leading-none text-red-200">
              淤积预警
            </span>
          </span>
        </div>
      </div>

      <div className="shrink-0 border-b border-red-400/10 bg-red-950/20 px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-200">预警时间：</span>
            <span className="text-xs text-cyan-100">{detail.alarmTime}</span>
          </div>
          <span className="rounded border border-red-300/30 bg-red-300/10 px-2 py-0.5 text-xs font-semibold text-red-200">
            风险指数 {detail.riskScore}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-red-100/90">{detail.summary}</p>
      </div>

      <div className="drainage-siltation-popup-scroll bg-slate-950/80 p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-100">淤积风险监测指标</span>
          <span className="rounded border border-red-300/25 bg-red-300/10 px-2 py-0.5 text-[10px] text-red-100">
            水位升高 · 流速下降
          </span>
        </div>

        <div className="overflow-hidden rounded border border-red-300/25 bg-cyan-950/35 shadow-[0_0_18px_rgb(248_113_113_/_0.12)]">
          <table className="w-full table-fixed border-collapse text-center text-[11px] leading-[1.15] text-cyan-50">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[25%]" />
              <col className="w-[16%]" />
              <col className="w-[28%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-red-950/80 via-slate-900 to-cyan-950/80 text-[11px] font-semibold text-cyan-100">
                <th className="border border-cyan-300/20 px-1 py-1">指标类型</th>
                <th className="border border-cyan-300/20 px-1 py-1">监测指标</th>
                <th className="border border-cyan-300/20 px-1 py-1">当前值</th>
                <th className="border border-cyan-300/20 px-1 py-1">对比基准</th>
                <th className="border border-cyan-300/20 px-1 py-1">偏差</th>
              </tr>
            </thead>
            <tbody>
              {siltationMetricRows.map((row) => (
                <tr className="bg-slate-950/35 odd:bg-cyan-950/20" key={row.name}>
                  {row.category ? (
                    <td
                      className="border border-cyan-300/15 bg-red-950/20 px-1 py-1 text-[11px] font-semibold text-red-100"
                      rowSpan={row.categoryRowSpan}
                    >
                      {row.category}
                    </td>
                  ) : null}
                  <td className="border border-cyan-300/15 px-1 py-1 font-semibold text-cyan-100">
                    {row.name}
                  </td>
                  <td className="border border-cyan-300/15 px-1 py-1 font-medium text-white">
                    {row.currentValue}
                  </td>
                  <td className="border border-cyan-300/15 px-1 py-1 text-cyan-100/75">
                    {row.benchmark.map((line) => (
                      <span className="block" key={line}>
                        {line}
                      </span>
                    ))}
                  </td>
                  <td className="border border-cyan-300/15 px-1 py-1">
                    {row.deviation ? (
                      <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-red-300">
                        <span className="text-[11px]">
                          {row.deviation.trend === 'up' ? '▲' : '▼'}
                        </span>
                        <span>{row.deviation.value}</span>
                      </span>
                    ) : (
                      <span className={row.conclusion ? 'font-semibold text-amber-200' : ''}>
                        {row.conclusion ?? ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 border-t border-cyan-500/20 bg-cyan-950/80 px-3 py-2">
        <p className="text-xs leading-relaxed text-cyan-300/75">判断依据：{detail.evidence}</p>
      </div>
    </div>
  )
}
