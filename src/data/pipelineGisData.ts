import type {
  Coordinate,
  DrainageMapPoint,
  DrainagePipeSegment,
  HealthStatus,
} from '../types/drainage'
import { bd09ToWgs84 } from '../utils/coordTransform'
import rawPipelineData from './pipelineGisRaw.json'

interface PipelineGisRecord {
  wellCode: string
  startCode: string
  endCode: string
  alarmStatus: boolean
  flowDirection: number
  pipeType: string
  startLongitude: string
  startLatitude: string
  endLongitude: string
  endLatitude: string
  startPipeBottomElevation: number
  endPipeBottomElevation: number
  startCoordX: string
  startCoordY: string
  endCoordX: string
  endCoordY: string
}

interface PipelineGisResponse {
  code: string
  msg: string
  data: PipelineGisRecord[]
}

interface WellGisAggregate {
  id: string
  name: string
  category: DrainageMapPoint['category']
  status: HealthStatus
  longitudeSum: number
  latitudeSum: number
  count: number
}

function toNumber(value: string): number {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStatus(alarmStatus: boolean): HealthStatus {
  return alarmStatus ? 'critical' : 'healthy'
}

function normalizeCategory(pipeType: string): DrainagePipeSegment['category'] {
  return pipeType === 'WS' ? 'sewage' : 'rainwater'
}

function normalizeRawCoordinate(longitude: string, latitude: string): Coordinate {
  return [toNumber(longitude), toNumber(latitude)]
}

function buildCoordinates(record: PipelineGisRecord): Coordinate[] {
  const start = bd09ToWgs84(
    normalizeRawCoordinate(record.startLongitude, record.startLatitude),
  )
  const end = bd09ToWgs84(
    normalizeRawCoordinate(record.endLongitude, record.endLatitude),
  )

  return record.flowDirection === 1
    ? [end, start]
    : [start, end]
}

function buildPipeName(record: PipelineGisRecord): string {
  return `${record.startCode} → ${record.endCode}`
}

function buildPipeId(record: PipelineGisRecord, index: number): string {
  return record.wellCode || `pipeline-${index + 1}`
}

function buildWellCategory(code: string): DrainageMapPoint['category'] | null {
  if (code.includes('YS')) {
    return 'rain-well'
  }

  if (code.includes('WS')) {
    return 'sewage-well'
  }

  return null
}

function buildWellName(code: string, category: DrainageMapPoint['category']): string {
  return `${code} ${category === 'rain-well' ? '雨水井' : '污水井'}`
}

function createWellAggregate(
  code: string,
  x: number,
  y: number,
  status: HealthStatus,
): WellGisAggregate {
  const category = buildWellCategory(code)

  if (!category) {
    return {
      id: code,
      name: code,
      category: 'sewage-well',
      status,
      longitudeSum: x,
      latitudeSum: y,
      count: 1,
    }
  }

  return {
    id: code,
    name: buildWellName(code, category),
    category,
    status,
    longitudeSum: x,
    latitudeSum: y,
    count: 1,
  }
}

function mergeWellAggregate(
  aggregate: WellGisAggregate,
  x: number,
  y: number,
  status: HealthStatus,
) {
  aggregate.longitudeSum += x
  aggregate.latitudeSum += y
  aggregate.count += 1

  if (status === 'critical') {
    aggregate.status = 'critical'
  } else if (status === 'warning' && aggregate.status === 'healthy') {
    aggregate.status = 'warning'
  }
}

function collectWellAggregates(record: PipelineGisRecord, aggregates: Map<string, WellGisAggregate>) {
  const startCoordinate = bd09ToWgs84(
    normalizeRawCoordinate(record.startLongitude, record.startLatitude),
  )
  const endCoordinate = bd09ToWgs84(
    normalizeRawCoordinate(record.endLongitude, record.endLatitude),
  )

  const endpoints: Array<{ code: string; longitude: number; latitude: number }> = [
    {
      code: record.startCode,
      longitude: startCoordinate[0],
      latitude: startCoordinate[1],
    },
    {
      code: record.endCode,
      longitude: endCoordinate[0],
      latitude: endCoordinate[1],
    },
  ]

  for (const endpoint of endpoints) {
    if (!buildWellCategory(endpoint.code)) {
      continue
    }

    const existing = aggregates.get(endpoint.code)

    if (existing) {
      mergeWellAggregate(
        existing,
        endpoint.longitude,
        endpoint.latitude,
        normalizeStatus(record.alarmStatus),
      )
    } else {
      aggregates.set(
        endpoint.code,
        createWellAggregate(
          endpoint.code,
          endpoint.longitude,
          endpoint.latitude,
          normalizeStatus(record.alarmStatus),
        ),
      )
    }
  }
}

const pipelineGisResponse = rawPipelineData as PipelineGisResponse

export const pipelinePipes: DrainagePipeSegment[] = pipelineGisResponse.data.map(
  (record, index) => ({
    id: buildPipeId(record, index),
    name: buildPipeName(record),
    category: normalizeCategory(record.pipeType),
    status: normalizeStatus(record.alarmStatus),
    diameter: 0,
    coordinates: buildCoordinates(record),
  }),
)

export const pipelineWells: DrainageMapPoint[] = Array.from(
  pipelineGisResponse.data.reduce((aggregates, record) => {
    collectWellAggregates(record, aggregates)

    return aggregates
  }, new Map<string, WellGisAggregate>()),
  ([, aggregate]) => ({
    id: aggregate.id,
    name: aggregate.name,
    category: aggregate.category,
    status: aggregate.status,
    coordinate: [
      aggregate.longitudeSum / aggregate.count,
      aggregate.latitudeSum / aggregate.count,
    ] as Coordinate,
  }),
).sort((left, right) => left.id.localeCompare(right.id))
