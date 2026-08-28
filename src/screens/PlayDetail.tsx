/** 播放详情页（Modal 全屏）：封面 + 歌词 + 控制条 + 播放列表 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, TouchableOpacity, Image, Modal, FlatList, SafeAreaView, ActivityIndicator, ActionSheetIOS, StyleSheet,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useProgress } from 'react-native-track-player'
import { RootState } from '../store'
import { playByIndex, playNext, playPrev, togglePlay, seekTo, setPlayRate } from '../core/player'
import { setTogglePlayMethod } from '../store/player'
import { getSource } from '../musicSdk'
import { MusicInfo, TogglePlayMethod, playMethodNames } from '../types'
import { parseLrc, LrcLine } from '../utils/lrc'
import LrcView from '../components/LrcView'
import ProgressBar from '../components/ProgressBar'
import SongItem from '../components/SongItem'

const PlayDetail: React.FC<{ componentId: string }> = ({ componentId }) => {
  const musicInfo = useSelector((s: RootState) => s.player.musicInfo)
  const playList = useSelector((s: RootState) => s.player.playList)
  const playIndex = useSelector((s: RootState) => s.player.playIndex)
  const isPlay = useSelector((s: RootState) => s.player.isPlay)
  const togglePlayMethod = useSelector((s: RootState) => s.player.togglePlayMethod)
  const showTranslation = useSelector((s: RootState) => s.setting['player.isShowLyricTranslation'])
  const playRate = useSelector((s: RootState) => s.player.playRate)
  const dispatch = useDispatch()

  const { position, duration } = useProgress(500)
  const [showList, setShowList] = useState(false)
  const [lyricLines, setLyricLines] = useState<LrcLine[]>([])
  const [transLines, setTransLines] = useState<LrcLine[]>([])
  const [lyricLoading, setLyricLoading] = useState(false)
  const [showLrc, setShowLrc] = useState(true)

  // 歌词加载
  useEffect(() => {
    setLyricLines([])
    setTransLines([])
    if (!musicInfo) return
    let cancelled = false
    setLyricLoading(true)
    getSource(musicInfo.source)
      .getLyric(musicInfo)
      .then(info => {
        if (cancelled) return
        setLyricLines(parseLrc(info.lyric))
        setTransLines(parseLrc(info.translation ?? ''))
      })
      .catch(() => {
        if (!cancelled) setLyricLines([])
      })
      .finally(() => {
        if (!cancelled) setLyricLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [musicInfo?.source, musicInfo?.songmid])

  const mergedLines = useMemo(() => {
    if (!showTranslation || !transLines.length) return lyricLines
    const map = new Map<number, string>()
    for (const l of transLines) map.set(l.time, l.text)
    return lyricLines.map(l => {
      const t = map.get(l.time)
      return t ? { ...l, text: `${l.text}\n${t}` } : l
    })
  }, [lyricLines, transLines, showTranslation])

  if (!musicInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无播放</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => Navigation.dismissModal(componentId)}>
            <Text style={styles.closeText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const pickMethod = () => {
    const methods = Object.keys(playMethodNames) as TogglePlayMethod[]
    const names = methods.map(m => playMethodNames[m])
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '循环模式', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) dispatch(setTogglePlayMethod(methods[index - 1]))
      },
    )
  }

  const pickRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const names = rates.map(r => `${r}x`)
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '播放倍速', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) {
          dispatch({ type: 'player/setPlayRate', payload: rates[index - 1] })
          void setPlayRate(rates[index - 1])
        }
      },
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Navigation.dismissModal(componentId)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerBtn}>↓</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{musicInfo.name}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{musicInfo.singer}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowList(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerBtn}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* 封面 / 歌词切换 */}
      <View style={styles.body}>
        <View style={styles.switchRow}>
          <TouchableOpacity onPress={() => setShowLrc(false)}>
            <Text style={[styles.switchText, !showLrc && styles.switchActive]}>封面</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLrc(true)}>
            <Text style={[styles.switchText, showLrc && styles.switchActive]}>歌词</Text>
          </TouchableOpacity>
        </View>
        {showLrc ? (
          lyricLoading ? (
            <View style={styles.lyricLoading}>
              <ActivityIndicator color="#07c556" />
            </View>
          ) : (
            <LrcView lines={mergedLines} currentTimeMs={position * 1000} fontSize={16} lineHeight={34} />
          )
        ) : (
          <View style={styles.coverWrap}>
            {musicInfo.img ? (
              <Image source={{ uri: musicInfo.img }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverIcon}>♪</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 进度条 */}
      <ProgressBar
        progress={duration > 0 ? position / duration : 0}
        nowTime={position}
        maxTime={duration || musicInfo.interval}
        onSeek={s => void seekTo(s)}
      />

      {/* 控制条 */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={pickMethod}>
          <Text style={styles.ctrlIcon}>
            {togglePlayMethod === 'singleLoop' ? '🔂' : togglePlayMethod === 'listRandom' ? '🔀' : '🔁'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => void playPrev()}>
          <Text style={styles.ctrlIconBig}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, styles.playBtn]} onPress={() => void togglePlay()}>
          <Text style={styles.playIcon}>{isPlay ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => void playNext()}>
          <Text style={styles.ctrlIconBig}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={pickRate}>
          <Text style={styles.rateText}>{playRate}x</Text>
        </TouchableOpacity>
      </View>

      {/* 播放列表 Modal */}
      <Modal visible={showList} animationType="slide" transparent onRequestClose={() => setShowList(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>播放列表（{playList.length}）</Text>
              <TouchableOpacity onPress={() => setShowList(false)}>
                <Text style={styles.modalClose}>完成</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={playList}
              keyExtractor={(item, i) => `${item.source}_${item.songmid}_${i}`}
              renderItem={({ item, index }) => (
                <SongItem
                  musicInfo={item}
                  index={index}
                  isActive={index === playIndex}
                  onPress={() => {
                    if (index !== playIndex) {
                      void playByIndex(index)
                    }
                    setShowList(false)
                  }}
                />
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    fontSize: 22,
    color: '#1c1c1e',
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  headerSub: {
    fontSize: 12,
    color: '#8a8a93',
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#b0b0b8',
    marginHorizontal: 14,
    paddingBottom: 4,
  },
  switchActive: {
    color: '#07c556',
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: '#07c556',
  },
  lyricLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 280,
    height: 280,
    borderRadius: 18,
  },
  coverPlaceholder: {
    backgroundColor: '#e8f6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    fontSize: 80,
    color: '#07c556',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlIcon: {
    fontSize: 22,
  },
  ctrlIconBig: {
    fontSize: 28,
    color: '#1c1c1e',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#07c556',
  },
  playIcon: {
    fontSize: 26,
    color: '#ffffff',
  },
  rateText: {
    fontSize: 15,
    color: '#55555c',
    fontWeight: '600',
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    height: '60%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  modalClose: {
    fontSize: 14,
    color: '#07c556',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8a8a93',
    marginBottom: 20,
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f2f2f4',
  },
  closeText: {
    fontSize: 14,
    color: '#1c1c1e',
  },
})

export default PlayDetail
