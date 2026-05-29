export type HealthStatus = 'healthy' | 'warning' | 'critical'

export type AlarmLevel = 'low' | 'medium' | 'high'

export interface KpiMetric {
  id: string
  label: string
  value: string
  unit?: string
  status: HealthStatus
}

export interface PanelSummary {
  id: string
  title: string
  metric: string
  description: string
  status: HealthStatus
}

export interface DrainageAlarm {
  id: string
  time: string
  level: AlarmLevel
  location: string
  message: string
}

export interface MapLayerSummary {
  id: string
  label: string
  count: number
  status: HealthStatus
}

export type Coordinate = [longitude: number, latitude: number]

export type PipeCategory = 'rainwater' | 'sewage'

export type MapPointCategory =
  | 'household'
  | 'sewage-well'
  | 'outfall'
  | 'pump-station'
  | 'water-meter'
  | 'rain-well'

export type RiskAreaCategory =
  | 'rain-sewage-mixing'
  | 'dry-wet-ratio'
  | 'siltation'
  | 'inflow-infiltration'
  | 'district'

export interface DrainagePipeSegment {
  id: string
  name: string
  category: PipeCategory
  status: HealthStatus
  diameter: number
  coordinates: Coordinate[]
}

export interface DrainageWaterway {
  id: string
  name: string
  coordinates: Coordinate[]
}

export interface DrainageMapPoint {
  id: string
  name: string
  category: MapPointCategory
  status: HealthStatus
  coordinate: Coordinate
  address?: string
  deviceIds?: string[]
  normalIconUrl?: string
  alarmIconUrl?: string
}

export interface DrainageRiskArea {
  id: string
  name: string
  category: RiskAreaCategory
  status: HealthStatus
  coordinates: Coordinate[]
}

export interface DrainageMapDataset {
  center: Coordinate
  bounds: [Coordinate, Coordinate]
  focusBoundary: Coordinate[]
  waterways: DrainageWaterway[]
  pipes: DrainagePipeSegment[]
  points: DrainageMapPoint[]
  riskAreas: DrainageRiskArea[]
}

export interface DistrictRainRatio {
  district: string
  rainyWeatherFlow: number  // 雨天流量
  dryWeatherFlow: number     // 旱流流量
  ratio: number              // 晴雨比
}

export interface NetworkStatistics {
  totalLength: number        // 管网总长 (km)
  coverageRate: number       // 管网覆盖率 (%)
  coverageArea: number      // 覆盖面积 (km²)
  rainPipeLength: number    // 雨水管道长度 (km)
  sewagePipeLength: number  // 污水管道长度 (km)
  mixedPipeLength: number   // 混合管道长度 (km)
}

export interface WaterQualityData {
  date: string               // 日期 MM-DD
  cod: number                // COD (mg/L)
  ammoniaNitrogen: number   // 氨氮 (mg/L)
  totalPhosphorus: number   // 总磷 (mg/L)
  ph: number                // pH 值
}

export interface DailyRainRatioData {
  date: string               // 日期 MM-DD
  rainyWeatherFlow: number  // 雨天流量 (万m³)
  dryWeatherFlow: number    // 旱流流量 (万m³)
  ratio: number             // 晴雨比
}

export interface DailyFlowData {
  date: string               // 日期 MM-DD
  flow: number              // 进水量 (万m³)
}

// 雨污混接预警类型
export type RainSewageMixingType = 'rain-to-sewage' | 'sewage-to-rain'

// 雨污混接预警详情数据
export interface MixingAlarmDetail {
  siteId: string
  siteName: string
  affectedPipe: string
  alarmType: RainSewageMixingType
  alarmTime: string
  alarmLevel: AlarmLevel
  description: string
  // 支撑数据
  rainfallData: DailyRainfallData[]      // 近7日降雨量
  waterQualityData: WaterQualityData[]   // 近7日水质指标
  flowData: DailyFlowData[]               // 近7日流量数据
  upstreamDownstreamDiff: WaterQualityDiffData[]  // 上下游水质差
}

export interface DailyRainfallData {
  date: string      // MM-DD
  rainfall: number  // 降雨量 (mm)
}

export interface WaterQualityDiffData {
  date: string
  codDiff: number   // COD差值 (当前点 - 上游点) mg/L
  phDiff: number
  conductivityDiff: number  // 电导率差值 μS/cm
}

export interface SiteFlowData {
  date: string      // MM-DD
  flow: number      // 流量 (L/s)
}
