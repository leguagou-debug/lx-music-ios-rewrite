/** 网易云音乐源（wy）：搜索可用；播放接口偶发失效（需 RSA 的 weapi 接口在纯 JS 下未实现） */
import { httpGetJson } from '../utils/request'
import { decodeName } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality } from '../types'

const SEARCH_URL = 'https://music.163.com/api/search/get/web'
const URL_API = 'https://music.163.com/api/song/enhance/player/url'
const LYRIC_API = 'https://music.163.com/api/song/lyric'

export const wy = {
  id: 'wy' as const,
  name: '网易云音乐',

  async search(str: string, page = 1, limit = 30): Promise<SearchResult> {
    const url = `${SEARCH_URL}?s=${encodeURIComponent(str)}&type=1&limit=${limit}&offset=${(page - 1) * limit}`
    const body = await httpGetJson(url, {
      headers: { Referer: 'https://music.163.com', Cookie: 'appver=8.0.0' },
    })
    const rawList = body?.result?.songs ?? []
    const list: MusicInfo[] = rawList.map((raw: any) => {
      const singers = (raw.ar ?? []).map((s: any) => s.name).filter(Boolean)
      return {
        name: decodeName(raw.name),
        singer: singers.join('、'),
        source: 'wy',
        songmid: String(raw.id),
        albumId: raw.al?.id ? String(raw.al.id) : undefined,
        interval: Math.floor((raw.dt ?? 0) / 1000),
        albumName: decodeName(raw.al?.name || ''),
        lrc: null,
        img: raw.al?.picUrl || null,
        otherSource: null,
        types: [],
        _types: {},
        typeUrl: {},
      }
    })
    const total = body?.result?.songCount ?? list.length
    return {
      list,
      allPage: Math.max(1, Math.ceil(total / limit)),
      total,
      limit,
    }
  },

  /** 播放地址（旧版公开 API，失效则报错提示） */
  async getMusicUrl(songInfo: MusicInfo, quality: Quality): Promise<string> {
    const br = quality === 'flac' ? 999000 : quality === '320k' ? 320000 : 128000
    const body = await httpGetJson(`${URL_API}?ids=[${songInfo.songmid}]&br=${br}`, {
      headers: { Referer: 'https://music.163.com' },
    })
    const url = body?.data?.[0]?.url
    if (!url) throw new Error('获取播放地址失败（该歌曲无版权或接口失效）')
    return url
  },

  /** 歌词 */
  async getLyric(songInfo: MusicInfo): Promise<LyricInfo> {
    const body = await httpGetJson(`${LYRIC_API}?id=${songInfo.songmid}&lv=1&kv=1&tv=-1`, {
      headers: { Referer: 'https://music.163.com' },
    })
    const lyric = body?.lrc?.lyric
    if (!lyric) throw new Error('获取歌词失败')
    return { lyric, translation: body?.tlyric?.lyric || '' }
  },
}

export default wy
