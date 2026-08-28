/** 音乐源统一入口（与原仓库 musicSdk 接口对齐） */
import kw from './kw'
import kg from './kg'
import tx from './tx'
import wy from './wy'
import mg from './mg'
import type { MusicInfo, LyricInfo, Quality, SearchResult, Source } from '../types'

export interface MusicSource {
  id: Source
  name: string
  search(str: string, page?: number, limit?: number): Promise<SearchResult>
  getMusicUrl(songInfo: MusicInfo, quality: Quality): Promise<string>
  getLyric(songInfo: MusicInfo): Promise<LyricInfo>
  getLeaderboard?(): Promise<Array<{ id: string; name: string; img: string }>>
  getLeaderboardList?(id: string, page?: number, limit?: number): Promise<any>
  getHotSearch?(): Promise<Array<{ word: string }>>
}

/** 内置源列表（顺序即设置页显示顺序） */
export const sources: Array<{ id: Source; name: string }> = [
  { id: 'kw', name: '酷我音乐' },
  { id: 'kg', name: '酷狗音乐' },
  { id: 'tx', name: 'QQ音乐' },
  { id: 'wy', name: '网易云音乐' },
  { id: 'mg', name: '咪咕音乐' },
]

const sourceMap: Record<string, MusicSource> = { kw, kg, tx, wy, mg }

export const getSource = (id: string): MusicSource => {
  const s = sourceMap[id]
  if (!s) throw new Error(`未找到音源: ${id}`)
  return s
}

export const getSourceName = (id: string): string => {
  const s = sources.find(x => x.id === id)
  return s?.name ?? id
}

/** 各源支持的最高音质（用于设置页显示） */
export const supportQuality: Record<string, Quality[]> = {
  kw: ['128k', '320k', 'flac', 'flac24bit'],
  kg: ['128k', '320k', 'flac', 'flac24bit'],
  tx: ['128k', '320k', 'flac'],
  wy: ['128k', '320k', 'flac'],
  mg: [],
}

export default {
  sources,
  getSource,
  getSourceName,
  supportQuality,
}
