/** 在线歌单广场：平台切换 + 标签分类 + 歌单网格 + 分页 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { getSource } from '../musicSdk'
import { SongListInfo, SongListTag } from '../types'
import { push } from '../navigation'
import { useTheme } from '../theme'

interface Props {
  componentId: string
}

const SUPPORTED = [
  { id: 'kw', name: '酷我' },
  { id: 'kg', name: '酷狗' },
  { id: 'tx', name: 'QQ' },
  { id: 'wy', name: '网易' },
]

const SongList: React.FC<Props> = ({ componentId }) => {
  const t = useTheme()
  const c = t.colors
  const [sourceId, setSourceId] = useState('kw')
  const [groups, setGroups] = useState<Array<{ name: string; list: SongListTag[] }>>([])
  const [hotTags, setHotTags] = useState<SongListTag[]>([])
  const [activeTag, setActiveTag] = useState('')
  const [sortId, setSortId] = useState('hot')
  const [list, setList] = useState<SongListInfo[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const sourceRef = useRef(sourceId)
  const tagRef = useRef(activeTag)
  const sortRef = useRef(sortId)
  sourceRef.current = sourceId
  tagRef.current = activeTag
  sortRef.current = sortId

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    sourceRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.card,
    },
    sourceChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.bg,
      marginRight: 8,
    },
    sourceChipActive: {
      backgroundColor: c.primary,
    },
    sourceChipText: {
      fontSize: 13,
      color: c.subText,
    },
    sourceChipTextActive: {
      color: c.primaryText,
      fontWeight: '600',
    },
    tagRow: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: c.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    tagChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: c.bg,
      marginRight: 8,
      marginBottom: 8,
    },
    tagChipActive: {
      backgroundColor: c.primaryLight,
    },
    tagChipText: {
      fontSize: 12,
      color: c.subText,
    },
    tagChipTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
    groupLabel: {
      fontSize: 11,
      color: c.weakText,
      marginTop: 4,
      marginBottom: 4,
    },
    grid: {
      padding: 12,
    },
    card: {
      width: '48%',
      marginBottom: 14,
    },
    cardRight: {
      marginLeft: '4%',
    },
    cover: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 10,
      backgroundColor: c.card,
    },
    coverPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverPlaceholderText: {
      fontSize: 28,
      color: c.weakText,
    },
    cardName: {
      fontSize: 13,
      color: c.text,
      marginTop: 6,
      lineHeight: 17,
    },
    cardMeta: {
      fontSize: 11,
      color: c.weakText,
      marginTop: 3,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: c.weakText,
    },
    sortRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    sortChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    sortChipActive: {
      backgroundColor: c.primaryLight,
    },
    sortText: {
      fontSize: 12,
      color: c.subText,
    },
    sortTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
  })

  const loadTags = useCallback(async (sid: string) => {
    try {
      const tags = await getSource(sid).getSongListTags?.()
      if (!tags) return
      setGroups(tags.tags ?? [])
      setHotTags(tags.hotTag ?? [])
    } catch {
      setGroups([])
      setHotTags([])
    }
  }, [])

  const loadList = useCallback(async (sid: string, tag: string, sort: string, p: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setError('')
    }
    try {
      const res = await getSource(sid).getSongList?.(sort, tag, p)
      if (!res) throw new Error('该源暂不支持歌单')
      setList(prev => (append ? [...prev, ...res.list] : res.list))
      setPage(p)
      setHasMore(res.list.length > 0 && res.list.length >= (res.limit ?? 36))
    } catch (err: any) {
      if (!append) setError(err?.message ?? '获取失败')
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    setList([])
    setPage(1)
    setHasMore(true)
    setError('')
    setActiveTag('')
    setSortId('hot')
    void loadTags(sourceId)
    void loadList(sourceId, '', 'hot', 1, false)
  }, [sourceId, loadTags, loadList])

  const onPickTag = (tagId: string) => {
    setActiveTag(tagId)
    setList([])
    setPage(1)
    setHasMore(true)
    void loadList(sourceRef.current, tagId, sortRef.current, 1, false)
  }

  const onPickSort = (sort: string) => {
    setSortId(sort)
    setList([])
    setPage(1)
    setHasMore(true)
    void loadList(sourceRef.current, tagRef.current, sort, 1, false)
  }

  const onEndReached = () => {
    if (!hasMore || loading || loadingMore) return
    void loadList(sourceRef.current, tagRef.current, sortRef.current, page + 1, true)
  }

  return (
    <View style={s.container}>
      {/* 平台 */}
      <View style={s.sourceRow}>
        {SUPPORTED.map(si => (
          <TouchableOpacity
            key={si.id}
            style={[s.sourceChip, sourceId === si.id && s.sourceChipActive]}
            onPress={() => setSourceId(si.id)}
          >
            <Text style={[s.sourceChipText, sourceId === si.id && s.sourceChipTextActive]}>{si.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* 标签 */}
      <View style={s.tagRow}>
        <View style={s.sortRow}>
          {['hot', 'new'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[s.sortChip, sortId === sort && s.sortChipActive]}
              onPress={() => onPickSort(sort)}
            >
              <Text style={[s.sortText, sortId === sort && s.sortTextActive]}>{sort === 'hot' ? '最热' : '最新'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollViewHorizontal>
          <TouchableOpacity style={[s.tagChip, activeTag === '' && s.tagChipActive]} onPress={() => onPickTag('')}>
            <Text style={[s.tagChipText, activeTag === '' && s.tagChipTextActive]}>全部</Text>
          </TouchableOpacity>
          {hotTags.map(tag => (
            <TouchableOpacity key={`h_${tag.id}`} style={[s.tagChip, activeTag === tag.id && s.tagChipActive]} onPress={() => onPickTag(tag.id)}>
              <Text style={[s.tagChipText, activeTag === tag.id && s.tagChipTextActive]}>{tag.name}</Text>
            </TouchableOpacity>
          ))}
          {groups.map(g => (
            <View key={g.name}>
              <Text style={s.groupLabel}>{g.name}</Text>
              {g.list.map(tag => (
                <TouchableOpacity key={`${g.name}_${tag.id}`} style={[s.tagChip, activeTag === tag.id && s.tagChipActive]} onPress={() => onPickTag(tag.id)}>
                  <Text style={[s.tagChipText, activeTag === tag.id && s.tagChipTextActive]}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollViewHorizontal>
      </View>

      {/* 歌单网格 */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
      ) : error ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[s.card, index % 2 === 1 && s.cardRight]}
              activeOpacity={0.7}
              onPress={() => push(componentId, 'OnlineSonglistDetail', { listId: item.id, title: item.name, source: item.source })}
            >
              {item.img ? (
                <Image source={{ uri: item.img }} style={s.cover} />
              ) : (
                <View style={[s.cover, s.coverPlaceholder]}>
                  <Text style={s.coverPlaceholderText}>♪</Text>
                </View>
              )}
              <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.cardMeta}>{item.play_count ? `${item.play_count} 播放` : ''}{item.total ? ` · ${item.total}首` : ''}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>暂无歌单</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={c.primary} />
            : hasMore ? <TouchableOpacity style={{ padding: 14, alignItems: 'center' }} onPress={onEndReached}>
                <Text style={{ fontSize: 13, color: c.primary }}>加载更多</Text>
              </TouchableOpacity>
            : <Text style={{ padding: 14, textAlign: 'center', fontSize: 12, color: c.weakText }}>没有更多了</Text>
          }
          contentContainerStyle={s.grid}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  )
}

/** 横向滚动容器（标签区） */
const ScrollViewHorizontal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ScrollView } = require('react-native')
  return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{children}</ScrollView>
}

export default SongList
