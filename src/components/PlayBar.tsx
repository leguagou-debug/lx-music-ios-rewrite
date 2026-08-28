/** 底部播放条（所有 Tab 页底部固定显示） */
import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { togglePlay } from '../core/player'
import { formatInterval } from '../utils/format'
import { getSourceName } from '../musicSdk'

const PlayBar: React.FC<{ componentId?: string }> = ({ componentId }) => {
  const musicInfo = useSelector((s: RootState) => s.player.musicInfo)
  const isPlay = useSelector((s: RootState) => s.player.isPlay)
  const nowPlayTime = useSelector((s: RootState) => s.player.nowPlayTime)
  const maxPlayTime = useSelector((s: RootState) => s.player.maxPlayTime)
  const statusText = useSelector((s: RootState) => s.player.statusText)
  const dispatch = useDispatch()

  if (!musicInfo) return null

  const openPlayDetail = () => {
    Navigation.showModal({
      stack: {
        children: [{ component: { name: 'PlayDetail' } }],
        options: {
          topBar: { visible: false },
          animations: { showModal: { enabled: false }, dismissModal: { enabled: false } },
        },
      },
    })
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.main} activeOpacity={0.7} onPress={openPlayDetail}>
        {musicInfo.img ? (
          <Image source={{ uri: musicInfo.img }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}><Text style={styles.coverText}>♪</Text></View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{musicInfo.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {statusText || `${musicInfo.singer || '未知歌手'} · ${getSourceName(musicInfo.source)}`}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${maxPlayTime > 0 ? Math.min(100, (nowPlayTime / maxPlayTime) * 100) : 0}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => void togglePlay()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.playIcon}>{isPlay ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d9d9de',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e3e3e8',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 18,
    color: '#8a8a93',
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 12,
    color: '#8a8a93',
    marginTop: 2,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#d9d9de',
    marginTop: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#07c556',
  },
  btn: {
    marginLeft: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 22,
    color: '#1c1c1e',
  },
})

export default PlayBar
