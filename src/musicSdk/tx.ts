/** QQ 音乐源（tx）
 * 搜索/歌词 + 内置 musicu.fcg 播放地址
 */
import { httpGetJson } from '../utils/request'
import { decodeName } from '../utils/format'
import type { MusicInfo, SearchResult, LyricInfo, Quality } from '../types'

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
}

export default tx
