/** 酷我音乐源（kw）
 * 搜索/歌词/榜单/热搜 + 内置 antiserver 播放地址（原仓库默认依赖自定义音源，此处内置保证开箱即用）
 */
import { httpGetJson, httpGetText } from '../utils/request'
import { decodeName, formatPlayTime, formatPlayCount } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, LeaderboardInfo, LeaderboardList, HotSearch, Quality, SongListTag, SongListTagGroup, SongListResult, SongListDetail, Source } from '../types'

const SEARCH_URL = 'http://search.kuwo.cn/r.s'

const mapQuality = (quality: Quality): string => {
  switch (quality) {
    case '128k': return '128'
    case '320k': return '320'
    case 'flac': return '2000'
    case 'flac24bit': return '2000'
    default: return '128'
  }
}

const parseTypes = (nMinfo: string): { types: MusicInfo['types']; _types: MusicInfo['_types'] } => {
  const types: MusicInfo['types'] = []
  const _types: MusicInfo['_types'] = {}
  if (!nMinfo) return { types, _types }
  const reg = /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/g
  let m: RegExpExecArray | null
  while ((m = reg.exec(nMinfo)) !== null) {
    const bitrate = parseInt(m[2], 10)
    const size = m[4].toLocaleUpperCase()
    if (bitrate === 4000) {
      types.push({ type: 'flac24bit', size })
      _types.flac24bit = { size }
    } else if (bitrate === 2000) {
      types.push({ type: 'flac', size })
      _types.flac = { size }
    } else if (bitrate === 320) {
      types.push({ type: '320k', size })
      _types['320k'] = { size }
    } else if (bitrate === 128) {
      types.push({ type: '128k', size })
      _types['128k'] = { size }
    }
  }
  types.reverse()
  return { types, _types }
}

export const kw = {
  id: 'kw' as const,
  name: '酷我音乐',

  /** 搜索歌曲 */
  async search(str: string, page = 1, limit = 30): Promise<SearchResult> {
    const url = `${SEARCH_URL}?client=kt&all=${encodeURIComponent(str)}&pn=${page - 1}&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`
    const body = await httpGetJson(url)
    const rawList = body?.abslist ?? []
    const list: MusicInfo[] = []
    for (const info of rawList) {
      if (!info.MUSICRID || !info.N_MINFO) continue
      const songId = info.MUSICRID.replace('MUSIC_', '')
      const { types, _types } = parseTypes(info.N_MINFO)
      const interval = parseInt(info.DURATION, 10)
      list.push({
        name: decodeName(info.SONGNAME),
        singer: decodeName(info.ARTIST),
        source: 'kw',
        songmid: songId,
        albumId: decodeName(info.ALBUMID || ''),
        interval: Number.isNaN(interval) ? 0 : interval,
        albumName: decodeName(info.ALBUM || ''),
        lrc: null,
        img: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      })
    }
    const total = parseInt(body.TOTAL ?? '0', 10)
    return {
      list,
      allPage: Math.max(1, Math.ceil(total / limit)),
      total,
      limit,
    }
  },

  /** 获取播放地址（antiserver 接口，返回纯文本 url） */
  async getMusicUrl(songInfo: MusicInfo, quality: Quality): Promise<string> {
    const url = `http://antiserver.kuwo.cn/anti.s?type=convert_url3&rid=MUSIC_${songInfo.songmid}&format=mp3|aac&response=url&quality=${mapQuality(quality)}`
    const text = (await httpGetText(url)).trim()
    if (!text || text.startsWith('err')) throw new Error('获取播放地址失败')
    return text
  },

  /** 获取歌词（老接口，直接返回 lrclist JSON） */
  async getLyric(songInfo: MusicInfo): Promise<LyricInfo> {
    const body = await httpGetJson(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songInfo.songmid}`)
    const lrclist = body?.data?.lrclist
    if (!lrclist || !lrclist.length) throw new Error('获取歌词失败')
    const songinfo = body.data.songinfo ?? {}
    const tags = [
      `[ti:${songinfo.songName ?? ''}]`,
      `[ar:${songinfo.artist ?? ''}]`,
      `[al:${songinfo.album ?? ''}]`,
      '[by:]',
      '[offset:0]',
    ]
    const lyric = `${tags.join('\n')}\n${lrclist.map((l: any) => `[${l.time}]${l.lineLyric}\n`).join('')}`
    return { lyric, translation: '' }
  },

  /** 排行榜列表 */
  async getLeaderboard(): Promise<LeaderboardInfo[]> {
    const body = await httpGetJson('http://www.kuwo.cn/api/www/bang/bang/bangList?pn=1&rn=30&httpsStatus=1', {
      headers: { Referer: 'http://www.kuwo.cn' },
    })
    const list = body?.data?.list ?? []
    return list.map((item: any) => ({
      id: String(item.bangId),
      name: item.bangName,
      img: item.bangPic120,
    }))
  },

  /** 排行榜歌曲列表 */
  async getLeaderboardList(bangId: string, page = 1, limit = 30): Promise<LeaderboardList> {
    const body = await httpGetJson(`http://www.kuwo.cn/api/www/bang/bang/musicList?pn=${page}&rn=${limit}&bangId=${bangId}&httpsStatus=1`, {
      headers: { Referer: 'http://www.kuwo.cn' },
    })
    const rawList = body?.data?.musiclist ?? []
    const list: MusicInfo[] = rawList.map((info: any) => {
      const { types, _types } = parseTypes(info.N_MINFO)
      return {
        name: decodeName(info.NAME),
        singer: decodeName(info.ARTIST),
        source: 'kw',
        songmid: String(info.RID).replace('MUSIC_', ''),
        interval: Number.isNaN(parseInt(info.DURATION, 10)) ? 0 : parseInt(info.DURATION, 10),
        albumName: decodeName(info.ALBUM || ''),
        lrc: null,
        img: info.PICPATH || null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    return {
      list,
      page,
      allPage: Math.max(1, Math.ceil((body?.data?.total ?? list.length) / limit)),
      total: body?.data?.total ?? list.length,
      limit,
    }
  },

  /** 热门搜索 */
  async getHotSearch(): Promise<HotSearch> {
    const body = await httpGetJson('http://www.kuwo.cn/api/www/search/searchKey?key=热歌&httpsStatus=1', {
      headers: { Referer: 'http://www.kuwo.cn' },
    })
    const list = body?.data?.list ?? []
    return list.map((item: any) => ({ word: decodeName(item.key || item.name || '') }))
  },

  /** 歌单标签 */
  async getSongListTags(): Promise<{ tags: SongListTagGroup[]; hotTag: SongListTag[]; source: Source }> {
    const [tagBody, hotBody] = await Promise.all([
      httpGetJson('http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576'),
      httpGetJson('http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576'),
    ])
    const tags: SongListTagGroup[] = (tagBody?.data ?? []).map((g: any) => ({
      name: g.name,
      list: (g.data ?? []).map((t: any) => ({ id: `${t.id}-${t.digest}`, name: t.name, source: 'kw' as Source })),
    }))
    const hotTag: SongListTag[] = (hotBody?.data?.[0]?.data ?? []).map((t: any) => ({
      id: `${t.id}-${t.digest}`,
      name: t.name,
      source: 'kw' as Source,
    }))
    return { tags, hotTag, source: 'kw' }
  },

  /** 歌单列表 */
  async getSongList(sortId: string, tagId: string, page = 1): Promise<SongListResult> {
    const url = tagId
      ? `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&id=${tagId.split('-')[0]}&rn=36`
      : `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&rn=36&order=${sortId}`
    const body = await httpGetJson(url)
    if (body?.code !== 200) throw new Error('获取歌单列表失败')
    const rawList = body?.data?.data ?? []
    const list = rawList.map((item: any) => ({
      play_count: formatPlayCount(item.listencnt),
      id: `digest-${item.digest}__${item.id}`,
      author: item.uname,
      name: item.name,
      total: item.total,
      img: item.img,
      desc: item.desc,
      source: 'kw' as Source,
    }))
    return {
      list,
      total: body?.data?.total ?? list.length,
      page,
      limit: 36,
      source: 'kw',
    }
  },

  /** 歌单详情 */
  async getSongListDetail(id: string, page = 1): Promise<SongListDetail> {
    // id 形如 digest-8__123 或纯数字
    let realId = id
    if (/^digest-/.test(id)) realId = id.split('__')[1] ?? id
    const body = await httpGetJson(
      `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${realId}&pn=${page - 1}&rn=1000&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`,
    )
    if (body?.result !== 'ok') throw new Error('获取歌单详情失败')
    const list: MusicInfo[] = (body.musiclist ?? []).map((item: any) => {
      const { types, _types } = parseTypes(item.N_MINFO ?? '')
      const interval = parseInt(item.duration, 10)
      return {
        name: decodeName(item.name),
        singer: decodeName(item.artist),
        source: 'kw' as Source,
        songmid: String(item.id),
        albumId: item.albumid ? String(item.albumid) : undefined,
        interval: Number.isNaN(interval) ? 0 : interval,
        albumName: decodeName(item.album || ''),
        lrc: null,
        img: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    return {
      list,
      page,
      limit: body.rn ?? 1000,
      total: body.total ?? list.length,
      source: 'kw',
      info: {
        name: decodeName(body.title || ''),
        img: body.pic || undefined,
        desc: body.info ? decodeName(body.info) : undefined,
        author: body.uname ? decodeName(body.uname) : undefined,
        play_count: formatPlayCount(body.playnum),
      },
    }
  },
}

export default kw
