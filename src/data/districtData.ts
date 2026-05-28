import {
  buildDistrictGeoJson,
  buildSiltationGeoJson,
  buildInflowInfiltrationGeoJson,
} from '../utils/districtUtils'

export const districtAreas = buildDistrictGeoJson()

// 管道淤积区域
export const siltationArea = buildSiltationGeoJson()

// 流入渗入区域
export const inflowInfiltrationArea = buildInflowInfiltrationGeoJson()
