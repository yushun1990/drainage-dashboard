import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from 'geojson'
import type {
  DrainageMapDataset,
  DrainageMapPoint,
  DrainagePipeSegment,
  DrainageRiskArea,
  DrainageWaterway,
} from '../types/drainage'

interface PipeFeatureProperties {
  id: string
  name: string
  category: DrainagePipeSegment['category']
  status: DrainagePipeSegment['status']
  diameter: number
}

interface PointFeatureProperties {
  id: string
  name: string
  category: DrainageMapPoint['category']
  status: DrainageMapPoint['status']
  label: string
}

interface RiskAreaFeatureProperties {
  id: string
  name: string
  category: DrainageRiskArea['category']
  status: DrainageRiskArea['status']
}

interface WaterwayFeatureProperties {
  id: string
  name: string
}

export type PipeFeatureCollection = FeatureCollection<
  LineString,
  PipeFeatureProperties
>

export type PointFeatureCollection = FeatureCollection<
  Point,
  PointFeatureProperties
>

export type RiskAreaFeatureCollection = FeatureCollection<
  Polygon,
  RiskAreaFeatureProperties
>

export type WaterwayFeatureCollection = FeatureCollection<
  LineString,
  WaterwayFeatureProperties
>

const pointCategoryLabel: Record<DrainageMapPoint['category'], string> = {
  household: '户',
  'sewage-well': '污',
  outfall: '雨',
  'pump-station': '泵',
  'water-meter': '供',
  'rain-well': '雨',
}

export function buildPipeFeatureCollection(
  pipes: DrainagePipeSegment[],
): PipeFeatureCollection {
  const features: Feature<LineString, PipeFeatureProperties>[] = pipes.map(
    (pipe) => ({
      type: 'Feature',
      properties: {
        id: pipe.id,
        name: pipe.name,
        category: pipe.category,
        status: pipe.status,
        diameter: pipe.diameter,
      },
      geometry: {
        type: 'LineString',
        coordinates: pipe.coordinates,
      },
    }),
  )

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function buildPointFeatureCollection(
  points: DrainageMapPoint[],
): PointFeatureCollection {
  const features: Feature<Point, PointFeatureProperties>[] = points.map(
    (point) => ({
      type: 'Feature',
      properties: {
        id: point.id,
        name: point.name,
        category: point.category,
        status: point.status,
        label: pointCategoryLabel[point.category],
      },
      geometry: {
        type: 'Point',
        coordinates: point.coordinate,
      },
    }),
  )

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function buildRiskAreaFeatureCollection(
  riskAreas: DrainageRiskArea[],
): RiskAreaFeatureCollection {
  const features: Feature<Polygon, RiskAreaFeatureProperties>[] = riskAreas.map(
    (riskArea) => ({
      type: 'Feature',
      properties: {
        id: riskArea.id,
        name: riskArea.name,
        category: riskArea.category,
        status: riskArea.status,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [riskArea.coordinates],
      },
    }),
  )

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function buildWaterwayFeatureCollection(
  waterways: DrainageWaterway[],
): WaterwayFeatureCollection {
  const features: Feature<LineString, WaterwayFeatureProperties>[] =
    waterways.map((waterway) => ({
      type: 'Feature',
      properties: {
        id: waterway.id,
        name: waterway.name,
      },
      geometry: {
        type: 'LineString',
        coordinates: waterway.coordinates,
      },
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function buildDrainageGeoJson(dataset: DrainageMapDataset) {
  return {
    waterways: buildWaterwayFeatureCollection(dataset.waterways),
    pipes: buildPipeFeatureCollection(dataset.pipes),
    points: buildPointFeatureCollection(dataset.points),
    riskAreas: buildRiskAreaFeatureCollection(dataset.riskAreas),
  }
}
