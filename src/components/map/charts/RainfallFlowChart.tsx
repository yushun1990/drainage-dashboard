import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DailyRainfallData, SiteFlowData } from '../../../types/drainage'

interface RainfallFlowChartProps {
  rainfallData: DailyRainfallData[]
  flowData: SiteFlowData[]
}

function buildAxisMax(values: number[], minStep: number): number {
  const maxValue = Math.max(...values, minStep)
  return Math.ceil((maxValue * 1.18) / minStep) * minStep
}

export function RainfallFlowChart({ rainfallData, flowData }: RainfallFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const rainfallAxisMax = buildAxisMax(rainfallData.map((d) => d.rainfall), 5)
    const flowAxisMax = buildAxisMax(flowData.map((d) => d.flow), 100)

    const option = {
      grid: {
        left: '8%',
        right: '8%',
        top: '26%',
        bottom: '13%',
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2, 15, 28, 0.92)',
        borderColor: 'rgba(34, 211, 238, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e0f2fe',
          fontSize: 11,
        },
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#22d3ee',
            type: 'dashed',
            width: 1,
          },
        },
      },
      legend: {
        data: ['降雨量', '流量'],
        textStyle: {
          color: '#7dd3fc',
          fontSize: 10,
        },
        top: 2,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
      },
      xAxis: {
        type: 'category',
        data: rainfallData.map((d) => d.date),
        axisLabel: {
          color: '#7dd3fc',
          fontSize: 10,
          interval: 0,
          margin: 6,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.4)',
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '降雨量(mm)',
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
            margin: 3,
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(34, 211, 238, 0.12)',
              type: 'dashed',
              dashOffset: 4,
            },
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(34, 211, 238, 0.4)',
            },
          },
          max: rainfallAxisMax,
        },
        {
          type: 'value',
          name: '流量(L/s)',
          position: 'right',
          nameTextStyle: {
            color: '#0ea5e9',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#0ea5e9',
            fontSize: 9,
            margin: 3,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(14, 165, 233, 0.4)',
            },
          },
          max: flowAxisMax,
        },
      ],
      series: [
        {
          name: '降雨量',
          type: 'bar',
          data: rainfallData.map((d) => d.rainfall),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#38bdf8' },
                { offset: 0.5, color: '#0ea5e9' },
                { offset: 1, color: '#0284c7' },
              ],
            },
            borderRadius: [2, 2, 0, 0],
            borderColor: '#7dd3fc',
            borderWidth: 1,
          },
          barWidth: 14,
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#7dd3fc' },
                  { offset: 1, color: '#0284c7' },
                ],
              },
              borderColor: '#bae6fd',
              borderWidth: 1,
            },
          },
        },
        {
          name: '流量',
          type: 'line',
          yAxisIndex: 1,
          data: flowData.map((d) => d.flow),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            color: '#f59e0b',
            width: 2,
            shadowColor: '#f59e0b',
            shadowBlur: 8,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#f59e0b',
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
                { offset: 0, color: 'rgba(245, 158, 11, 0.35)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
              ],
            },
          },
          emphasis: {
            itemStyle: {
              color: '#f59e0b',
              borderColor: '#fcd34d',
              borderWidth: 2,
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
  }, [rainfallData, flowData])

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
