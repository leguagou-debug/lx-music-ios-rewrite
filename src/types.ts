/** 音乐源标识 */
export type Source = 'kw' | 'kg' | 'tx' | 'wy' | 'mg' | 'xm'

/** 音质 */
export type Quality = '128k' | '320k' | 'flac' | 'flac24bit' | 'wav'

export interface QualityType {
  type: Quality
  size: string
}

/** 各音质详情（hash 为酷狗等源需要） */
export type TypeMap = Record<string, { size: string; hash?: string }>

/** 歌曲信息（统一结构，与原仓库对齐） */
export interface MusicInfo {
  /** 歌曲名 */
  name: string
  /** 歌手（多歌手用顿号分隔） */
  singer: string
  /** 来源 */
  source: Source
  /** 歌曲在来源中的 id */
  songmid: string
  /** 专辑 id */
  albumId?: string
  /** 时长（秒） */
  interval: number
  /** 专辑名 */
  albumName?: string
  /** 歌词文本（可直接用则不请求） */
  lrc: string | null
  /** 封面 url */
  img: string | null
  /** 同歌曲其它音源信息（多音源候选） */
  otherSource: MusicInfo[] | null
  /** 可用音质列表 */
  types: QualityType[]
  _types: TypeMap
  typeUrl: Record<string, string>
}

/** 搜索结果 */
export interface SearchResult {
  list: MusicInfo[]
  allPage: number
  total: number
  limit: number
}

/** 歌词信息 */
export interface LyricInfo {
  lyric: string
  translation?: string
  romalrc?: string
}

/** 排行榜 */
export interface LeaderboardInfo {
  id: string
  name: string
  img: string
}

/** 排行榜歌曲列表 */
export interface LeaderboardList {
  list: MusicInfo[]
  page: number
  allPage: number
  total: number
  limit: number
}

/** 热门搜索词 */
export type HotSearch = Array<{ word: string }>

/** 歌单标签 */
export interface SongListTag {
  id: string
  name: string
  source: Source
}

/** 歌单标签分类（如「语种」「场景」等分组） */
export interface SongListTagGroup {
  name: string
  list: SongListTag[]
}

/** 歌单信息（广场列表项） */
export interface SongListInfo {
  id: string
  name: string
  author?: string
  img?: string
  play_count?: string | number
  total?: number
  desc?: string
  source: Source
}

/** 歌单广场列表结果 */
export interface SongListResult {
  list: SongListInfo[]
  total: number
  page: number
  limit: number
  source: Source
}

/** 歌单详情结果 */
export interface SongListDetail {
  list: MusicInfo[]
  page: number
  limit: number
  total: number
  source: Source
  info?: {
    name: string
    img?: string
    desc?: string
    author?: string
    play_count?: string | number
  }
}

/** 本地歌单 */
export interface PlayList {
  id: string
  name: string
  /** 歌曲列表 */
  musicList: MusicInfo[]
  /** 来源（本地=local，收藏=songs） */
  source?: string
}

/** 播放信息 */
export interface PlayMusicInfo {
  /** 所在列表 id */
  listId: string | null
  /** 歌曲信息 */
  musicInfo: MusicInfo | null
  /** 是否稍后播放 */
  isTempPlay: boolean
}

/** 设置项（与原仓库 defaultSetting 对齐的关键项） */
export interface AppSetting {
  version: string
  'common.apiSource': string
  'common.autoHidePlayBar': boolean
  'common.drawerLayoutPosition': 'left' | 'right'
  'common.isAgreePact': boolean
  'player.startupAutoPlay': boolean
  'player.togglePlayMethod': 'listLoop' | 'listRandom' | 'listOrder' | 'singleLoop'
  'player.playQuality': Quality
  'player.isSavePlayTime': boolean
  'player.volume': number
  'player.playbackRate': number
  'player.cacheSize': string
  'player.isShowLyricTranslation': boolean
  'player.isShowLyricRoma': boolean
  'player.isS2t': boolean
  'playDetail.style.align': 'left' | 'center'
  'playDetail.vertical.style.lrcFontSize': number
  'list.isShowSource': boolean
  'list.isShowAlbumName': boolean
  'list.isShowInterval': boolean
  'list.addMusicLocationType': 'top' | 'bottom'
  'download.fileName': string
  'theme.id': string
  'search.isShowHotSearch': boolean
  'search.isShowHistorySearch': boolean
  'theme.mode': 'light' | 'dark' | 'system'
  'theme.primaryColor': string
  'player.timeoutExit': boolean
  'player.timeoutExitMinutes': number
  'player.startupPushPlayDetailScreen': boolean
  'list.isClickPlayList': boolean
  'common.showBackBtn': boolean
}

export const defaultSetting: AppSetting = {
  version: '2.0',
  'common.apiSource': 'kw',
  'common.autoHidePlayBar': true,
  'common.drawerLayoutPosition': 'left',
  'common.isAgreePact': true,
  'player.startupAutoPlay': false,
  'player.togglePlayMethod': 'listLoop',
  'player.playQuality': '128k',
  'player.isSavePlayTime': false,
  'player.volume': 1,
  'player.playbackRate': 1,
  'player.cacheSize': '1024',
  'player.isShowLyricTranslation': false,
  'player.isShowLyricRoma': false,
  'player.isS2t': false,
  'playDetail.style.align': 'left',
  'playDetail.vertical.style.lrcFontSize': 210,
  'list.isShowSource': true,
  'list.isShowAlbumName': false,
  'list.isShowInterval': true,
  'list.addMusicLocationType': 'top',
  'download.fileName': '歌名 - 歌手',
  'theme.id': 'green',
  'search.isShowHotSearch': false,
  'search.isShowHistorySearch': false,
  'theme.mode': 'system',
  'theme.primaryColor': '#07c556',
  'player.timeoutExit': false,
  'player.timeoutExitMinutes': 30,
  'player.startupPushPlayDetailScreen': false,
  'list.isClickPlayList': true,
  'common.showBackBtn': true,
}

/** 循环模式 */
export type TogglePlayMethod = 'listLoop' | 'listRandom' | 'listOrder' | 'singleLoop'

export const playMethodNames: Record<TogglePlayMethod, string> = {
  listLoop: '列表循环',
  listRandom: '随机播放',
  listOrder: '顺序播放',
  singleLoop: '单曲循环',
}
