/** 排行榜页：榜单列表 → 榜单歌曲列表 */
import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { getSource } from '../musicSdk'
import { MusicInfo } from '../types'
import { playList } from '../core/player'
import SongItem from '../components/SongItem'
import { useTheme } from '../theme'

interface BoardInfo {
  id: string
  name: string
  img: string
}

const Leaderboard: React.FC<{ componentId: string }> = ({ componentId }) => {
  const t = useTheme()
  const c = t.colors
  const sourceId = useSelector((s: RootState) => s.setting['common.apiSource'])
  const playingMusic = useSelector((s: RootState) => s.player.musicInfo)

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    boardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    boardCover: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    boardCoverText: {
      fontSize: 18,
      color: c.weakText,
    },
    boardName: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      color: c.text,
    },
    arrow: {
      fontSize: 20,
      color: c.divider,
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    playAllBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.primary,
    },
    playAllText: {
      fontSize: 13,
      color: c.primaryText,
      fontWeight: '600',
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

  const [boards, setBoards] = useState<BoardInfo[]>([])
  const [currentBoard, setCurrentBoard] = useState<BoardInfo | null>(null)
  const [list, setList] = useState<MusicInfo[]>([])
  const [page, setPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const source = getSource(sourceId)
    if (!source.getLeaderboard) {
      setError('当前音源暂不支持排行榜')
      setBoards([])
      return
    }
    setError('')
    setLoading(true)
    source
      .getLeaderboard()
      .then(b => {
        setBoards(b)
        if (b.length) openBoard(b[0])
      })
      .catch(() => setError('排行榜加载失败，请重试'))
      .finally(() => setLoading(false))
  }, [sourceId])

  const openBoard = async (board: BoardInfo) => {
    setCurrentBoard(board)
    setList([])
    setPage(1)
    const source = getSource(sourceId)
    if (!source.getLeaderboardList) return
    setLoading(true)
    try {
      const res = await source.getLeaderboardList(board.id, 1, 30)
      setList(res.list)
      setPage(1)
      setAllPage(res.allPage)
    } catch {
      setError('榜单歌曲加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!currentBoard || page >= allPage || loading) return
    const source = getSource(sourceId)
    if (!source.getLeaderboardList) return
    setLoading(true)
    try {
      const res = await source.getLeaderboardList(currentBoard.id, page + 1, 30)
      setList(prev => [...prev, ...res.list])
      setPage(page + 1)
      setAllPage(res.allPage)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const onPlay = (l: MusicInfo[], i: number) => {
    void playList(l, i, `leaderboard_${currentBoard?.id}`)
  }

  if (!currentBoard) {
    return (
      <View style={s.container}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#07c556" />
        ) : (
          <FlatList
            data={boards}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.boardItem} onPress={() => openBoard(item)}>
                <View style={s.boardCover}>
                  <Text style={s.boardCoverText}>♪</Text>
                </View>
                <Text style={s.boardName}>{item.name}</Text>
                <Text style={s.arrow}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>{error || '暂无榜单'}</Text>
              </View>
            }
          />
        )}
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.listHeader}>
        <Text style={s.listTitle}>{currentBoard.name}</Text>
        <TouchableOpacity style={s.playAllBtn} onPress={() => list.length && onPlay(list, 0)}>
          <Text style={s.playAllText}>▶ 播放全部</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item, i) => `${item.source}_${item.songmid}_${i}`}
        renderItem={({ item, index }) => (
          <SongItem
            musicInfo={item}
            index={index}
            isActive={playingMusic?.songmid === item.songmid && playingMusic?.source === item.source}
            onPress={() => onPlay(list, index)}
          />
        )}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator style={{ margin: 16 }} color="#07c556" />
          ) : page < allPage ? (
            <TouchableOpacity style={s.loadMore} onPress={() => void loadMore()}>
              <Text style={s.loadMoreText}>加载更多</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  )
}


export default Leaderboard
