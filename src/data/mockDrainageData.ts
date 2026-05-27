import type {
  DrainageAlarm,
  KpiMetric,
  MapLayerSummary,
  PanelSummary,
} from '../types/drainage'

export const kpiMetrics: KpiMetric[] = [
  {
    id: 'water-quality',
    label: '污水厂进水水质',
    value: 'COD 42',
    unit: 'mg/L',
    status: 'healthy',
  },
  {
    id: 'daily-flow',
    label: '今日进水量',
    value: '12.8',
    unit: '万 m3',
    status: 'warning',
  },
  {
    id: 'network-health',
    label: '管网健康评分',
    value: '86',
    unit: '分',
    status: 'healthy',
  },
]

export const leftPanelSummaries: PanelSummary[] = [
  {
    id: 'quality-trend',
    title: '最近一周进水水质',
    metric: 'COD / NH3-N',
    description: '用于承载水质趋势图表',
    status: 'healthy',
  },
  {
    id: 'flow-trend',
    title: '最近一周进水量',
    metric: '12.8 万 m3',
    description: '用于承载进水量趋势图表',
    status: 'warning',
  },
  {
    id: 'rainfall-trend',
    title: '最近一周降水量',
    metric: '38.6 mm',
    description: '用于承载降雨柱状图',
    status: 'healthy',
  },
]

export const rightPanelSummaries: PanelSummary[] = [
  {
    id: 'pipe-length',
    title: '管线等级长度对比',
    metric: '雨水 / 污水',
    description: '用于承载分级长度对比图',
    status: 'healthy',
  },
  {
    id: 'device-statistics',
    title: '设备分类统计',
    metric: '5 类设备',
    description: '用于承载设备占比图',
    status: 'healthy',
  },
  {
    id: 'device-health',
    title: '设备健康状态',
    metric: '91%',
    description: '用于承载健康状态环图',
    status: 'warning',
  },
]

export const mapLayerSummaries: MapLayerSummary[] = [
  { id: 'rain-pipes', label: '雨水管线', count: 128, status: 'healthy' },
  { id: 'sewage-pipes', label: '污水管线', count: 96, status: 'healthy' },
  { id: 'monitor-points', label: '监测点', count: 42, status: 'warning' },
  { id: 'risk-areas', label: '异常区域', count: 3, status: 'critical' },
]

export const drainageAlarms: DrainageAlarm[] = [
  {
    id: 'alarm-001',
    time: '09:18',
    level: 'critical',
    location: '城东 2 号污水井',
    message: '水质突变疑似雨污混接',
  },
  {
    id: 'alarm-002',
    time: '09:42',
    level: 'warning',
    location: '滨河片区',
    message: '晴雨比高于基准阈值',
  },
  {
    id: 'alarm-003',
    time: '10:05',
    level: 'warning',
    location: '纬三路管段',
    message: '上下游水位差持续扩大',
  },
]
