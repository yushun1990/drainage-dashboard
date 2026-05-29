import type { RainPipeHydraulicSeries, RainPipeInflowInfiltrationDetail } from '../types/drainage'
import { addDatesToData, buildRecentFixedTime, formatDateMinute } from '../utils/dateUtils'

const district112HydraulicValues: Array<Omit<RainPipeHydraulicSeries, 'date'>> = [
  { rainfall: 0, flow: 18, pipeWaterLevel: 0.34, externalWaterLevel: 0.31 },
  { rainfall: 0, flow: 21, pipeWaterLevel: 0.36, externalWaterLevel: 0.34 },
  { rainfall: 0, flow: 24, pipeWaterLevel: 0.38, externalWaterLevel: 0.37 },
  { rainfall: 18.6, flow: 186, pipeWaterLevel: 0.92, externalWaterLevel: 0.52 },
  { rainfall: 32.4, flow: 312, pipeWaterLevel: 1.28, externalWaterLevel: 0.84 },
  { rainfall: 6.8, flow: 168, pipeWaterLevel: 1.06, externalWaterLevel: 0.98 },
  { rainfall: 0, flow: 82, pipeWaterLevel: 0.81, externalWaterLevel: 0.86 },
]

export function getDistrict112InflowInfiltrationDetail(
  currentTime = new Date(),
): RainPipeInflowInfiltrationDetail {
  const alarmTime = buildRecentFixedTime(currentTime, 1, 16, 40)

  return {
    districtId: '112',
    districtName: '温馨小区',
    pipeSystem: 'rainwater',
    riskType: 'external-water-infiltration',
    alarmTime: formatDateMinute(alarmTime),
    alarmLevel: 'medium',
    riskScore: 76,
    summary: '雨水管网晴天仍有持续低流量，雨停后退水时间延长，疑似外水入渗或下游顶托。',
    evidence:
      '雨水井降雨汇水属于正常入流；本次预警依据为晴天持续有水、雨后流量不回落，以及管内水位与外水位同步抬升。',
    metrics: [
      { label: '晴天持续流量', value: '18-24 L/s', status: 'warning' },
      { label: '雨后退水时长', value: '6.5 h', status: 'warning' },
      { label: '峰值管内水位', value: '1.28 m', status: 'warning' },
      { label: '外水位相关性', value: '0.86', status: 'critical' },
    ],
    hydraulicSeries: addDatesToData(district112HydraulicValues, currentTime),
  }
}

export function getInflowInfiltrationDataMap(
  currentTime = new Date(),
): Record<string, RainPipeInflowInfiltrationDetail> {
  return {
    '112': getDistrict112InflowInfiltrationDetail(currentTime),
  }
}
