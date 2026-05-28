import type { FeatureCollection, Polygon } from 'geojson'
import districtsJson from '../data/districts.json'

export interface DistrictData {
  id: string
  name: string
  sewageSystem?: string
  status?: 'healthy' | 'warning' | 'critical'
  areaType?: 'normal' | 'siltation' | 'inflow'
  coordinates?: [number, number][]
}

export const districtRecords: DistrictData[] = districtsJson as DistrictData[]

export function buildDistrictGeoJson(): FeatureCollection<Polygon> {
  const features = districtRecords
    .filter((district) => district.coordinates && district.coordinates.length > 0)
    .map((district) => ({
      type: 'Feature' as const,
      properties: {
        id: district.id,
        name: district.name,
        sewageSystem: district.sewageSystem,
        status: district.status ?? 'healthy',
        areaType: district.areaType ?? 'normal',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [district.coordinates!],
      },
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function getDistrictById(id: string): DistrictData | undefined {
  return districtRecords.find((d) => d.id === id)
}

export function buildSiltationGeoJson(): FeatureCollection<Polygon> {
  const features = districtRecords
    .filter(
      (district) =>
        district.coordinates &&
        district.coordinates.length > 0 &&
        district.areaType === 'siltation',
    )
    .map((district) => ({
      type: 'Feature' as const,
      properties: {
        id: district.id,
        name: district.name,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [district.coordinates!],
      },
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function buildInflowInfiltrationGeoJson(): FeatureCollection<Polygon> {
  const features = districtRecords
    .filter(
      (district) =>
        district.coordinates &&
        district.coordinates.length > 0 &&
        district.areaType === 'inflow',
    )
    .map((district) => ({
      type: 'Feature' as const,
      properties: {
        id: district.id,
        name: district.name,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [district.coordinates!],
      },
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}
