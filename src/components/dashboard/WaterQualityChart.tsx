import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts'
import type { WaterQualityData } from '../../types/drainage'
import { getLast7Days } from '../../utils/dateUtils'

interface WaterQualityChartProps {
  data: Array<Omit<WaterQualityData, 'date'>>
  className?: string
}

export function WaterQualityChart({ data, className = '' }: WaterQualityChartProps) {
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
        left: '2%',
        right: '6%',
        top: '12%',
        bottom: '0%',
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
        data: ['COD', 'pH'],
        textStyle: {
          color: '#7dd3fc',
          fontSize: 10,
        },
        top: '0%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 6,
        itemGap: 8,
      },
      xAxis: {
        type: 'category',
        data: dates,
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
          name: 'mg/L',
          position: 'left',
          show: true,
          nameTextStyle: {
            color: '#7dd3fc',
            fontSize: 9,
            padding: [0, 0, 0, -6],
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
        },
        {
          type: 'value',
          name: 'pH',
          position: 'right',
          nameTextStyle: {
            color: '#c4b5fd',
            fontSize: 9,
            padding: [0, -6, 0, 0],
          },
          axisLabel: {
            color: '#c4b5fd',
            fontSize: 9,
            margin: 3,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(167, 139, 250, 0.4)',
            },
          },
          min: 6,
          max: 8,
        },
      ],
      series: [
        {
          name: 'COD',
          type: 'line',
          data: data.map((d) => d.cod),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: true,
          lineStyle: {
            color: '#0ea5e9',
            width: 2,
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
        },
        {
          name: 'pH',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d) => d.ph),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: true,
          lineStyle: {
            color: '#a78bfa',
            width: 1.5,
            type: 'dashed',
            shadowColor: '#a78bfa',
            shadowBlur: 6,
          },
          itemStyle: {
            color: '#021927',
            borderColor: '#a78bfa',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: '#a78bfa',
              borderColor: '#c4b5fd',
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
  }, [data, dates])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
