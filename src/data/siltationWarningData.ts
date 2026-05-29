import type { PipeSiltationDetail, PipeSiltationSeries } from '../types/drainage'
import { addDatesToData, buildRecentFixedTime, formatDateMinute } from '../utils/dateUtils'

const district108HydraulicValues: Array<Omit<PipeSiltationSeries, 'date'>> = [
  {
    rainfall: 0,
    upstreamWaterLevel: 0.42,
    downstreamWaterLevel: 0.35,
    waterLevelDiff: 0.07,
    flow: 21,
    velocity: 0.78,
    fullness: 34,
    resistanceIndex: 0.0033,
    siltationRisk: 18,
  },
  {
    rainfall: 0,
    upstreamWaterLevel: 0.51,
    downstreamWaterLevel: 0.37,
    waterLevelDiff: 0.14,
    flow: 23,
    velocity: 0.71,
    fullness: 41,
    resistanceIndex: 0.0061,
    siltationRisk: 32,
  },
  {
    rainfall: 0.8,
    upstreamWaterLevel: 0.68,
    downstreamWaterLevel: 0.39,
    waterLevelDiff: 0.29,
    flow: 26,
    velocity: 0.62,
    fullness: 53,
    resistanceIndex: 0.0112,
    siltationRisk: 55,
  },
  {
    rainfall: 1.2,
    upstreamWaterLevel: 0.86,
    downstreamWaterLevel: 0.42,
    waterLevelDiff: 0.44,
    flow: 28,
    velocity: 0.54,
    fullness: 66,
    resistanceIndex: 0.0157,
    siltationRisk: 72,
  },
  {
    rainfall: 0,
    upstreamWaterLevel: 1.08,
    downstreamWaterLevel: 0.45,
    waterLevelDiff: 0.63,
    flow: 30,
    velocity: 0.46,
    fullness: 78,
    resistanceIndex: 0.021,
    siltationRisk: 86,
  },
  {
    rainfall: 0,
    upstreamWaterLevel: 1.21,
    downstreamWaterLevel: 0.48,
    waterLevelDiff: 0.73,
    flow: 31,
    velocity: 0.41,
    fullness: 84,
    resistanceIndex: 0.0235,
    siltationRisk: 92,
  },
  {
    rainfall: 0,
    upstreamWaterLevel: 1.17,
    downstreamWaterLevel: 0.49,
    waterLevelDiff: 0.68,
    flow: 29,
    velocity: 0.43,
    fullness: 81,
    resistanceIndex: 0.0234,
    siltationRisk: 89,
  },
]

export function getDistrict108SiltationDetail(
  currentTime = new Date(),
): PipeSiltationDetail {
  const alarmTime = buildRecentFixedTime(currentTime, 0, 16, 35)

  return {
    districtId: '108',
    districtName: '汾口镇',
    pipeSystem: 'sewage',
    alarmTime: formatDateMinute(alarmTime),
    alarmLevel: 'high',
    riskScore: 92,
    summary:
      '上游水位持续抬升，下游水位变化平缓；同期流量仅小幅增加，单位流量水头损失升高，判断区域内主干管存在淤积或局部堵塞风险。',
    evidence:
      '预警依据为上下游水位差持续扩大、流速低于自清阈值、阻力指数高于历史基线，且降雨和来水量不足以解释上游水位抬升。',
    metrics: [
      { label: '最大水位差', value: '0.73 m', status: 'critical' },
      { label: '持续时长', value: '6 h', status: 'warning' },
      { label: '最低流速', value: '0.41 m/s', status: 'critical' },
      { label: '阻力指数', value: '0.024', status: 'critical' },
    ],
    hydraulicSeries: addDatesToData(district108HydraulicValues, currentTime),
  }
}

export function getSiltationWarningDataMap(
  currentTime = new Date(),
): Record<string, PipeSiltationDetail> {
  return {
    '108': getDistrict108SiltationDetail(currentTime),
  }
}
