import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { WaterQualityDiffData } from '../../../types/drainage'

interface WaterQualityDiffChartProps {
  data: WaterQualityDiffData[]
}

export function WaterQualityDiffChart({ data }: WaterQualityDiffChartProps) {
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
        left: '8%',
        right: '8%',
        top: '16%',
        bottom: '10%',
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
        data: ['COD差值', '电导率差值'],
        textStyle: {
          color: '#7dd3fc',
          fontSize: 10,
        },
        top: '0%',
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
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
          name: 'COD差值(mg/L)',
          position: 'left',
          show: true,
          nameTextStyle: {
            color: '#f97316',
            fontSize: 9,
            padding: [0, 0, 0, -8],
          },
          axisLabel: {
            color: '#f97316',
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
              color: 'rgba(249, 115, 22, 0.4)',
            },
          },
          max: 80,
        },
        {
          type: 'value',
          name: '电导率差值(μS/cm)',
          position: 'right',
          nameTextStyle: {
            color: '#06b6d4',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#06b6d4',
            fontSize: 9,
            margin: 3,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(6, 182, 212, 0.4)',
            },
          },
          max: 500,
        },
      ],
      series: [
        {
          name: 'COD差值',
          type: 'line',
          data: data.map((d) => d.codDiff),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          lineStyle: {
            color: '#f97316',
            width: 2.5,
            shadowColor: '#f97316',
            shadowBlur: 10,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#f97316',
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
                { offset: 0, color: 'rgba(249, 115, 22, 0.4)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0.02)' },
              ],
            },
          },
          markLine: {
            silent: false,
            symbol: 'none',
            data: [
              {
                yAxis: 20,
                lineStyle: {
                  color: '#ef4444',
                  type: 'dashed',
                  width: 1.5,
                },
                label: {
                  show: true,
                  position: 'end',
                  formatter: '突变阈值',
                  color: '#fca5a5',
                  fontSize: 9,
                },
              },
            ],
          },
          emphasis: {
            itemStyle: {
              color: '#f97316',
              borderColor: '#fdba74',
              borderWidth: 2,
            },
          },
        },
        {
          name: '电导率差值',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d) => d.conductivityDiff),
          smooth: true,
          symbol: 'triangle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            color: '#06b6d4',
            width: 2,
            type: 'dashed',
            shadowColor: '#06b6d4',
            shadowBlur: 8,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#06b6d4',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: '#06b6d4',
              borderColor: '#67e8f9',
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
