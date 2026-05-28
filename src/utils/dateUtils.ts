/**
 * 生成最近7天的日期数组（不含今天）
 * 返回格式: ['MM-DD', ...]
 */
export function getLast7Days(): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = 7; i >= 1; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
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
export function addDatesToData<T extends Record<string, any>>(
  dataValues: T[]
): Array<T & { date: string }> {
  const dates = getLast7Days()
  return dataValues.map((item, index) => ({
    ...item,
    date: dates[index] ?? dates[dates.length - 1],
  }))
}
