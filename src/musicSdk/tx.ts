/** QQ 音乐源（tx）
 * 搜索/歌词 + 内置 musicu.fcg 播放地址
 */
import { httpGetJson } from '../utils/request'
import { decodeName, formatPlayCount } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality, SongListTag, SongListTagGroup, SongListResult, SongListDetail, Source } from '../types'

const SEARCH_URL = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp'
const VKEY_URL = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
const LYRIC_URL = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'

const guid = (): string => Math.floor(1000000000 + Math.random() * 9000000000).toString()

export const tx = {
  id: 'tx' as const,
  name: 'QQ音乐',

  async search(str: string, page = 1, limit = 30): Promise<SearchResult> {
    const url = `${SEARCH_URL}?p=${page}&n=${limit}&w=${encodeURIComponent(str)}&format=json&cr=1`
    const body = await httpGetJson(url)
    const rawList = body?.data?.song?.list ?? []
    const list: MusicInfo[] = rawList.map((raw: any) => {
      const types: MusicInfo['types'] = []
      const _types: MusicInfo['_types'] = {}
      if (raw.size128) {
        types.push({ type: '128k', size: '' })
        _types['128k'] = { size: '' }
      }
      if (raw.size320) {
        types.push({ type: '320k', size: '' })
        _types['320k'] = { size: '' }
      }
      if (raw.sizeflac) {
        types.push({ type: 'flac', size: '' })
        _types.flac = { size: '' }
      }
      const singers = (raw.singer ?? []).map((s: any) => s.name).filter(Boolean)
      return {
        name: decodeName(raw.songname),
        singer: singers.join('、'),
        source: 'tx',
        songmid: raw.songmid,
        albumId: raw.albummid,
        interval: raw.interval ?? 0,
        albumName: decodeName(raw.albumname || ''),
        lrc: null,
        img: raw.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${raw.albummid}.jpg` : null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    const total = body?.data?.song?.totalnum ?? list.length
    return {
      list,
      allPage: Math.max(1, Math.ceil(total / limit)),
      total,
      limit,
    }
  },

  /** 获取播放地址（musicu.fcg vkey 接口） */
  async getMusicUrl(songInfo: MusicInfo, quality: Quality): Promise<string> {
    const data = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          guid: guid(),
          songmid: [songInfo.songmid],
          songtype: [0],
          uin: '0',
          loginflag: 1,
          platform: '20',
        },
      },
    }
    const body = await httpGetJson(`${VKEY_URL}?format=json&data=${encodeURIComponent(JSON.stringify(data))}`, {
      headers: { Referer: 'https://y.qq.com' },
    })
    const urlInfo = body?.req_0?.data?.midurlinfo?.[0]
    const purl = urlInfo?.purl
    if (!purl) throw new Error('获取播放地址失败（可能受版权保护）')
    return `https://isure.stream.qqmusic.qq.com/${purl}`
  },

  /** 获取歌词（base64 编码，需 Referer） */
  async getLyric(songInfo: MusicInfo): Promise<LyricInfo> {
    const body = await httpGetJson(
      `${LYRIC_URL}?songmid=${songInfo.songmid}&format=json&nobase64=1`,
      { headers: { Referer: 'https://y.qq.com' } },
    )
    if (!body?.lyric) throw new Error('获取歌词失败')
    const lyric = decodeName(Buffer.from(body.lyric, 'base64').toString('utf-8'))
    let translation = ''
    if (body.trans && body.trans !== 'null') {
      translation = decodeName(Buffer.from(body.trans, 'base64').toString('utf-8'))
    }
    return { lyric, translation }
  },

  /** 歌单标签 */
  async getSongListTags(): Promise<{ tags: SongListTagGroup[]; hotTag: SongListTag[]; source: Source }> {
    const data = {
      comm: { cv: 1602, ct: 20 },
      tags: {
        method: 'get_all_categories',
        param: { qq: '' },
        module: 'playlist.PlaylistAllCategoriesServer',
      },
    }
    const body = await httpGetJson(`${VKEY_URL}?format=json&data=${encodeURIComponent(JSON.stringify(data))}`, {
      headers: { Referer: 'https://y.qq.com' },
    })
    const groups = body?.tags?.data?.v_group ?? []
    const tags: SongListTagGroup[] = groups.map((g: any) => ({
      name: g.group_name,
      list: (g.v_item ?? []).map((t: any) => ({ id: String(t.id), name: t.name, source: 'tx' as Source })),
    }))
    // 热门标签：取第一个分组的第一个分类常用项
    const hotTag: SongListTag[] = (groups[0]?.v_item ?? []).slice(0, 12).map((t: any) => ({
      id: String(t.id),
      name: t.name,
      source: 'tx' as Source,
    }))
    return { tags, hotTag, source: 'tx' }
  },

  /** 歌单列表 */
  async getSongList(sortId: string, tagId: string, page = 1): Promise<SongListResult> {
    const data = tagId
      ? {
          comm: { cv: 1602, ct: 20 },
          playlist: {
            method: 'get_category_content',
            param: { titleid: parseInt(tagId, 10), caller: '0', category_id: parseInt(tagId, 10), size: 36, page: page - 1, use_page: 1 },
            module: 'playlist.PlayListCategoryServer',
          },
        }
      : {
          comm: { cv: 1602, ct: 20 },
          playlist: {
            method: 'get_playlist_by_tag',
            param: { id: 10000000, sin: 36 * (page - 1), size: 36, order: sortId, cur_page: page },
            module: 'playlist.PlayListPlazaServer',
          },
        }
    const body = await httpGetJson(`${VKEY_URL}?format=json&data=${encodeURIComponent(JSON.stringify(data))}`, {
      headers: { Referer: 'https://y.qq.com' },
    })
    const raw = tagId ? body?.playlist?.data?.content?.v_item : body?.playlist?.data?.v_playlist
    if (!raw) throw new Error('获取歌单列表失败')
    const list = raw.map((item: any) => {
      const basic = tagId ? item?.basic ?? item : item
      return {
        play_count: formatPlayCount(basic.play_cnt ?? basic.access_num),
        id: String(basic.tid ?? basic.dissid),
        author: basic.creator?.nick ?? basic.creator_info?.nick ?? '',
        name: basic.title ?? basic.dissname ?? '',
        img: basic.cover?.medium_url ?? basic.cover_url_medium ?? '',
        total: basic.total_cnt ?? basic.song_ids?.length,
        desc: basic.desc ? decodeName(basic.desc).replace(/<br>/g, '\n') : '',
        source: 'tx' as Source,
      }
    })
    return { list, total: list.length, page, limit: 36, source: 'tx' }
  },

  /** 歌单详情 */
  async getSongListDetail(id: string, _page = 1): Promise<SongListDetail> {
    const url = `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&new_format=1&disstid=${id}&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`
    const body = await httpGetJson(url, { headers: { Referer: 'https://y.qq.com' } })
    const cdlist = body?.cdlist?.[0]
    if (!cdlist?.songlist) throw new Error('获取歌单详情失败')
    const list: MusicInfo[] = cdlist.songlist.map((item: any) => {
      const types: MusicInfo['types'] = []
      const _types: MusicInfo['_types'] = {}
      const pushType = (type: MusicInfo['types'][number]['type'], size: number) => {
        if (!size) return
        types.push({ type, size: sizeFormate(size) })
        _types[type] = { size: sizeFormate(size) }
      }
      pushType('128k', item.file?.size_128mp3)
      pushType('320k', item.file?.size_320mp3)
      pushType('flac', item.file?.size_flac)
      const singers = (item.singer ?? []).map((s: any) => s.name).filter(Boolean)
      return {
        name: item.title ?? '',
        singer: singers.join('、'),
        source: 'tx' as Source,
        songmid: item.mid ?? '',
        albumId: item.album?.mid,
        interval: item.interval ?? 0,
        albumName: item.album?.name ?? '',
        lrc: null,
        img: item.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
    return {
      list,
      page: 1,
      limit: list.length,
      total: list.length,
      source: 'tx',
      info: {
        name: cdlist.dissname ?? '',
        img: cdlist.logo || undefined,
        desc: cdlist.desc ? decodeName(cdlist.desc).replace(/<br>/g, '\n') : undefined,
        author: cdlist.nickname || undefined,
        play_count: formatPlayCount(cdlist.visitnum),
      },
    }
  },
}

/** 文件大小格式化 */
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

export default tx
