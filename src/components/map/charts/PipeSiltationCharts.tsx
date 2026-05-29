import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { PipeSiltationSeries } from '../../../types/drainage'

interface PipeSiltationChartProps {
  data: PipeSiltationSeries[]
}

function buildAxisMax(values: number[], minStep: number): number {
  const maxValue = Math.max(...values, minStep)
  return Math.ceil((maxValue * 1.18) / minStep) * minStep
}

export function PipeSiltationWaterLevelChart({ data }: PipeSiltationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const levelAxisMax = buildAxisMax(
    data.flatMap((item) => [
      item.upstreamWaterLevel,
      item.downstreamWaterLevel,
      item.waterLevelDiff,
    ]),
    0.5,
  )

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const option: echarts.EChartsOption = {
      grid: { left: '8%', right: '8%', top: '25%', bottom: '13%', containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2, 15, 28, 0.92)',
        borderColor: 'rgba(248, 113, 113, 0.55)',
        textStyle: { color: '#e0f2fe', fontSize: 11 },
      },
      legend: {
        data: ['上游水位', '下游水位', '水位差'],
        top: 2,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 10,
        textStyle: { color: '#bae6fd', fontSize: 10 },
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date),
        axisLabel: { color: '#7dd3fc', fontSize: 10, interval: 0, margin: 6 },
        axisLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.4)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '水位(m)',
        max: levelAxisMax,
        nameTextStyle: { color: '#7dd3fc', fontSize: 9, padding: [0, 0, 0, -8] },
        axisLabel: { color: '#7dd3fc', fontSize: 9, margin: 3 },
        splitLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.12)', type: 'dashed' } },
      },
      series: [
        {
          name: '上游水位',
          type: 'line',
          data: data.map((item) => item.upstreamWaterLevel),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#fb7185', width: 2 },
          itemStyle: { color: '#1e1b18', borderColor: '#fb7185', borderWidth: 2 },
          areaStyle: { color: 'rgba(248, 113, 113, 0.16)' },
        },
        {
          name: '下游水位',
          type: 'line',
          data: data.map((item) => item.downstreamWaterLevel),
          smooth: true,
          symbol: 'diamond',
          symbolSize: 5,
          lineStyle: { color: '#22d3ee', type: 'dashed', width: 2 },
          itemStyle: { color: '#082f49', borderColor: '#22d3ee', borderWidth: 2 },
        },
        {
          name: '水位差',
          type: 'line',
          data: data.map((item) => item.waterLevelDiff),
          smooth: true,
          symbol: 'triangle',
          symbolSize: 6,
          lineStyle: { color: '#facc15', width: 2 },
          itemStyle: { color: '#1e1b18', borderColor: '#facc15', borderWidth: 2 },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(248, 113, 113, 0.65)', type: 'dashed' },
            label: { color: '#fecaca', fontSize: 10, formatter: '预警阈值 0.55m' },
            data: [{ yAxis: 0.55 }],
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
  }, [data, levelAxisMax])

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}

export function PipeSiltationHydraulicChart({ data }: PipeSiltationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const flowAxisMax = buildAxisMax(data.map((item) => item.flow), 20)
  const resistanceAxisMax = buildAxisMax(data.map((item) => item.resistanceIndex), 0.01)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const option: echarts.EChartsOption = {
      grid: { left: '8%', right: '8%', top: '25%', bottom: '13%', containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2, 15, 28, 0.92)',
        borderColor: 'rgba(248, 113, 113, 0.55)',
        textStyle: { color: '#e0f2fe', fontSize: 11 },
      },
      legend: {
        data: ['流量', '流速', '阻力指数'],
        top: 2,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 10,
        textStyle: { color: '#bae6fd', fontSize: 10 },
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date),
        axisLabel: { color: '#7dd3fc', fontSize: 10, interval: 0, margin: 6 },
        axisLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.4)' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '流量',
          max: flowAxisMax,
          nameTextStyle: { color: '#7dd3fc', fontSize: 9, padding: [0, 0, 0, -8] },
          axisLabel: { color: '#7dd3fc', fontSize: 9, margin: 3 },
          splitLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.12)', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '指数',
          max: resistanceAxisMax,
          position: 'right',
          nameTextStyle: { color: '#facc15', fontSize: 9, padding: [0, -8, 0, 0] },
          axisLabel: { color: '#facc15', fontSize: 9, margin: 3 },
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: '阻力',
          max: resistanceAxisMax,
          position: 'right',
          offset: 34,
          nameTextStyle: { color: '#fb7185', fontSize: 9, padding: [0, -8, 0, 0] },
          axisLabel: { color: '#fb7185', fontSize: 9, margin: 3 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '流量',
          type: 'bar',
          data: data.map((item) => item.flow),
          barWidth: 14,
          itemStyle: { color: '#38bdf8', borderColor: '#7dd3fc', borderWidth: 1 },
        },
        {
          name: '流速',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item) => item.velocity),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#fb7185', width: 2 },
          itemStyle: { color: '#1e1b18', borderColor: '#fb7185', borderWidth: 2 },
        },
        {
          name: '阻力指数',
          type: 'line',
          yAxisIndex: 2,
          data: data.map((item) => item.resistanceIndex),
          smooth: true,
          symbol: 'triangle',
          symbolSize: 6,
          lineStyle: { color: '#facc15', width: 2 },
          itemStyle: { color: '#1e1b18', borderColor: '#facc15', borderWidth: 2 },
        },
      ],
    }

    chart.setOption(option)
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, flowAxisMax, resistanceAxisMax])

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}

export function PipeSiltationRiskChart({ data }: PipeSiltationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current
    const option: echarts.EChartsOption = {
      grid: { left: '8%', right: '5%', top: '18%', bottom: '13%', containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2, 15, 28, 0.92)',
        borderColor: 'rgba(248, 113, 113, 0.55)',
        textStyle: { color: '#e0f2fe', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date),
        axisLabel: { color: '#7dd3fc', fontSize: 10, interval: 0, margin: 6 },
        axisLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.4)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '风险',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#7dd3fc', fontSize: 9, padding: [0, 0, 0, -8] },
        axisLabel: { color: '#7dd3fc', fontSize: 9, margin: 3 },
        splitLine: { lineStyle: { color: 'rgba(34, 211, 238, 0.12)', type: 'dashed' } },
      },
      series: [
        {
          name: '淤积风险',
          type: 'line',
          data: data.map((item) => item.siltationRisk),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#1e1b18', borderColor: '#ef4444', borderWidth: 2 },
          areaStyle: { color: 'rgba(239, 68, 68, 0.18)' },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(250, 204, 21, 0.7)', type: 'dashed' },
            label: { color: '#fde68a', fontSize: 10, formatter: '高风险 80' },
            data: [{ yAxis: 80 }],
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

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}
