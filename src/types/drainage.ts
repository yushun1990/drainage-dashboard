export type HealthStatus = 'healthy' | 'warning' | 'critical'

export type AlarmLevel = 'info' | 'warning' | 'critical'

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
