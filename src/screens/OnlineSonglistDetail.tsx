/** 在线歌单详情：封面信息 + 歌曲列表 + 播放全部/单曲 */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { getSource } from '../musicSdk'
import { MusicInfo, SongListDetail } from '../types'
import { playList } from '../core/player'
import SongItem from '../components/SongItem'
import { useTheme } from '../theme'

interface Props {
  componentId: string
  listId: string
  title: string
  source: string
}

const OnlineSonglistDetail: React.FC<Props> = ({ componentId, listId, title, source }) => {
  const t = useTheme()
  const c = t.colors
  const [detail, setDetail] = useState<SongListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const playingMusic = useSelector((s: RootState) => s.player.musicInfo)

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      padding: 14,
      flexDirection: 'row',
      backgroundColor: c.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    cover: {
      width: 96,
      height: 96,
      borderRadius: 10,
      backgroundColor: c.bg,
    },
    coverPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverPlaceholderText: {
      fontSize: 30,
      color: c.weakText,
    },
    info: {
      flex: 1,
      marginLeft: 14,
      justifyContent: 'center',
    },
    name: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    meta: {
      fontSize: 12,
      color: c.weakText,
      marginTop: 6,
    },
    desc: {
      fontSize: 12,
      color: c.weakText,
      marginTop: 6,
      lineHeight: 16,
    },
    playAll: {
      marginTop: 10,
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: c.primary,
    },
    playAllText: {
      fontSize: 13,
      color: c.primaryText,
      fontWeight: '600',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: c.weakText,
    },
  })

  useLayoutEffect(() => {
    Navigation.mergeOptions(componentId, { topBar: { title: { text: title || '歌单' } } })
  }, [componentId, title])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getSource(source).getSongListDetail?.(listId, 1)
      if (!res) throw new Error('该源暂不支持歌单详情')
      setDetail(res)
    } catch (err: any) {
      setError(err?.message ?? '获取歌单详情失败')
    } finally {
      setLoading(false)
    }
  }, [source, listId])

  useEffect(() => {
    void load()
  }, [load])

  const onPlayAll = () => {
    if (detail?.list.length) void playList(detail.list, 0, null)
  }

  const onPlayIndex = (index: number) => {
    if (detail) void playList(detail.list, index, null)
  }

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  if (error || !detail) {
    return (
      <View style={[s.container, s.empty]}>
        <Text style={s.emptyText}>{error || '获取失败'}</Text>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        {detail.info?.img ? (
          <Image source={{ uri: detail.info.img }} style={s.cover} />
        ) : (
          <View style={[s.cover, s.coverPlaceholder]}>
            <Text style={s.coverPlaceholderText}>♪</Text>
          </View>
        )}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{detail.info?.name || title}</Text>
          {detail.info?.author ? <Text style={s.meta}>@{detail.info.author}</Text> : null}
          {detail.info?.play_count ? <Text style={s.meta}>{detail.info.play_count} 次播放 · {detail.list.length} 首</Text> : <Text style={s.meta}>{detail.list.length} 首</Text>}
          {detail.info?.desc ? <Text style={s.desc} numberOfLines={2}>{detail.info.desc}</Text> : null}
          <TouchableOpacity style={s.playAll} onPress={onPlayAll}>
            <Text style={s.playAllText}>▶ 播放全部</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={detail.list}
        keyExtractor={(item, i) => `${item.source}_${item.songmid}_${i}`}
        renderItem={({ item, index }) => (
          <SongItem
            musicInfo={item}
            index={index}
            isActive={playingMusic?.songmid === item.songmid && playingMusic?.source === item.source}
            onPress={() => onPlayIndex(index)}
          />
        )}
      />
    </View>
  )
}

export default OnlineSonglistDetail
