import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts'
import type { DailyFlowData } from '../../types/drainage'
import { getLast7Days } from '../../utils/dateUtils'

interface DailyFlowChartProps {
  data: Array<Omit<DailyFlowData, 'date'>>
  className?: string
}

export function DailyFlowChart({ data, className = '' }: DailyFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // 动态生成最近7天日期
  const dates = useMemo(() => getLast7Days(), [])

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    const option = {
      grid: {
        left: '3%',
        right: '4%',
        top: '15%',
        bottom: '3%',
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2, 15, 28, 0.95)',
        borderColor: 'rgba(34, 211, 238, 0.6)',
        borderWidth: 1,
        textStyle: {
          color: '#e0f2fe',
          fontSize: 11,
        },
        formatter: (params: unknown) => {
          if (Array.isArray(params) && params.length > 0) {
            const firstParam = params[0] as { name: string; value: number }
            return `${firstParam.name}<br/>进水量: ${firstParam.value} m³`
          }
          return ''
        },
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#22d3ee',
            type: 'dashed',
          },
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: '#7dd3fc',
          fontSize: 10,
          interval: 0,
          margin: 12,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.6)',
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        name: 'm³',
        position: 'left',
        show: true,
        nameTextStyle: {
          color: '#7dd3fc',
          fontSize: 9,
          padding: [0, 0, 0, -8],
        },
        axisLabel: {
          color: '#7dd3fc',
          fontSize: 9,
          margin: 4,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.2)',
            type: 'dashed',
            dashOffset: 4,
          },
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.5)',
          },
        },
      },
      series: [
        {
          name: '进水量',
          type: 'line',
          data: data.map((d) => d.flow),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            color: '#0ea5e9',
            width: 2.5,
            shadowColor: '#0ea5e9',
            shadowBlur: 8,
          },
          itemStyle: {
            color: '#021927',
            borderColor: '#0ea5e9',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(14, 165, 233, 0.4)' },
                { offset: 1, color: 'rgba(14, 165, 233, 0.02)' },
              ],
            },
          },
          emphasis: {
            itemStyle: {
              color: '#0ea5e9',
              borderColor: '#7dd3fc',
              borderWidth: 2,
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 4700,
                lineStyle: {
                  color: '#f59e0b',
                  type: 'dashed',
                  width: 1.5,
                },
                label: {
                  show: true,
                  position: 'insideEndTop',
                  formatter: '4700',
                  color: '#fbbf24',
                  fontSize: 9,
                },
              },
            ],
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
  }, [data, dates])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
