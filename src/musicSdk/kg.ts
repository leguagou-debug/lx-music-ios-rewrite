/** 酷狗音乐源（kg）
 * 搜索/歌词 + 内置 m.kugou.com 播放地址
 */
import { httpGetJson, httpGetText } from '../utils/request'
import { decodeName, formatPlayCount } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality, SongListTag, SongListTagGroup, SongListResult, SongListDetail, Source } from '../types'

const SEARCH_URL = 'https://songsearch.kugou.com/song_search_v2'

const sizeFormate = (size: number): string => {
  if (!size) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = size
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i > 0 ? 1 : 0)}${units[i]}`
}

export const kg = {
  id: 'kg' as const,
  name: '酷狗音乐',

  async search(str: string, page = 1, limit = 30): Promise<SearchResult> {
    const url = `${SEARCH_URL}?keyword=${encodeURIComponent(str)}&page=${page}&pagesize=${limit}&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0&area_code=1`
    const body = await httpGetJson(url)
    const rawList = body?.data?.lists ?? []
    const list: MusicInfo[] = rawList.map((raw: any) => {
      const types: MusicInfo['types'] = []
      const _types: MusicInfo['_types'] = {}
      if (raw.FileSize) {
        types.push({ type: '128k', size: sizeFormate(raw.FileSize) })
        _types['128k'] = { size: sizeFormate(raw.FileSize) }
      }
      if (raw.HQFileSize) {
        types.push({ type: '320k', size: sizeFormate(raw.HQFileSize) })
        _types['320k'] = { size: sizeFormate(raw.HQFileSize) }
      }
      if (raw.SQFileSize) {
        types.push({ type: 'flac', size: sizeFormate(raw.SQFileSize) })
        _types.flac = { size: sizeFormate(raw.SQFileSize) }
      }
      if (raw.ResFileSize) {
        types.push({ type: 'flac24bit', size: sizeFormate(raw.ResFileSize) })
        _types.flac24bit = { size: sizeFormate(raw.ResFileSize) }
      }
      const singers = (raw.Singers ?? []).map((s: any) => s.name).filter(Boolean)
      return {
        name: decodeName(raw.SongName),
        singer: singers.join('、'),
        source: 'kg',
        songmid: String(raw.Audioid ?? raw.FileHash ?? ''),
        albumId: raw.AlbumID ? String(raw.AlbumID) : undefined,
        interval: raw.Duration ?? 0,
        albumName: decodeName(raw.AlbumName || ''),
        lrc: null,
        img: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    const total = body?.data?.total ?? list.length
    return {
      list,
      allPage: Math.max(1, Math.ceil(total / limit)),
      total,
      limit,
    }
  },

  /** 获取播放地址（m.kugou.com playInfo，用 128k hash） */
  async getMusicUrl(songInfo: MusicInfo, quality: Quality): Promise<string> {
    const hash =
      quality === 'flac' ? songInfo._types?.flac?.hash
      : quality === '320k' ? songInfo._types?.['320k']?.hash
      : songInfo._types?.['128k']?.hash
    const useHash = hash || (songInfo._types?.['128k']?.hash ?? '')
    if (!useHash) throw new Error('该歌曲无可用音源')
    const body = await httpGetJson(`http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${useHash}`)
    const url = body?.url
    if (!url) throw new Error('获取播放地址失败（可能受版权保护）')
    return url
  },

  /** 获取歌词（lyrics.kugou.com search + download） */
  async getLyric(songInfo: MusicInfo): Promise<LyricInfo> {
    const hash = songInfo._types?.['128k']?.hash ?? ''
    const time = Math.max(1, songInfo.interval) * 1000
    const searchBody = await httpGetJson(
      `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(songInfo.name)}&hash=${hash}&timelength=${time}&lrctxt=1`,
      { headers: { 'KG-RC': '1', 'KG-THash': 'expand_search_manager.cpp:852736169:451', 'User-Agent': 'KuGou2012-9020-ExpandSearchManager' } },
    )
    const candidates = searchBody?.candidates ?? []
    if (!candidates.length) throw new Error('获取歌词失败')
    const info = candidates[0]
    const dlBody = await httpGetJson(
      `http://lyrics.kugou.com/download?ver=1&client=pc&id=${info.id}&accesskey=${info.accesskey}&fmt=${info.fmt ?? 'lrc'}&charset=utf8`,
      { headers: { 'KG-RC': '1', 'KG-THash': 'expand_search_manager.cpp:852736169:451', 'User-Agent': 'KuGou2012-9020-ExpandSearchManager' } },
    )
    if (dlBody?.fmt === 'krc') throw new Error('该歌曲仅支持 KRC 加密歌词')
    if (!dlBody?.content) throw new Error('获取歌词失败')
    const lyric = decodeName(Buffer.from(dlBody.content, 'base64').toString('utf-8'))
    return { lyric, translation: '' }
  },

  /** 歌单标签 */
  async getSongListTags(): Promise<{ tags: SongListTagGroup[]; hotTag: SongListTag[]; source: Source }> {
    const body = await httpGetJson('http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&')
    if (body?.status !== 1) throw new Error('获取歌单标签失败')
    const data = body.data ?? {}
    const tags: SongListTagGroup[] = Object.keys(data.tagids ?? {}).map(name => ({
      name,
      list: ((data.tagids[name]?.data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        source: 'kg' as Source,
      }))),
    }))
    const hotTag: SongListTag[] = Object.values(data.hotTag ?? {}).map((t: any) => ({
      id: t.special_id,
      name: t.special_name,
      source: 'kg' as Source,
    }))
    return { tags, hotTag, source: 'kg' }
  },

  /** 歌单列表 */
  async getSongList(sortId: string, tagId: string, page = 1): Promise<SongListResult> {
    const url = `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${tagId ?? ''}&p=${page}`
    const body = await httpGetJson(url)
    if (body?.status !== 1) throw new Error('获取歌单列表失败')
    const rawList = body?.special_db ?? []
    const list = rawList.map((item: any) => ({
      play_count: formatPlayCount(item.total_play_count || item.play_count),
      id: `id_${item.specialid}`,
      author: item.nickname,
      name: item.specialname,
      img: item.img || item.imgurl,
      total: item.songcount,
      desc: item.intro,
      source: 'kg' as Source,
    }))
    return { list, total: list.length, page, limit: 36, source: 'kg' }
  },

  /** 歌单详情 */
  async getSongListDetail(id: string, _page = 1): Promise<SongListDetail> {
    let realId = id.replace('id_', '')
    // v9 special/single 页面内嵌 JSON
    const html = await httpGetText(`http://www2.kugou.kugou.com/yueku/v9/special/single/${realId}-5-9999.html`)
    const dataMatch = html.match(/global\.data\s*=\s*(\[[\s\S]*?\])\s*;/)
    if (!dataMatch) throw new Error('获取歌单详情失败')
    let rawList: any[] = []
    try {
      rawList = JSON.parse(dataMatch[1])
    } catch {
      throw new Error('获取歌单详情失败')
    }
    const list: MusicInfo[] = rawList.map((item: any) => {
      const types: MusicInfo['types'] = []
      const _types: MusicInfo['_types'] = {}
      if (item.filesize) {
        types.push({ type: '128k', size: sizeFormate(item.filesize), ...({ hash: item.hash } as any) })
        _types['128k'] = { size: sizeFormate(item.filesize), hash: item.hash }
      }
      if (item.filesize_320) {
        types.push({ type: '320k', size: sizeFormate(item.filesize_320), ...({ hash: item.hash_320 } as any) })
        _types['320k'] = { size: sizeFormate(item.filesize_320), hash: item.hash_320 }
      }
      if (item.filesize_flac) {
        types.push({ type: 'flac', size: sizeFormate(item.filesize_flac), ...({ hash: item.hash_flac } as any) })
        _types.flac = { size: sizeFormate(item.filesize_flac), hash: item.hash_flac }
      }
      return {
        name: decodeName(item.songname),
        singer: decodeName(item.singername),
        source: 'kg' as Source,
        songmid: String(item.audio_id ?? item.hash ?? ''),
        interval: Math.max(1, Math.floor((item.duration ?? 0) / 1000)),
        albumName: decodeName(item.album_name || ''),
        lrc: null,
        img: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    return { list, page: 1, limit: list.length, total: list.length, source: 'kg' }
  },
}

export default kg
