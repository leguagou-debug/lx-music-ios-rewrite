/** 播放详情页（Modal 全屏）：封面 + 歌词 + 控制条 + 播放列表 + 定时停止 + 音质切换 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, TouchableOpacity, Image, Modal, FlatList, SafeAreaView, ActivityIndicator, ActionSheetIOS, Alert, StyleSheet,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useProgress } from 'react-native-track-player'
import { RootState } from '../store'
import { playByIndex, playNext, playPrev, togglePlay, seekTo, setPlayRate, removeFromPlayList, clearPlayList, switchQuality } from '../core/player'
import { setTogglePlayMethod } from '../store/player'
import { setSetting } from '../store/setting'
import { getSource, supportQuality } from '../musicSdk'
import { MusicInfo, TogglePlayMethod, playMethodNames, Quality } from '../types'
import { parseLrc, LrcLine } from '../utils/lrc'
import LrcView from '../components/LrcView'
import ProgressBar from '../components/ProgressBar'
import SongItem from '../components/SongItem'
import { useTheme } from '../theme'

const PlayDetail: React.FC<{ componentId: string }> = ({ componentId }) => {
  const t = useTheme()
  const c = t.colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerBtn: {
      fontSize: 22,
      color: c.text,
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
      color: c.text,
    },
    headerSub: {
      fontSize: 12,
      color: c.weakText,
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
      color: c.weakText,
      marginHorizontal: 14,
      paddingBottom: 4,
    },
    switchActive: {
      color: c.primary,
      fontWeight: '700',
      borderBottomWidth: 2,
      borderBottomColor: c.primary,
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
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverIcon: {
      fontSize: 80,
      color: c.primary,
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
      color: c.text,
    },
    playBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primary,
    },
    playIcon: {
      fontSize: 26,
      color: c.primaryText,
    },
    rateText: {
      fontSize: 15,
      color: c.subText,
      fontWeight: '600',
    },
    toolsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 30,
      paddingBottom: 16,
    },
    toolBtn: {
      alignItems: 'center',
    },
    toolText: {
      fontSize: 11,
      color: c.weakText,
      marginTop: 4,
    },
    modalMask: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalBody: {
      height: '60%',
      backgroundColor: c.card,
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
      borderBottomColor: c.divider,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    modalClose: {
      fontSize: 14,
      color: c.primary,
    },
    modalActions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    modalActionBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: c.bg,
      marginRight: 10,
    },
    modalActionText: {
      fontSize: 12,
      color: c.subText,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.weakText,
      marginBottom: 20,
    },
    closeBtn: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    closeText: {
      fontSize: 14,
      color: c.text,
    },
  })
  const musicInfo = useSelector((s: RootState) => s.player.musicInfo)
  const playList = useSelector((s: RootState) => s.player.playList)
  const playIndex = useSelector((s: RootState) => s.player.playIndex)
  const isPlay = useSelector((s: RootState) => s.player.isPlay)
  const togglePlayMethod = useSelector((s: RootState) => s.player.togglePlayMethod)
  const showTranslation = useSelector((s: RootState) => s.setting['player.isShowLyricTranslation'])
  const playRate = useSelector((s: RootState) => s.player.playRate)
  const playQuality = useSelector((s: RootState) => s.setting['player.playQuality'])
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
      const tr = map.get(l.time)
      return tr ? { ...l, text: `${l.text}\n${tr}` } : l
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

  const pickQuality = () => {
    const qs: Quality[] = supportQuality[musicInfo.source]?.length ? supportQuality[musicInfo.source] : ['128k', '320k', 'flac']
    const names = qs.map(q => (q === 'flac' ? '无损 FLAC' : q === 'flac24bit' ? 'Hi-Res' : q))
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '切换音质', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) void switchQuality(qs[index - 1])
      },
    )
  }

  const pickTimeout = () => {
    const mins = [10, 15, 30, 60, 90]
    const names = mins.map(m => `${m} 分钟`)
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '定时停止播放', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) {
          const ms = mins[index - 1] * 60 * 1000
          Alert.alert('已设置', `${mins[index - 1]} 分钟后停止播放`, [{ text: '知道了' }])
          setTimeout(() => {
            void require('../core/player').stopPlay()
          }, ms)
        }
      },
    )
  }

  const onRemoveMusic = (index: number) => {
    Alert.alert('移除歌曲', `${playList[index]?.name ?? ''}`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => void removeFromPlayList(index) },
    ])
  }

  const onClearList = () => {
    Alert.alert('清空播放列表', '将保留当前正在播放的歌曲，确定？', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: () => void clearPlayList() },
    ])
  }

  const toggleTranslation = () => {
    dispatch(setSetting({ 'player.isShowLyricTranslation': !showTranslation }))
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
              <ActivityIndicator color={c.primary} />
            </View>
          ) : (
            <LrcView
              lines={mergedLines}
              currentTimeMs={position * 1000}
              fontSize={16}
              lineHeight={34}
              activeColor={c.primary}
              inactiveColor={c.weakText}
            />
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

      {/* 工具行：音质 / 歌词翻译 / 定时停止 */}
      <View style={styles.toolsRow}>
        <TouchableOpacity style={styles.toolBtn} onPress={pickQuality}>
          <Text style={styles.rateText}>🎵</Text>
          <Text style={styles.toolText}>{playQuality}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={toggleTranslation}>
          <Text style={styles.rateText}>🌐</Text>
          <Text style={styles.toolText}>{showTranslation ? '翻译开' : '翻译关'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={pickTimeout}>
          <Text style={styles.rateText}>⏱</Text>
          <Text style={styles.toolText}>定时停止</Text>
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
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionBtn} onPress={onClearList}>
                <Text style={styles.modalActionText}>清空列表</Text>
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
                  onLongPress={() => onRemoveMusic(index)}
                />
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default PlayDetail
