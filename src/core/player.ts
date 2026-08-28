/** 播放器核心封装（react-native-track-player 官方版）
 * 策略：queue 始终只放当前歌曲，上下首/自动下一首时动态加载（与原仓库临时播放列表思路一致）
 */
import TrackPlayer, { Event, Capability, AppKilledPlaybackBehavior, IOSCategory, IOSCategoryMode, State } from 'react-native-track-player'
import { store } from '../store'
import {
  setIsPlay,
  setPlayIndex,
  setPlayState,
  setStatusText,
  setLastLyric,
  setProgress,
} from '../store/player'
import { getSource } from '../musicSdk'
import { MusicInfo, TogglePlayMethod, Quality } from '../types'
import { parseLrc, findCurrentLine } from '../utils/lrc'

let isSetup = false
let isInited = false

/** 初始化播放器（App 启动时调用一次） */
export const setupPlayer = async (): Promise<void> => {
  if (isSetup) return
  await TrackPlayer.setupPlayer({
    iosCategory: IOSCategory.Playback,
    iosCategoryMode: IOSCategoryMode.Default,
    autoHandleInterruptions: true,
  })
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
    progressUpdateEventInterval: 1,
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
  })
  isSetup = true
  isInited = true
}

/** 构建 track-player 轨道对象 */
const buildTrack = (musicInfo: MusicInfo, url: string) => ({
  id: `${musicInfo.source}_${musicInfo.songmid}`,
  url,
  title: musicInfo.name,
  artist: musicInfo.singer,
  artwork: musicInfo.img ?? undefined,
  duration: musicInfo.interval,
  // 附加元数据（自定义字段，事件回调可用）
  source: musicInfo.source,
  songmid: musicInfo.songmid,
} as any)

/** 根据循环模式计算下一首索引 */
export const getNextIndex = (playIndex: number, playListLength: number, method: TogglePlayMethod, isNext = true): number => {
  if (playListLength <= 0) return -1
  switch (method) {
    case 'singleLoop':
      return playIndex
    case 'listRandom':
      if (playListLength === 1) return playIndex
      let i = Math.floor(Math.random() * playListLength)
      while (i === playIndex) i = Math.floor(Math.random() * playListLength)
      return i
    case 'listOrder':
      return isNext ? (playIndex + 1 >= playListLength ? -1 : playIndex + 1) : playIndex - 1
    case 'listLoop':
    default:
      if (isNext) return (playIndex + 1) % playListLength
      return playIndex - 1 < 0 ? playListLength - 1 : playIndex - 1
  }
}

/** 获取播放地址（带缓存：同一歌曲同一音质只请求一次） */
const urlCache = new Map<string, string>()
export const getMusicUrlCached = async (musicInfo: MusicInfo, quality: Quality): Promise<string> => {
  const key = `${musicInfo.source}_${musicInfo.songmid}_${quality}`
  const cached = urlCache.get(key)
  if (cached) return cached
  const url = await getSource(musicInfo.source).getMusicUrl(musicInfo, quality)
  urlCache.set(key, url)
  return url
}

/** 播放列表中指定索引的歌曲 */
export const playByIndex = async (index: number): Promise<void> => {
  const state = store.getState().player
  const list = state.playList
  if (!list.length || index < 0 || index >= list.length) return
  const musicInfo = list[index]
  const quality = store.getState().setting['player.playQuality']
  store.dispatch(setPlayIndex(index))
  store.dispatch(setStatusText('加载中…'))
  try {
    const url = await getMusicUrlCached(musicInfo, quality)
    // 防止竞态：加载期间用户已切换歌曲
    const nowIndex = store.getState().player.playIndex
    if (nowIndex !== index) return
    const track = buildTrack(musicInfo, url)
    await TrackPlayer.reset()
    await TrackPlayer.add(track)
    await TrackPlayer.setRate(store.getState().player.playRate || 1)
    await TrackPlayer.setVolume(store.getState().player.volume ?? 1)
    await TrackPlayer.play()
    store.dispatch(setIsPlay(true))
    store.dispatch(setStatusText(''))
    void loadLyric(musicInfo)
  } catch (err: any) {
    if (store.getState().player.playIndex !== index) return
    store.dispatch(setIsPlay(false))
    store.dispatch(setStatusText(''))
    // 播放失败提示
    console.warn('[playByIndex]', err?.message ?? err)
  }
}

/** 以指定列表播放 */
export const playList = async (list: MusicInfo[], playIndex: number, listId: string | null = null): Promise<void> => {
  if (!list.length) return
  store.dispatch(setPlayState({ playList: list, musicInfo: list[playIndex], playIndex, listId }))
  await playByIndex(playIndex)
}

/** 播放下一首 */
export const playNext = async (): Promise<void> => {
  const state = store.getState().player
  const next = getNextIndex(state.playIndex, state.playList.length, state.togglePlayMethod, true)
  if (next < 0) {
    await TrackPlayer.pause()
    store.dispatch(setIsPlay(false))
    return
  }
  await playByIndex(next)
}

/** 播放上一首 */
export const playPrev = async (): Promise<void> => {
  const state = store.getState().player
  const prev = getNextIndex(state.playIndex, state.playList.length, state.togglePlayMethod, false)
  if (prev < 0) return
  await playByIndex(prev)
}

/** 切换播放/暂停 */
export const togglePlay = async (): Promise<void> => {
  const state = store.getState().player
  const playbackState = await TrackPlayer.getPlaybackState()
  if (state.isPlay && playbackState.state === State.Playing) {
    await TrackPlayer.pause()
    store.dispatch(setIsPlay(false))
  } else {
    if (!state.musicInfo) return
    if (playbackState.state === State.Paused) {
      await TrackPlayer.play()
      store.dispatch(setIsPlay(true))
    } else {
      await playByIndex(state.playIndex)
    }
  }
}

/** 跳转进度（秒） */
export const seekTo = async (seconds: number): Promise<void> => {
  await TrackPlayer.seekTo(Math.max(0, seconds))
}

/** 设置倍速 */
export const setPlayRate = async (rate: number): Promise<void> => {
  store.dispatch({ type: 'player/setPlayRate', payload: rate })
  await TrackPlayer.setRate(rate)
}

/** 设置音量 */
export const setVolume = async (volume: number): Promise<void> => {
  store.dispatch({ type: 'player/setVolume', payload: volume })
  await TrackPlayer.setVolume(volume)
}

/** 加载歌词并更新 lastLyric */
let lyricTimer: ReturnType<typeof setInterval> | null = null
const loadLyric = async (musicInfo: MusicInfo): Promise<void> => {
  if (lyricTimer) {
    clearInterval(lyricTimer)
    lyricTimer = null
  }
  try {
    const info = await getSource(musicInfo.source).getLyric(musicInfo)
    const lines = parseLrc(info.lyric)
    const translationLines = parseLrc(info.translation ?? '')
    if (store.getState().player.musicInfo?.songmid !== musicInfo.songmid) return
    lyricTimer = setInterval(() => {
      void TrackPlayer.getProgress().then(({ position }) => {
        const idx = findCurrentLine(lines, position * 1000)
        if (idx >= 0 && idx < lines.length) {
          let text = lines[idx].text
          if (translationLines.length && store.getState().setting['player.isShowLyricTranslation']) {
            const tIdx = findCurrentLine(translationLines, position * 1000)
            const t = translationLines[tIdx]?.text
            if (t) text = `${text}\n${t}`
          }
          store.dispatch(setLastLyric(text))
        }
      })
    }, 500)
  } catch {
    store.dispatch(setLastLyric('暂无歌词'))
  }
}

/** 停止播放 */
export const stopPlay = async (): Promise<void> => {
  await TrackPlayer.stop()
  store.dispatch(setIsPlay(false))
}

/** 注册播放器全局事件（后台播放完成自动下一首） */
export const registerPlayerEvents = (): void => {
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    const state = store.getState().player
    if (!state.musicInfo) return
    // 手动驱动自动下一首（repeatMode 保持 Off）
    if (state.togglePlayMethod === 'singleLoop') {
      void playByIndex(state.playIndex)
    } else {
      void playNext()
    }
  })
  TrackPlayer.addEventListener(Event.PlaybackState, ({ state: s }) => {
    if (s === State.Paused || s === State.Stopped) {
      const st = store.getState().player
      if (st.isPlay && s === State.Paused) store.dispatch(setIsPlay(false))
    }
  })
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    store.dispatch(setIsPlay(false))
  })
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    store.dispatch(setIsPlay(true))
  })
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void playNext()
  })
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void playPrev()
  })
}

export const playerIsInited = (): boolean => isInited
