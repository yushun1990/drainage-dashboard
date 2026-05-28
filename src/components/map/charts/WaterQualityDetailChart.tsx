import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { WaterQualityData } from '../../../types/drainage'

interface WaterQualityDetailChartProps {
  data: WaterQualityData[]
}

export function WaterQualityDetailChart({ data }: WaterQualityDetailChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    const option = {
      grid: {
        left: '6%',
        right: '10%',
        top: '16%',
        bottom: '8%',
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
        data: ['COD', 'pH', '电导率'],
        textStyle: {
          color: '#7dd3fc',
          fontSize: 10,
        },
        top: '0%',
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 10,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
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
          name: 'COD(mg/L)',
          position: 'left',
          show: true,
          nameTextStyle: {
            color: '#ef4444',
            fontSize: 9,
            padding: [0, 0, 0, -8],
          },
          axisLabel: {
            color: '#ef4444',
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
              color: 'rgba(239, 68, 68, 0.4)',
            },
          },
          max: 100,
        },
        {
          type: 'value',
          name: 'pH',
          position: 'right',
          nameTextStyle: {
            color: '#a78bfa',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#a78bfa',
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
          min: 5,
          max: 8,
        },
        {
          type: 'value',
          name: '电导率(μS/cm)',
          position: 'right',
          offset: 45,
          nameTextStyle: {
            color: '#22c55e',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#22c55e',
            fontSize: 9,
            margin: 3,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(34, 197, 94, 0.4)',
            },
          },
          max: 700,
        },
      ],
      series: [
        {
          name: 'COD',
          type: 'line',
          data: data.map((d) => d.cod),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            color: '#ef4444',
            width: 2.5,
            shadowColor: '#ef4444',
            shadowBlur: 8,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#ef4444',
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
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
              ],
            },
          },
          emphasis: {
            itemStyle: {
              color: '#ef4444',
              borderColor: '#fca5a5',
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
            width: 2,
            type: 'dashed',
            shadowColor: '#a78bfa',
            shadowBlur: 6,
          },
          itemStyle: {
            color: '#1e1b18',
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
        {
          name: '电导率',
          type: 'line',
          yAxisIndex: 2,
          data: data.map((d) => d.cod * 7.5 + 100), // 模拟电导率数据（与COD相关）
          smooth: true,
          symbol: 'triangle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            color: '#22c55e',
            width: 2,
            type: 'dotted',
            shadowColor: '#22c55e',
            shadowBlur: 6,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#22c55e',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: '#22c55e',
              borderColor: '#86efac',
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
  }, [data])

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
