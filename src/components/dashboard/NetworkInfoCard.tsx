import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { NetworkStatistics } from '../../types/drainage'

interface NetworkInfoCardProps {
  data: NetworkStatistics
  className?: string
}

export function NetworkInfoCard({ data, className = '' }: NetworkInfoCardProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(2, 15, 28, 0.95)',
        borderColor: 'rgba(34, 211, 238, 0.6)',
        borderWidth: 1,
        textStyle: {
          color: '#e0f2fe',
          fontSize: 12,
        },
        formatter: (params: { name: string; value: number }) => {
          const values = [data.rainPipeLength, data.sewagePipeLength, data.mixedPipeLength]
          const total = values.reduce((a, b) => a + b, 0)
          const percent = ((params.value / total) * 100).toFixed(1)
          return `${params.name}<br/>长度: ${params.value} km<br/>占比: ${percent}%`
        },
      },
      legend: {
        orient: 'horizontal',
        top: 'bottom',
        left: 'center',
        textStyle: {
          color: '#7dd3fc',
          fontSize: 11,
        },
        itemWidth: 14,
        itemHeight: 10,
        itemGap: 16,
        padding: [8, 0, 0, 0],
      },
      series: [
        {
          name: '管道类型',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: (params: { name: string; value: number }) => {
              const values = [data.rainPipeLength, data.sewagePipeLength, data.mixedPipeLength]
              const total = values.reduce((a, b) => a + b, 0)
              const percent = ((params.value / total) * 100).toFixed(1)
              return `${params.name}\n${percent}%`
            },
            color: '#7dd3fc',
            fontSize: 11,
            fontWeight: 500,
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: 'rgba(34, 211, 238, 0.5)',
              width: 1,
            },
          },
          data: [
            {
              value: data.rainPipeLength,
              name: '雨水管道',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#0ea5e9' },
                    { offset: 1, color: '#38bdf8' },
                  ],
                },
                borderColor: '#7dd3fc',
                borderWidth: 1,
              },
            },
            {
              value: data.sewagePipeLength,
              name: '污水管道',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#06b6d4' },
                    { offset: 1, color: '#22d3ee' },
                  ],
                },
                borderColor: '#67e8f9',
                borderWidth: 1,
              },
            },
            {
              value: data.mixedPipeLength,
              name: '混合管道',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#f59e0b' },
                    { offset: 1, color: '#fbbf24' },
                  ],
                },
                borderColor: '#fcd34d',
                borderWidth: 1,
              },
            },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(34, 211, 238, 0.5)',
            },
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  return (
    <article
      className={`flex h-full flex-col rounded border border-cyan-200/28 bg-[#053452]/48 shadow-[0_0_24px_rgba(56,189,248,0.16),inset_0_0_18px_rgba(8,145,178,0.1)] backdrop-blur-sm ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
        <h2 className="text-sm font-medium text-cyan-50">管网信息</h2>
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 px-4">
        <div className="flex flex-col rounded-lg border border-cyan-200/18 bg-cyan-950/32 px-3 py-2">
          <span className="text-[10px] text-cyan-100/56">管网总长</span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-lg font-semibold leading-none text-cyan-50">
              {data.totalLength}
            </span>
            <span className="text-xs text-cyan-100/64">km</span>
          </div>
        </div>
        <div className="flex flex-col rounded-lg border border-cyan-200/18 bg-cyan-950/32 px-3 py-2">
          <span className="text-[10px] text-cyan-100/56">管网覆盖率</span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-lg font-semibold leading-none text-cyan-50">
              {data.coverageRate}
            </span>
            <span className="text-xs text-cyan-100/64">%</span>
          </div>
        </div>
        <div className="flex flex-col rounded-lg border border-cyan-200/18 bg-cyan-950/32 px-3 py-2">
          <span className="text-[10px] text-cyan-100/56">覆盖面积</span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-lg font-semibold leading-none text-cyan-50">
              {data.coverageArea}
            </span>
            <span className="text-xs text-cyan-100/64">km²</span>
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 px-4 pb-4">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </article>
  )
}
