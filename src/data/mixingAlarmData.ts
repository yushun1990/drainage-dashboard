import type {
  MixingAlarmDetail,
  DailyRainfallData,
  WaterQualityData,
  DailyFlowData,
  WaterQualityDiffData,
} from '../types/drainage'
import { addDatesToData, buildRecentFixedTime, formatDateMinute } from '../utils/dateUtils'

// 站点155雨污混接预警数据
// 场景：污水混入雨水管（sewage-to-rain）
// 预警依据：降雨后COD异常升高、电导率突变、流量异常增长

const site155RainfallValues: Array<Omit<DailyRainfallData, 'date'>> = [
  { rainfall: 0 },
  { rainfall: 0 },
  { rainfall: 0 },
  { rainfall: 12.5 },
  { rainfall: 28.3 },
  { rainfall: 8.2 },
  { rainfall: 0 },
]

const site155WaterQualityValues: Array<Omit<WaterQualityData, 'date'>> = [
  // 降雨前：正常雨水水质
  { cod: 15, ammoniaNitrogen: 0.8, totalPhosphorus: 0.15, ph: 7.2 },
  { cod: 14, ammoniaNitrogen: 0.7, totalPhosphorus: 0.12, ph: 7.3 },
  { cod: 16, ammoniaNitrogen: 0.9, totalPhosphorus: 0.18, ph: 7.1 },
  // 降雨后：污水混入雨水管，水质指标异常升高
  { cod: 52, ammoniaNitrogen: 4.2, totalPhosphorus: 1.8, ph: 6.5 },
  { cod: 85, ammoniaNitrogen: 8.5, totalPhosphorus: 3.2, ph: 6.1 },
  { cod: 48, ammoniaNitrogen: 3.8, totalPhosphorus: 1.5, ph: 6.4 },
  { cod: 22, ammoniaNitrogen: 1.2, totalPhosphorus: 0.35, ph: 6.9 },
]

const site155FlowValues: Array<Omit<DailyFlowData, 'date'>> = [
  // 晴天流量：正常雨水径流
  { flow: 120 },
  { flow: 115 },
  { flow: 125 },
  // 降雨后：混入污水导致流量异常增长
  { flow: 380 },
  { flow: 480 },
  { flow: 290 },
  { flow: 135 },
]

const site155UpstreamDownstreamDiffValues: Array<Omit<WaterQualityDiffData, 'date'>> = [
  // 当前点与上游点的水质差值（正值表示当前点高于上游）
  { codDiff: 2, phDiff: -0.1, conductivityDiff: 15 },
  { codDiff: 1, phDiff: 0, conductivityDiff: 12 },
  { codDiff: 3, phDiff: -0.2, conductivityDiff: 18 },
  // 降雨后：差值突变明显
  { codDiff: 38, phDiff: -0.8, conductivityDiff: 280 },
  { codDiff: 72, phDiff: -1.2, conductivityDiff: 450 },
  { codDiff: 35, phDiff: -0.6, conductivityDiff: 198 },
  { codDiff: 8, phDiff: -0.3, conductivityDiff: 45 },
]

// 站点133雨污混接预警数据
// 场景：雨水混入污水管（rain-to-sewage）
// 预警依据：降雨后污水井流量突增，COD/氨氮被稀释，电导率同步下降

const site133RainfallValues: Array<Omit<DailyRainfallData, 'date'>> = [
  { rainfall: 0 },
  { rainfall: 0 },
  { rainfall: 0 },
  { rainfall: 12.5 },  // 降雨开始
  { rainfall: 28.3 },  // 持续降雨
  { rainfall: 8.2 },   // 降雨减弱
  { rainfall: 0 },
]

const site133WaterQualityValues: Array<Omit<WaterQualityData, 'date'>> = [
  // 降雨前：污水井水质稳定
  { cod: 326, ammoniaNitrogen: 27.5, totalPhosphorus: 4.8, ph: 7.1 },
  { cod: 338, ammoniaNitrogen: 28.2, totalPhosphorus: 5.0, ph: 7.0 },
  { cod: 318, ammoniaNitrogen: 26.8, totalPhosphorus: 4.6, ph: 7.1 },
  // 降雨后：雨水进入污水管，污染物浓度被明显稀释
  { cod: 206, ammoniaNitrogen: 17.4, totalPhosphorus: 3.2, ph: 7.2 },
  { cod: 142, ammoniaNitrogen: 11.6, totalPhosphorus: 2.1, ph: 7.3 },
  { cod: 188, ammoniaNitrogen: 15.2, totalPhosphorus: 2.8, ph: 7.2 },
  { cod: 286, ammoniaNitrogen: 23.5, totalPhosphorus: 4.1, ph: 7.1 },
]

const site133FlowValues: Array<Omit<DailyFlowData, 'date'>> = [
  // 晴天流量：污水管基准流量
  { flow: 178 },
  { flow: 182 },
  { flow: 176 },
  // 降雨后：外水进入导致污水管流量突增
  { flow: 412 },
  { flow: 566 },
  { flow: 438 },
  { flow: 224 },
]

const site133UpstreamDownstreamDiffValues: Array<Omit<WaterQualityDiffData, 'date'>> = [
  // 当前点与上游点的水质差值（负值表示当前点被雨水稀释）
  { codDiff: -4, phDiff: 0, conductivityDiff: -18 },
  { codDiff: -6, phDiff: 0.1, conductivityDiff: -22 },
  { codDiff: -3, phDiff: 0, conductivityDiff: -16 },
  // 降雨后：当前点浓度、电导率较上游显著下降
  { codDiff: -92, phDiff: 0.2, conductivityDiff: -238 },
  { codDiff: -168, phDiff: 0.3, conductivityDiff: -386 },
  { codDiff: -118, phDiff: 0.2, conductivityDiff: -284 },
  { codDiff: -36, phDiff: 0.1, conductivityDiff: -74 },
]

export function getSite155MixingAlarmDetail(currentTime = new Date()): MixingAlarmDetail {
  const alarmTime = buildRecentFixedTime(currentTime, 2, 9, 30)

  return {
    siteId: 'site-155',
    siteName: '淳开线雨水井',
    affectedPipe: '淳开线雨水支管',
    alarmType: 'sewage-to-rain',
    alarmTime: formatDateMinute(alarmTime),
    alarmLevel: 'high',
    description: '降雨后COD升至85mg/L，氨氮与总磷同步抬升，流量峰值达到480L/s，疑似污水接入雨水管网。',
    rainfallData: addDatesToData(site155RainfallValues, currentTime),
    waterQualityData: addDatesToData(site155WaterQualityValues, currentTime),
    flowData: addDatesToData(site155FlowValues, currentTime),
    upstreamDownstreamDiff: addDatesToData(site155UpstreamDownstreamDiffValues, currentTime),
  }
}

export function getSite133MixingAlarmDetail(currentTime = new Date()): MixingAlarmDetail {
  const alarmTime = buildRecentFixedTime(currentTime, 1, 14, 20)

  return {
    siteId: 'site-133',
    siteName: '二桥右侧排污口',
    affectedPipe: '二桥右侧污水支管',
    alarmType: 'rain-to-sewage',
    alarmTime: formatDateMinute(alarmTime),
    alarmLevel: 'high',
    description: '降雨后污水井流量峰值升至566L/s，COD与氨氮同步下降，电导率较上游明显降低，疑似雨水接入污水管网。',
    rainfallData: addDatesToData(site133RainfallValues, currentTime),
    waterQualityData: addDatesToData(site133WaterQualityValues, currentTime),
    flowData: addDatesToData(site133FlowValues, currentTime),
    upstreamDownstreamDiff: addDatesToData(site133UpstreamDownstreamDiffValues, currentTime),
  }
}

export function getMixingAlarmDataMap(currentTime = new Date()): Record<string, MixingAlarmDetail> {
  return {
    'site-155': getSite155MixingAlarmDetail(currentTime),
    'site-133': getSite133MixingAlarmDetail(currentTime),
  }
}
