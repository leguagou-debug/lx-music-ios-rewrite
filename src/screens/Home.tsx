/** 首页：搜索入口 + 排行榜入口 + 我的歌单 */
import React, { useLayoutEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { createList } from '../store/playList'
import { push } from '../navigation'
import PlayBar from '../components/PlayBar'

const Home: React.FC<{ componentId: string }> = ({ componentId }) => {
  const lists = useSelector((s: RootState) => s.playList.lists)
  const dispatch = useDispatch()

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
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View>
            {/* 搜索入口 */}
            <TouchableOpacity style={styles.searchBar} activeOpacity={0.7} onPress={gotoSearch}>
              <Text style={styles.searchText}>🔍  搜索歌曲、歌手</Text>
            </TouchableOpacity>
            {/* 排行榜入口 */}
            <TouchableOpacity style={styles.boardCard} activeOpacity={0.8} onPress={gotoLeaderboard}>
              <Text style={styles.boardTitle}>🏆 排行榜</Text>
              <Text style={styles.boardSub}>酷我 · 酷狗 · QQ 热歌榜单</Text>
            </TouchableOpacity>
            {/* 我的歌单标题 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>我的歌单</Text>
              <TouchableOpacity onPress={onCreateList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.sectionAction}>＋ 新建</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} activeOpacity={0.7} onPress={() => gotoList(item)}>
            <View style={styles.listCover}>
              <Text style={styles.listCoverIcon}>♪</Text>
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.listCount}>{item.musicList?.length ?? 0} 首</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>还没有歌单，点右上角「＋ 新建」创建一个</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      <PlayBar componentId={componentId} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingBottom: 12,
  },
  searchBar: {
    margin: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f4',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  searchText: {
    fontSize: 14,
    color: '#8a8a93',
  },
  boardCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#0a6b2f',
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  boardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
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
    color: '#1c1c1e',
  },
  sectionAction: {
    fontSize: 14,
    color: '#07c556',
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
    backgroundColor: '#e8f6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCoverIcon: {
    fontSize: 20,
    color: '#07c556',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 15,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  listCount: {
    fontSize: 12,
    color: '#8a8a93',
    marginTop: 3,
  },
  arrow: {
    fontSize: 20,
    color: '#c7c7cc',
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#b0b0b8',
  },
})

export default Home
