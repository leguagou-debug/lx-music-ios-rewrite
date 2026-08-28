/** 搜索页：多音源搜索 + 热搜 + 历史 */
import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { sources, getSource } from '../musicSdk'
import { MusicInfo } from '../types'
import { playList } from '../core/player'
import SongItem from '../components/SongItem'
import PlayBar from '../components/PlayBar'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'
import { useTheme } from '../theme'

const Search: React.FC<{ componentId: string }> = ({ componentId }) => {
  const t = useTheme()
  const c = t.colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    searchRow: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    input: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.bg,
      paddingHorizontal: 16,
      fontSize: 14,
      color: c.text,
    },
    searchBtn: {
      marginLeft: 10,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchBtnText: {
      fontSize: 14,
      color: c.card,
      fontWeight: '600',
    },
    sourceRow: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sourceChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
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
      color: c.card,
      fontWeight: '600',
    },
    block: {
      paddingHorizontal: 14,
      paddingTop: 14,
    },
    blockTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      backgroundColor: c.bg,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: 13,
      color: c.subText,
    },
    listContent: {
      paddingBottom: 12,
    },
    loadMore: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    loadMoreText: {
      fontSize: 13,
      color: c.primary,
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

  const [keyword, setKeyword] = useState('')
  const [sourceId, setSourceId] = useState('kw')
  const [result, setResult] = useState<MusicInfo[]>([])
  const [allPage, setAllPage] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [hotWords, setHotWords] = useState<Array<{ word: string }>>([])
  const [history, setHistory] = useState<string[]>([])
  const playingMusic = useSelector((s: RootState) => s.player.musicInfo)

  const loadHistory = useCallback(async () => {
    const h = await getStorage<string[]>(STORAGE_KEYS.searchHistory, [])
    setHistory(h)
  }, [])

  const loadHot = useCallback(async () => {
    try {
      const hot = await getSource('kw').getHotSearch?.()
      if (hot) setHotWords(hot.slice(0, 20))
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    void loadHistory()
    void loadHot()
  }, [loadHistory, loadHot])

  const doSearch = useCallback(async (kw: string, p = 1) => {
    const k = kw.trim()
    if (!k) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await getSource(sourceId).search(k, p, 30)
      setResult(p === 1 ? res.list : prev => [...prev, ...res.list])
      setPage(p)
      setAllPage(res.allPage)
      // 写入历史
      const h = await getStorage<string[]>(STORAGE_KEYS.searchHistory, [])
      const nh = [k, ...h.filter(x => x !== k)].slice(0, 20)
      setHistory(nh)
      await setStorage(STORAGE_KEYS.searchHistory, nh)
    } catch (err: any) {
      if (p === 1) setResult([])
      console.warn('[search]', err?.message ?? err)
    } finally {
      setLoading(false)
    }
  }, [sourceId])

  const onSearch = () => void doSearch(keyword)

  const onPlay = (list: MusicInfo[], index: number) => {
    void playList(list, index, null)
  }

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="搜索歌曲、歌手"
          placeholderTextColor="#8a8a93"
          returnKeyType="search"
          onSubmitEditing={onSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>
      {/* 音源选择 */}
      <View style={styles.sourceRow}>
        {sources.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sourceChip, sourceId === s.id && styles.sourceChipActive]}
            onPress={() => {
              setSourceId(s.id)
              setResult([])
              setSearched(false)
            }}
          >
            <Text style={[styles.sourceChipText, sourceId === s.id && styles.sourceChipTextActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!searched ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View>
              {history.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>搜索历史</Text>
                  <View style={styles.tagWrap}>
                    {history.map(h => (
                      <TouchableOpacity key={h} style={styles.tag} onPress={() => { setKeyword(h); void doSearch(h) }}>
                        <Text style={styles.tagText}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {hotWords.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.blockTitle}>热门搜索</Text>
                  <View style={styles.tagWrap}>
                    {hotWords.map((w, i) => (
                      <TouchableOpacity key={`${w.word}_${i}`} style={styles.tag} onPress={() => { setKeyword(w.word); void doSearch(w.word) }}>
                        <Text style={styles.tagText}>{w.word}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          }
          keyExtractor={(_, i) => `h_${i}`}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={result}
          keyExtractor={(item, i) => `${item.source}_${item.songmid}_${i}`}
          renderItem={({ item, index }) => (
            <SongItem
              musicInfo={item}
              index={index}
              isActive={playingMusic?.songmid === item.songmid && playingMusic?.source === item.source}
              onPress={() => onPlay(result, index)}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>未找到相关歌曲</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? (
              <ActivityIndicator style={{ margin: 16 }} color="#07c556" />
            ) : page < allPage ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => void doSearch(keyword, page + 1)}>
                <Text style={styles.loadMoreText}>加载更多</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      <PlayBar componentId={componentId} />
    </View>
  )
}

export default Search
