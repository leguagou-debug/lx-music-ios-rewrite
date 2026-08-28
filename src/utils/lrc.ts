/** LRC 歌词解析与时间处理 */

export interface LrcLine {
  time: number // 毫秒
  text: string
}

/** 解析 LRC 文本 → 带时间戳的行 */
export const parseLrc = (lrc: string): LrcLine[] => {
  if (!lrc) return []
  const lines: LrcLine[] = []
  const lineReg = /^\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?]/g
  const textReg = /\[(?:\d{1,3}):(?:\d{1,2})(?:[.:]\d{1,3})?]/g
  const list = lrc.split('\n')
  for (const line of list) {
    const timeMatches = [...line.matchAll(lineReg)]
    if (timeMatches.length === 0) continue
    const text = line.replace(textReg, '').trim()
    for (const m of timeMatches) {
      const min = parseInt(m[1], 10)
      const sec = parseInt(m[2], 10)
      const msRaw = m[3] ?? '0'
      const ms = msRaw.length === 1 ? parseInt(msRaw, 10) * 100 : msRaw.length === 2 ? parseInt(msRaw, 10) * 10 : parseInt(msRaw, 10)
      const time = min * 60000 + sec * 1000 + ms
      lines.push({ time, text })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

/** 在已排序的行中查找指定时间点的当前行索引 */
export const findCurrentLine = (lines: LrcLine[], timeMs: number): number => {
  if (lines.length === 0) return -1
  if (timeMs < lines[0].time) return 0
  for (let i = lines.length - 1; i >= 0; i--) {
    if (timeMs >= lines[i].time) return i
  }
  return 0
}

/** 判断文本是否为翻译/罗马音行 */
export const isTranslationLine = (text: string): boolean => /^[\u4e00-\u9fa5\p{P}\s]+$/u.test(text) && text.length > 0
