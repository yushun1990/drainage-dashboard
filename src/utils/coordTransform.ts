import type { Coordinate } from '../types/drainage'

const xPi = (Math.PI * 3000.0) / 180.0
const a = 6378245.0
const ee = Number('0.00669342162296594323')

function outOfChina(longitude: number, latitude: number): boolean {
  return (
    longitude < 72.004 ||
    longitude > 137.8347 ||
    latitude < 0.8293 ||
    latitude > 55.8271
  )
}

function transformLat(longitude: number, latitude: number): number {
  let ret =
    -100.0 +
    2.0 * longitude +
    3.0 * latitude +
    0.2 * latitude * latitude +
    0.1 * longitude * latitude +
    0.2 * Math.sqrt(Math.abs(longitude))
  ret +=
    ((20.0 * Math.sin(6.0 * longitude * Math.PI) +
      20.0 * Math.sin(2.0 * longitude * Math.PI)) *
      2.0) /
    3.0
  ret +=
    ((20.0 * Math.sin(latitude * Math.PI) +
      40.0 * Math.sin((latitude / 3.0) * Math.PI)) *
      2.0) /
    3.0
  ret +=
    ((160.0 * Math.sin((latitude / 12.0) * Math.PI) +
      320 * Math.sin((latitude * Math.PI) / 30.0)) *
      2.0) /
    3.0

  return ret
}

function transformLng(longitude: number, latitude: number): number {
  let ret =
    300.0 +
    longitude +
    2.0 * latitude +
    0.1 * longitude * longitude +
    0.1 * longitude * latitude +
    0.1 * Math.sqrt(Math.abs(longitude))
  ret +=
    ((20.0 * Math.sin(6.0 * longitude * Math.PI) +
      20.0 * Math.sin(2.0 * longitude * Math.PI)) *
      2.0) /
    3.0
  ret +=
    ((20.0 * Math.sin(longitude * Math.PI) +
      40.0 * Math.sin((longitude / 3.0) * Math.PI)) *
      2.0) /
    3.0
  ret +=
    ((150.0 * Math.sin((longitude / 12.0) * Math.PI) +
      300.0 * Math.sin((longitude / 30.0) * Math.PI)) *
      2.0) /
    3.0

  return ret
}

export function gcj02ToWgs84(coordinate: Coordinate): Coordinate {
  const [longitude, latitude] = coordinate

  if (outOfChina(longitude, latitude)) {
    return coordinate
  }

  const dLat = transformLat(longitude - 105.0, latitude - 35.0)
  const dLng = transformLng(longitude - 105.0, latitude - 35.0)
  const radLat = (latitude / 180.0) * Math.PI
  const magic = Math.sin(radLat)
  const sqrtMagic = Math.sqrt(1 - ee * magic * magic)
  const mgLat =
    latitude +
    ((dLat * 180.0) /
      (((a * (1 - ee)) / (sqrtMagic * sqrtMagic)) * Math.PI))
  const mgLng =
    longitude +
    ((dLng * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI))

  return [longitude * 2 - mgLng, latitude * 2 - mgLat]
}

function bd09ToGcj02(coordinate: Coordinate): Coordinate {
  const [longitude, latitude] = coordinate
  const x = longitude - 0.0065
  const y = latitude - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi)

  return [z * Math.cos(theta), z * Math.sin(theta)]
}

export function bd09ToWgs84(coordinate: Coordinate): Coordinate {
  return gcj02ToWgs84(bd09ToGcj02(coordinate))
}
