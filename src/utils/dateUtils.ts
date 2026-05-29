/**
 * 生成最近7天的日期数组（不含今天）
 * 返回格式: ['MM-DD', ...]
 */
export function getLast7Days(baseDate = new Date()): string[] {
  const dates: string[] = []

  for (let i = 7; i >= 1; i--) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() - i)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push(`${month}-${day}`)
  }

  return dates
}

/**
 * 为时间序列数据添加动态日期
 * @param dataValues - 数据值数组（7天）
 */
export function addDatesToData<T extends object>(
  dataValues: T[],
  baseDate = new Date(),
): Array<T & { date: string }> {
  const dates = getLast7Days(baseDate)
  return dataValues.map((item, index) => ({
    ...item,
    date: dates[index] ?? dates[dates.length - 1],
  }))
}

export function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatMonthDayTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}`
}

export function formatDateMinute(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function buildRecentFixedTime(
  baseDate: Date,
  daysAgo: number,
  hours: number,
  minutes: number,
): Date {
  const date = new Date(baseDate)
  date.setDate(baseDate.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)

  return date
}

export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000)
}
