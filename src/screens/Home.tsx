/** 首页：搜索入口 + 排行榜入口 + 在线歌单 + 我的歌单 */
import React, { useLayoutEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { createList } from '../store/playList'
import { push } from '../navigation'
import PlayBar from '../components/PlayBar'
import { useTheme } from '../theme'

const Home: React.FC<{ componentId: string }> = ({ componentId }) => {
  const lists = useSelector((s: RootState) => s.playList.lists)
  const dispatch = useDispatch()
  const t = useTheme()
  const c = t.colors

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    listContent: {
      paddingBottom: 12,
    },
    searchBar: {
      margin: 14,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.card,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    searchText: {
      fontSize: 14,
      color: c.weakText,
    },
    boardRow: {
      flexDirection: 'row',
      marginHorizontal: 14,
      marginBottom: 8,
    },
    boardCard: {
      flex: 1,
      padding: 16,
      borderRadius: 14,
      backgroundColor: c.primary,
      marginRight: 8,
    },
    boardCardLast: {
      marginRight: 0,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    boardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.primaryText,
    },
    boardTitleDark: {
      color: c.text,
    },
    boardSub: {
      fontSize: 11,
      color: c.primaryText,
      opacity: 0.75,
      marginTop: 4,
    },
    boardSubDark: {
      color: c.weakText,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 6,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    sectionAction: {
      fontSize: 14,
      color: c.primary,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    listCover: {
      width: 46,
      height: 46,
      borderRadius: 8,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listCoverIcon: {
      fontSize: 20,
      color: c.primary,
    },
    listInfo: {
      flex: 1,
      marginLeft: 12,
    },
    listName: {
      fontSize: 15,
      color: c.text,
      fontWeight: '500',
    },
    listCount: {
      fontSize: 12,
      color: c.weakText,
      marginTop: 3,
    },
    arrow: {
      fontSize: 20,
      color: c.divider,
    },
    empty: {
      padding: 30,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: c.weakText,
    },
  })

  useLayoutEffect(() => {
    const unsub = Navigation.events().registerBottomTabSelectedListener(({ selectedTabIndex }) => {
      if (selectedTabIndex === 0) {
        // 切回首页刷新（无特殊处理）
      }
    })
    return () => unsub.remove()
  }, [])

  const gotoSearch = () => {
    Navigation.mergeOptions(componentId, { bottomTabs: { currentTabIndex: 1 } })
  }

  const gotoLeaderboard = () => {
    push(componentId, 'Leaderboard', { title: '排行榜' })
  }

  const gotoSongList = () => {
    push(componentId, 'SongList', { title: '在线歌单' })
  }

  const gotoList = (list: any) => {
    push(componentId, 'SonglistDetail', { listId: list.id, title: list.name })
  }

  const onCreateList = () => {
    if (Alert.prompt) {
      Alert.prompt('新建歌单', '请输入歌单名称', [
        { text: '取消', style: 'cancel' },
        {
          text: '创建',
          onPress: name => {
            const n = (name ?? '').trim()
            if (n) dispatch(createList({ name: n }))
          },
        },
      ])
    }
  }

  return (
    <View style={s.container}>
      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View>
            {/* 搜索入口 */}
            <TouchableOpacity style={s.searchBar} activeOpacity={0.7} onPress={gotoSearch}>
              <Text style={s.searchText}>🔍  搜索歌曲、歌手</Text>
            </TouchableOpacity>
            {/* 在线歌单 + 排行榜入口 */}
            <View style={s.boardRow}>
              <TouchableOpacity style={s.boardCard} activeOpacity={0.8} onPress={gotoSongList}>
                <Text style={s.boardTitle}>📚 在线歌单</Text>
                <Text style={s.boardSub}>海量歌单 · 全平台</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.boardCard, s.boardCardLast]} activeOpacity={0.8} onPress={gotoLeaderboard}>
                <Text style={[s.boardTitle, s.boardTitleDark]}>🏆 排行榜</Text>
                <Text style={[s.boardSub, s.boardSubDark]}>酷我 · 酷狗 · QQ 热歌榜单</Text>
              </TouchableOpacity>
            </View>
            {/* 我的歌单标题 */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>我的歌单</Text>
              <TouchableOpacity onPress={onCreateList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.sectionAction}>＋ 新建</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.listItem} activeOpacity={0.7} onPress={() => gotoList(item)}>
            <View style={s.listCover}>
              <Text style={s.listCoverIcon}>♪</Text>
            </View>
            <View style={s.listInfo}>
              <Text style={s.listName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.listCount}>{item.musicList?.length ?? 0} 首</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>还没有歌单，点右上角「＋ 新建」创建一个</Text>
          </View>
        }
        contentContainerStyle={s.listContent}
      />
      <PlayBar componentId={componentId} />
    </View>
  )
}

export default Home
