import type {
  DrainageMapPoint,
  DrainagePipeSegment,
  MapLayerSummary,
} from '../types/drainage'

export function buildMapLayerSummaries(
  baseSummaries: MapLayerSummary[],
  pipes: DrainagePipeSegment[],
  points: DrainageMapPoint[],
): MapLayerSummary[] {
  const rainwaterCount = pipes.filter((pipe) => pipe.category === 'rainwater').length
  const sewageCount = pipes.filter((pipe) => pipe.category === 'sewage').length

  return baseSummaries.map((summary) => {
    if (summary.id === 'rain-pipes') {
      return { ...summary, count: rainwaterCount }
    }

    if (summary.id === 'sewage-pipes') {
      return { ...summary, count: sewageCount }
    }

    if (summary.id === 'monitor-points') {
      return { ...summary, count: points.length }
    }

    return summary
  })
}
