import type {
  MixingAlarmDetail,
  DailyRainfallData,
  WaterQualityData,
  SiteFlowData,
  WaterQualityDiffData,
} from '../types/drainage'

// 站点155雨污混接预警数据
// 场景：污水混入雨水管（sewage-to-rain）
// 预警依据：降雨后COD异常升高、电导率突变、流量异常增长

const site155RainfallData: DailyRainfallData[] = [
  { date: '05-21', rainfall: 0 },
  { date: '05-22', rainfall: 0 },
  { date: '05-23', rainfall: 0 },
  { date: '05-24', rainfall: 12.5 },  // 降雨开始
  { date: '05-25', rainfall: 28.3 },  // 持续降雨
  { date: '05-26', rainfall: 8.2 },   // 降雨减弱
  { date: '05-27', rainfall: 0 },
]

const site155WaterQualityData: WaterQualityData[] = [
  // 降雨前：正常雨水水质 (COD低，pH中性)
  { date: '05-21', cod: 15, ammoniaNitrogen: 0.8, totalPhosphorus: 0.15, ph: 7.2 },
  { date: '05-22', cod: 14, ammoniaNitrogen: 0.7, totalPhosphorus: 0.12, ph: 7.3 },
  { date: '05-23', cod: 16, ammoniaNitrogen: 0.9, totalPhosphorus: 0.18, ph: 7.1 },
  // 降雨后：异常变化（COD激增、pH下降、氨氮升高）→ 污水混入特征
  { date: '05-24', cod: 52, ammoniaNitrogen: 4.2, totalPhosphorus: 1.8, ph: 6.5 },
  { date: '05-25', cod: 85, ammoniaNitrogen: 8.5, totalPhosphorus: 3.2, ph: 6.1 },
  { date: '05-26', cod: 48, ammoniaNitrogen: 3.8, totalPhosphorus: 1.5, ph: 6.4 },
  { date: '05-27', cod: 22, ammoniaNitrogen: 1.2, totalPhosphorus: 0.35, ph: 6.9 },
]

const site155FlowData: SiteFlowData[] = [
  // 晴天流量：正常雨水径流
  { date: '05-21', flow: 120 },
  { date: '05-22', flow: 115 },
  { date: '05-23', flow: 125 },
  // 降雨后：流量异常增长（超过正常降雨径流量）
  { date: '05-24', flow: 380 },
  { date: '05-25', flow: 480 },
  { date: '05-26', flow: 290 },
  { date: '05-27', flow: 135 },
]

const site155UpstreamDownstreamDiff: WaterQualityDiffData[] = [
  // 当前点与上游点的水质差值（正值表示当前点高于上游）
  { date: '05-21', codDiff: 2, phDiff: -0.1, conductivityDiff: 15 },
  { date: '05-22', codDiff: 1, phDiff: 0, conductivityDiff: 12 },
  { date: '05-23', codDiff: 3, phDiff: -0.2, conductivityDiff: 18 },
  // 降雨后：差值突变明显 → 混接发生点
  { date: '05-24', codDiff: 38, phDiff: -0.8, conductivityDiff: 280 },
  { date: '05-25', codDiff: 72, phDiff: -1.2, conductivityDiff: 450 },
  { date: '05-26', codDiff: 35, phDiff: -0.6, conductivityDiff: 198 },
  { date: '05-27', codDiff: 8, phDiff: -0.3, conductivityDiff: 45 },
]

export const site155MixingAlarmDetail: MixingAlarmDetail = {
  siteId: 'site-155',
  alarmType: 'sewage-to-rain',
  alarmTime: '2026-05-25 09:30',
  alarmLevel: 'high',
  description: '检测到降雨后COD异常升高（85mg/L），电导率突变（650μS/cm），流量异常增长（480L/s），疑似污水混入雨水管网',
  rainfallData: site155RainfallData,
  waterQualityData: site155WaterQualityData,
  flowData: site155FlowData,
  upstreamDownstreamDiff: site155UpstreamDownstreamDiff,
}

// 获取站点预警数据的映射
export const mixingAlarmDataMap: Record<string, MixingAlarmDetail> = {
  'site-155': site155MixingAlarmDetail,
}
