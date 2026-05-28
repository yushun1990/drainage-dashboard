import type { FeatureCollection, Polygon } from 'geojson'
import districtsJson from '../data/districts.json'

export interface DistrictData {
  id: string
  name: string
  sewageSystem?: string
  status?: 'healthy' | 'warning' | 'critical'
  areaType?: 'normal' | 'siltation' | 'inflow'
  coordinates?: [number, number][]
  rainyWeatherFlow?: number
  dryWeatherFlow?: number
  rainRatio?: number
}

export const districtRecords: DistrictData[] = districtsJson as DistrictData[]

export function buildDistrictGeoJson(): FeatureCollection<Polygon> {
  const features = districtRecords
    .filter((district) => district.coordinates && district.coordinates.length > 0)
    .map((district) => {
      const coords = district.coordinates!
      // 确保 Polygon 闭合（第一个和最后一个坐标相同）
      const closedCoords =
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
          ? coords
          : [...coords, coords[0]]

      // 已报警区域(淤积、流入渗入)保持原有状态，普通区域保持 healthy
      let status = district.status ?? 'healthy'
      if (district.areaType === 'normal' || !district.areaType) {
        // 普通区域保持 healthy，通过 rainRatio 控制颜色
        status = 'healthy'
      }

      return {
        type: 'Feature' as const,
        properties: {
          id: district.id,
          name: district.name,
          sewageSystem: district.sewageSystem,
          status,
          areaType: district.areaType ?? 'normal',
          rainyWeatherFlow: district.rainyWeatherFlow,
          dryWeatherFlow: district.dryWeatherFlow,
          rainRatio: district.rainRatio ?? 0,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoords],
        },
      }
    })

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
    .map((district) => {
      const coords = district.coordinates!
      const closedCoords =
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
          ? coords
          : [...coords, coords[0]]

      return {
        type: 'Feature' as const,
        properties: {
          id: district.id,
          name: district.name,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoords],
        },
      }
    })

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
    .map((district) => {
      const coords = district.coordinates!
      const closedCoords =
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
          ? coords
          : [...coords, coords[0]]

      return {
        type: 'Feature' as const,
        properties: {
          id: district.id,
          name: district.name,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoords],
        },
      }
    })

  return {
    type: 'FeatureCollection',
    features,
  }
}
