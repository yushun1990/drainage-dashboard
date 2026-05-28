import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts'
import type { DailyRainRatioData } from '../../types/drainage'
import { getLast7Days } from '../../utils/dateUtils'

interface DailyRainRatioChartProps {
  data: Array<Omit<DailyRainRatioData, 'date'>>
  className?: string
}

export function DailyRainRatioChart({ data, className = '' }: DailyRainRatioChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)

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
        top: '22%',
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
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#22d3ee',
            type: 'dashed',
          },
        },
      },
      legend: {
        data: ['雨天流量', '旱流流量', '晴雨比'],
        textStyle: {
          color: '#22d3ee',
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
      yAxis: [
        {
          type: 'value',
          name: '流量',
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
        {
          type: 'value',
          name: '晴雨比',
          position: 'right',
          nameTextStyle: {
            color: '#fbbf24',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#fbbf24',
            fontSize: 9,
            margin: 4,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(251, 191, 36, 0.5)',
            },
          },
          min: 2,
          max: 3,
        },
      ],
      series: [
        {
          name: '雨天流量',
          type: 'bar',
          data: data.map((d) => d.rainyWeatherFlow),
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
                { offset: 1, color: '#0369a1' },
              ],
            },
            borderRadius: [2, 2, 0, 0],
            borderColor: '#7dd3fc',
            borderWidth: 1,
          },
          barWidth: 12,
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
          name: '旱流流量',
          type: 'bar',
          data: data.map((d) => d.dryWeatherFlow),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#22d3ee' },
                { offset: 0.5, color: '#06b6d4' },
                { offset: 1, color: '#0e7490' },
              ],
            },
            borderRadius: [2, 2, 0, 0],
            borderColor: '#67e8f9',
            borderWidth: 1,
          },
          barWidth: 12,
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#a5f3fc' },
                  { offset: 1, color: '#22d3ee' },
                ],
              },
              borderColor: '#cffafe',
              borderWidth: 1,
            },
          },
        },
        {
          name: '晴雨比',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d) => d.ratio),
          smooth: false,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: '#f59e0b',
            width: 2.5,
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
                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
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
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 2.5,
                lineStyle: {
                  color: '#f97316',
                  type: 'dashed',
                  width: 1.5,
                },
                label: {
                  show: true,
                  position: 'insideStartTop',
                  formatter: '2.5',
                  color: '#fb923c',
                  fontSize: 10,
                  fontWeight: 'bold',
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
  }, [data])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
