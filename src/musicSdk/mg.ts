/** 咪咕音乐源（mg）：搜索可用；播放/歌词接口需签名，返回清晰错误提示 */
import { httpGetJson } from '../utils/request'
import { decodeName } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality } from '../types'

const SEARCH_URL = 'https://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do'

export const mg = {
  id: 'mg' as const,
  name: '咪咕音乐',

  async search(str: string, page = 1, limit = 30): Promise<SearchResult> {
    const url = `${SEARCH_URL}?text=${encodeURIComponent(str)}&pageSize=${limit}&pageNo=${page}&searchSwitch=${encodeURIComponent(JSON.stringify({ song: 1 }))}`
    const body = await httpGetJson(url)
    const rawList = body?.returnData?.songResultData?.result ?? body?.returnData?.songList ?? []
    const list: MusicInfo[] = rawList.map((raw: any) => {
      const singers = (raw.singer ?? []).map((s: any) => s.name).filter(Boolean)
      const duration = raw.duration ?? 0
      return {
        name: decodeName(raw.songName || raw.title || ''),
        singer: singers.join('、'),
        source: 'mg',
        songmid: String(raw.songId ?? raw.contentId ?? ''),
        albumId: raw.albumId ? String(raw.albumId) : undefined,
        interval: typeof duration === 'string' ? 0 : duration,
        albumName: decodeName(raw.albumName || ''),
        lrc: null,
        img: raw.picUrl || raw.albumPicUrl || null,
        otherSource: null,
        types: [],
        _types: {},
        typeUrl: {},
      }
    })
    const total = body?.returnData?.songResultData?.totalCount ?? list.length
    return {
      list,
      allPage: Math.max(1, Math.ceil(total / limit)),
      total,
      limit,
    }
  },

  async getMusicUrl(): Promise<string> {
    throw new Error('咪咕播放地址需要签名，暂不支持，请切换到酷我/酷狗/QQ音乐')
  },

  async getLyric(): Promise<LyricInfo> {
    throw new Error('咪咕歌词接口需要签名，暂不支持')
  },
}

export default mg
