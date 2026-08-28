/** 网易云音乐源（wy）：搜索/歌词 + 公开 API 歌单 + 播放接口（旧版，偶发失效） */
import { httpGetJson } from '../utils/request'
import { decodeName, formatPlayCount } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality, SongListTag, SongListTagGroup, SongListResult, SongListDetail, Source } from '../types'

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

  /** 歌单标签 */
  async getSongListTags(): Promise<{ tags: SongListTagGroup[]; hotTag: SongListTag[]; source: Source }> {
    const body = await httpGetJson('https://music.163.com/api/playlist/catalogue', {
      headers: { Referer: 'https://music.163.com' },
    })
    const sub = body?.sub ?? []
    const hotTag: SongListTag[] = sub
      .filter((c: any) => c.hot)
      .slice(0, 15)
      .map((c: any) => ({ id: c.name, name: c.name, source: 'wy' as Source }))
    // 按分类分组（简化：全部 + 语种 + 风格等，直接按子分类展示）
    const tags: SongListTagGroup[] = [
      { name: '热门', list: hotTag },
      {
        name: '全部',
        list: sub.slice(0, 20).map((c: any) => ({ id: c.name, name: c.name, source: 'wy' as Source })),
      },
    ]
    return { tags, hotTag, source: 'wy' }
  },

  /** 歌单列表 */
  async getSongList(sortId: string, tagId: string, page = 1): Promise<SongListResult> {
    const cat = tagId || '全部'
    const url = `https://music.163.com/api/playlist/list?cat=${encodeURIComponent(cat)}&order=${sortId || 'hot'}&limit=30&offset=${(page - 1) * 30}`
    const body = await httpGetJson(url, { headers: { Referer: 'https://music.163.com' } })
    const rawList = body?.playlists ?? []
    const list = rawList.map((item: any) => ({
      play_count: formatPlayCount(item.playCount),
      id: String(item.id),
      author: item.creator?.nickname ?? '',
      name: item.name ?? '',
      img: item.coverImgUrl ?? '',
      total: item.trackCount,
      desc: item.description ?? '',
      source: 'wy' as Source,
    }))
    return { list, total: body?.total ?? list.length, page, limit: 30, source: 'wy' }
  },

  /** 歌单详情 */
  async getSongListDetail(id: string, _page = 1): Promise<SongListDetail> {
    const body = await httpGetJson(`https://music.163.com/api/v6/playlist/detail?id=${id}`, {
      headers: { Referer: 'https://music.163.com' },
    })
    const playlist = body?.playlist
    if (!playlist?.tracks) throw new Error('获取歌单详情失败')
    const list: MusicInfo[] = playlist.tracks.map((item: any) => {
      const singers = (item.ar ?? []).map((s: any) => s.name).filter(Boolean)
      return {
        name: item.name ?? '',
        singer: singers.join('、'),
        source: 'wy' as Source,
        songmid: String(item.id),
        albumId: item.al?.id ? String(item.al.id) : undefined,
        interval: Math.floor((item.dt ?? 0) / 1000),
        albumName: item.al?.name ?? '',
        lrc: null,
        img: item.al?.picUrl || null,
        otherSource: null,
        types: [],
        _types: {},
        typeUrl: {},
      }
    })
    return {
      list,
      page: 1,
      limit: list.length,
      total: playlist.trackCount ?? list.length,
      source: 'wy',
      info: {
        name: playlist.name ?? '',
        img: playlist.coverImgUrl || undefined,
        desc: playlist.description || undefined,
        author: playlist.creator?.nickname || undefined,
        play_count: formatPlayCount(playlist.playCount),
      },
    }
  },
}

export default wy
