/** 歌曲列表项（通用：搜索/歌单/榜单复用） */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MusicInfo } from '../types'
import { getSourceName } from '../musicSdk'
import { formatInterval } from '../utils/format'
import { useTheme } from '../theme'

interface Props {
  musicInfo: MusicInfo
  index?: number
  isActive?: boolean
  showSource?: boolean
  showInterval?: boolean
  showAlbum?: boolean
  onPress?: () => void
  onLongPress?: () => void
  extra?: React.ReactNode
}

const SongItem: React.FC<Props> = ({
  musicInfo,
  index,
  isActive,
  showSource = true,
  showInterval = true,
  showAlbum = false,
  onPress,
  onLongPress,
  extra,
}) => {
  const t = useTheme()
  const c = t.colors
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: 'transparent',
    },
    rowActive: {
      backgroundColor: c.primaryLight,
    },
    index: {
      width: 34,
      fontSize: 14,
      color: c.weakText,
      textAlign: 'center',
    },
    activeText: {
      color: c.primary,
      fontWeight: '600',
    },
    main: {
      flex: 1,
      marginHorizontal: 6,
    },
    name: {
      fontSize: 15,
      color: c.text,
    },
    sub: {
      fontSize: 12,
      color: c.weakText,
      marginTop: 2,
    },
    duration: {
      fontSize: 12,
      color: c.weakText,
      marginLeft: 8,
    },
  })
  const renderContent = () => (
    <View style={[styles.row, isActive && styles.rowActive]}>
      {index != null && (
        <Text style={[styles.index, isActive && styles.activeText]}>{index + 1}</Text>
      )}
      <View style={styles.main}>
        <Text style={[styles.name, isActive && styles.activeText]} numberOfLines={1}>
          {musicInfo.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {musicInfo.singer || '未知歌手'}
          {showSource ? ` · ${getSourceName(musicInfo.source)}` : ''}
          {showAlbum && musicInfo.albumName ? ` · ${musicInfo.albumName}` : ''}
        </Text>
      </View>
      {extra}
      {showInterval && musicInfo.interval > 0 && (
        <Text style={styles.duration}>{formatInterval(musicInfo.interval)}</Text>
      )}
    </View>
  )

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={onPress} onLongPress={onLongPress}>
        {renderContent()}
      </TouchableOpacity>
    )
  }
  return renderContent()
}

export default SongItem
