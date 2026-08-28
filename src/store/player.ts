/** 播放器状态 slice */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MusicInfo, TogglePlayMethod } from '../types'

export interface PlayerState {
  /** 当前播放列表（所在列表的歌曲数组快照） */
  playList: MusicInfo[]
  /** 当前播放歌曲信息 */
  musicInfo: MusicInfo | null
  /** 当前播放列表 id（本地歌单 id 或临时列表） */
  listId: string | null
  /** 当前播放索引 */
  playIndex: number
  /** 是否播放中 */
  isPlay: boolean
  /** 音量 0-1 */
  volume: number
  /** 倍速 */
  playRate: number
  /** 状态文本（加载中/播放中...） */
  statusText: string
  /** 进度（秒） */
  nowPlayTime: number
  maxPlayTime: number
  /** 最后一句歌词 */
  lastLyric: string | undefined
  /** 循环模式 */
  togglePlayMethod: TogglePlayMethod
  /** 是否稍后播放 */
  isTempPlay: boolean
}

const initialState: PlayerState = {
  playList: [],
  musicInfo: null,
  listId: null,
  playIndex: -1,
  isPlay: false,
  volume: 1,
  playRate: 1,
  statusText: '',
  nowPlayTime: 0,
  maxPlayTime: 0,
  lastLyric: undefined,
  togglePlayMethod: 'listLoop',
  isTempPlay: false,
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    /** 设置播放列表与当前歌曲 */
    setPlayState(
      state,
      action: PayloadAction<{ playList: MusicInfo[]; musicInfo: MusicInfo; playIndex: number; listId: string | null; isTempPlay?: boolean }>,
    ) {
      const { playList, musicInfo, playIndex, listId, isTempPlay } = action.payload
      state.playList = playList
      state.musicInfo = musicInfo
      state.playIndex = playIndex
      state.listId = listId
      state.isTempPlay = isTempPlay ?? false
      state.nowPlayTime = 0
      state.maxPlayTime = 0
      state.lastLyric = undefined
    },
    setPlayIndex(state, action: PayloadAction<number>) {
      state.playIndex = action.payload
      state.nowPlayTime = 0
      state.maxPlayTime = 0
      state.lastLyric = undefined
    },
    setIsPlay(state, action: PayloadAction<boolean>) {
      state.isPlay = action.payload
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload
    },
    setPlayRate(state, action: PayloadAction<number>) {
      state.playRate = action.payload
    },
    setStatusText(state, action: PayloadAction<string>) {
      state.statusText = action.payload
    },
    setProgress(state, action: PayloadAction<{ nowPlayTime: number; maxPlayTime: number }>) {
      state.nowPlayTime = action.payload.nowPlayTime
      state.maxPlayTime = action.payload.maxPlayTime
    },
    setLastLyric(state, action: PayloadAction<string | undefined>) {
      state.lastLyric = action.payload
    },
    setTogglePlayMethod(state, action: PayloadAction<TogglePlayMethod>) {
      state.togglePlayMethod = action.payload
    },
    setPlayList(state, action: PayloadAction<{ playList: MusicInfo[]; listId: string | null }>) {
      state.playList = action.payload.playList
      state.listId = action.payload.listId
    },
    clearPlayState(state) {
      state.playList = []
      state.musicInfo = null
      state.playIndex = -1
      state.isPlay = false
      state.nowPlayTime = 0
      state.maxPlayTime = 0
      state.lastLyric = undefined
    },
  },
})

export const {
  setPlayState,
  setPlayIndex,
  setIsPlay,
  setVolume,
  setPlayRate,
  setStatusText,
  setProgress,
  setLastLyric,
  setTogglePlayMethod,
  setPlayList,
  clearPlayState,
} = playerSlice.actions
export default playerSlice.reducer
