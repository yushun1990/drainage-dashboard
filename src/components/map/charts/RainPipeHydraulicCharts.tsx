import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { RainPipeHydraulicSeries } from '../../../types/drainage'

interface RainPipeHydraulicChartProps {
  data: RainPipeHydraulicSeries[]
}

function buildAxisMax(values: number[], minStep: number): number {
  const maxValue = Math.max(...values, minStep)
  return Math.ceil((maxValue * 1.18) / minStep) * minStep
}

export function RainPipeRainfallFlowChart({ data }: RainPipeHydraulicChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const rainfallAxisMax = buildAxisMax(data.map((item) => item.rainfall), 10)
  const flowAxisMax = buildAxisMax(data.map((item) => item.flow), 100)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const option: echarts.EChartsOption = {
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
      },
      legend: {
        data: ['降雨量', '雨水管流量'],
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
        data: data.map((item) => item.date),
        axisLabel: {
          color: '#7dd3fc',
          fontSize: 10,
          interval: 0,
          margin: 6,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.4)',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '降雨(mm)',
          max: rainfallAxisMax,
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
            },
          },
        },
        {
          type: 'value',
          name: '流量(L/s)',
          max: flowAxisMax,
          position: 'right',
          nameTextStyle: {
            color: '#facc15',
            fontSize: 9,
            padding: [0, -8, 0, 0],
          },
          axisLabel: {
            color: '#facc15',
            fontSize: 9,
            margin: 3,
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: '降雨量',
          type: 'bar',
          data: data.map((item) => item.rainfall),
          barWidth: 14,
          itemStyle: {
            color: '#38bdf8',
            borderColor: '#7dd3fc',
            borderRadius: [2, 2, 0, 0],
            borderWidth: 1,
          },
        },
        {
          name: '雨水管流量',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item) => item.flow),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            color: '#facc15',
            width: 2,
            shadowBlur: 8,
            shadowColor: '#facc15',
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#facc15',
            borderWidth: 2,
          },
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(250, 204, 21, 0.08)',
            },
            data: [[{ name: '雨后退水异常', xAxis: data[5]?.date }, { xAxis: data[6]?.date }]],
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
  }, [data, rainfallAxisMax, flowAxisMax])

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}

export function RainPipeWaterLevelChart({ data }: RainPipeHydraulicChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const waterLevelAxisMax = buildAxisMax(
    data.flatMap((item) => [item.pipeWaterLevel, item.externalWaterLevel]),
    0.5,
  )

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const option: echarts.EChartsOption = {
      grid: {
        left: '8%',
        right: '6%',
        top: '24%',
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
      },
      legend: {
        data: ['管内水位', '外水位'],
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
        data: data.map((item) => item.date),
        axisLabel: {
          color: '#7dd3fc',
          fontSize: 10,
          interval: 0,
          margin: 6,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(34, 211, 238, 0.4)',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        name: '水位(m)',
        max: waterLevelAxisMax,
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
          },
        },
      },
      series: [
        {
          name: '管内水位',
          type: 'line',
          data: data.map((item) => item.pipeWaterLevel),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            color: '#f59e0b',
            width: 2,
          },
          itemStyle: {
            color: '#1e1b18',
            borderColor: '#f59e0b',
            borderWidth: 2,
          },
          areaStyle: {
            color: 'rgba(245, 158, 11, 0.16)',
          },
        },
        {
          name: '外水位',
          type: 'line',
          data: data.map((item) => item.externalWaterLevel),
          smooth: true,
          symbol: 'diamond',
          symbolSize: 5,
          lineStyle: {
            color: '#22d3ee',
            type: 'dashed',
            width: 2,
          },
          itemStyle: {
            color: '#082f49',
            borderColor: '#22d3ee',
            borderWidth: 2,
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
  }, [data, waterLevelAxisMax])

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}
