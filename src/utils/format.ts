/** 通用格式化工具 */

/** 秒 → "mm:ss" */
export const formatPlayTime = (seconds: number): string => {
  seconds = Math.max(0, Math.floor(seconds))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

/** 秒 → "h:mm:ss"（用于时长列） */
export const formatInterval = (seconds: number): string => {
  seconds = Math.max(0, Math.floor(seconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/** 歌手数组 → 顿号分隔字符串 */
export const formatSinger = (singers: string[]): string => (singers ?? []).filter(Boolean).join('、')

/** 文件名安全化 */
export const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/:*?"<>|]/g, '_').trim()

/** 字节数 → 人类可读大小 */
export const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

/** 解码 URL 编码的中文（容错） */
export const decodeName = (str: string): string => {
  if (!str) return ''
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

/** 格式化播放量（12345 → 1.2万） */
export const formatPlayCount = (num: number | string | undefined): string => {
  const n = parseInt(String(num ?? 0), 10)
  if (Number.isNaN(n) || n <= 0) return ''
  if (n > 100000000) return `${Math.floor(n / 10000000) / 10}亿`
  if (n > 10000) return `${Math.floor(n / 1000) / 10}万`
  return String(n)
}

/** 简繁转换占位（isS2t 时用；此处保持原样，完整实现可换 opencc-js） */
export const s2t = (str: string): string => str

/** 从字符串解析 JSON（容错） */
export const safeJsonParse = <T = any>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

/** 生成唯一 id */
export const genId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
