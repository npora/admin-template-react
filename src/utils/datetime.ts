import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const DEFAULT_TIME_ZONE = 'Asia/Shanghai'
const wallTimeFormat = 'YYYY-MM-DD HH:mm:ss.SSS'

export function applyTimeZone(zone: string) {
  dayjs.tz.setDefault(zone)
}

export function pickerWallTime(timestamp: number, zone: string) {
  return dayjs.utc(dayjs.utc(timestamp).tz(zone).format(wallTimeFormat))
}

export function formatDate(timestamp: number, zone: string = DEFAULT_TIME_ZONE) {
  return dayjs.utc(timestamp).tz(zone).format('YYYY-MM-DD HH:mm:ss')
}

export function parseWallTime(value: string, zone: string = DEFAULT_TIME_ZONE): number | null {
  const wall = dayjs.utc(value)
  if (!wall.isValid() || wall.format(wallTimeFormat) !== value) return null
  const offsets = new Set(
    [-2, 0, 2].map((days) => dayjs.utc(wall.valueOf() + days * 86_400_000).tz(zone).utcOffset())
  )
  const candidates = [...offsets]
    .map((offset) => wall.valueOf() - offset * 60_000)
    .filter((timestamp) => dayjs.utc(timestamp).tz(zone).format(wallTimeFormat) === value)
  return candidates.length ? Math.min(...candidates) : null
}
