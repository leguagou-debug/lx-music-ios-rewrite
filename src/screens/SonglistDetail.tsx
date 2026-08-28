/** 歌单详情页：查看/播放/管理本地歌单 */
import React, { useCallback, useLayoutEffect } from 'react'
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { removeMusicFromList, clearList, renameList, removeList } from '../store/playList'
import { playList } from '../core/player'
import SongItem from '../components/SongItem'
import { useTheme } from '../theme'

interface Props {
  componentId: string
  listId: string
  title: string
}

const SonglistDetail: React.FC<Props> = ({ componentId, listId, title }) => {
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
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    count: {
      fontSize: 14,
      color: c.weakText,
    },
    headerBtns: {
      flexDirection: 'row',
    },
    btn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.primary,
      marginLeft: 10,
    },
    btnGhost: {
      backgroundColor: c.bg,
    },
    btnText: {
      fontSize: 13,
      color: c.card,
      fontWeight: '600',
    },
    btnGhostText: {
      fontSize: 13,
      color: c.subText,
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

  const list = useSelector((s: RootState) => s.playList.lists.find(l => l.id === listId))
  const playingMusic = useSelector((s: RootState) => s.player.musicInfo)
  const playingListId = useSelector((s: RootState) => s.player.listId)
  const dispatch = useDispatch()

  useLayoutEffect(() => {
    Navigation.mergeOptions(componentId, {
      topBar: {
        title: { text: title || '歌单' },
        rightButtons: [
          {
            id: 'manage',
            text: '管理',
            // 菜单在下方用 Alert 实现
          },
        ],
      },
    })
  }, [componentId, title])

  const musicList = list?.musicList ?? []

  const onManage = () => {
    Alert.alert('歌单管理', title, [
      { text: '取消', style: 'cancel' },
      { text: '重命名', onPress: () => rename() },
      { text: '清空', style: 'destructive', onPress: () => clear() },
      { text: '删除歌单', style: 'destructive', onPress: () => remove() },
    ])
  }

  const rename = () => {
    if (!Alert.prompt) return
    Alert.prompt('重命名歌单', '输入新名称', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: name => { const n = (name ?? '').trim(); if (n) dispatch(renameList({ id: listId, name: n })) } },
    ])
  }

  const clear = () => {
    Alert.alert('清空歌单', `确定清空「${title}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: () => dispatch(clearList({ id: listId })) },
    ])
  }

  const remove = () => {
    Alert.alert('删除歌单', `确定删除「${title}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => { dispatch(removeList({ id: listId })); Navigation.pop(componentId) } },
    ])
  }

  const onPlayAll = () => {
    if (musicList.length) void playList(musicList, 0, listId)
  }

  const onPlayIndex = (index: number) => {
    void playList(musicList, index, listId)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{musicList.length} 首</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.btn} onPress={onPlayAll}>
            <Text style={styles.btnText}>▶ 播放全部</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onManage}>
            <Text style={styles.btnGhostText}>管理</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={musicList}
        keyExtractor={(item, i) => `${item.source}_${item.songmid}_${i}`}
        renderItem={({ item, index }) => (
          <SongItem
            musicInfo={item}
            index={index}
            isActive={playingMusic?.songmid === item.songmid && playingListId === listId}
            onPress={() => onPlayIndex(index)}
            onLongPress={() => {
              Alert.alert('移除歌曲', `${item.name} - ${item.singer}`, [
                { text: '取消', style: 'cancel' },
                { text: '移除', style: 'destructive', onPress: () => dispatch(removeMusicFromList({ id: listId, index })) },
              ])
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>歌单是空的，去搜索页添加歌曲吧</Text>
          </View>
        }
      />
    </View>
  )
}

export default SonglistDetail
