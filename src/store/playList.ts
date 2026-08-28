/** 本地歌单 slice */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MusicInfo, PlayList } from '../types'
import { genId } from '../utils/format'

export interface PlayListState {
  /** 所有本地歌单 */
  lists: PlayList[]
}

const initialState: PlayListState = {
  lists: [],
}

const playListSlice = createSlice({
  name: 'playList',
  initialState,
  reducers: {
    setLists(state, action: PayloadAction<PlayList[]>) {
      state.lists = action.payload
    },
    createList(state, action: PayloadAction<{ name: string }>) {
      const id = genId()
      state.lists.unshift({ id, name: action.payload.name, musicList: [], source: 'local' })
    },
    removeList(state, action: PayloadAction<{ id: string }>) {
      state.lists = state.lists.filter(l => l.id !== action.payload.id)
    },
    renameList(state, action: PayloadAction<{ id: string; name: string }>) {
      const list = state.lists.find(l => l.id === action.payload.id)
      if (list) list.name = action.payload.name
    },
    addMusicToList(state, action: PayloadAction<{ id: string; musicInfo: MusicInfo }>) {
      const list = state.lists.find(l => l.id === action.payload.id)
      if (!list) return
      const dup = list.musicList.find(
        m => m.source === action.payload.musicInfo.source && m.songmid === action.payload.musicInfo.songmid,
      )
      if (!dup) list.musicList.push(action.payload.musicInfo)
    },
    addMusicsToList(state, action: PayloadAction<{ id: string; musicList: MusicInfo[] }>) {
      const list = state.lists.find(l => l.id === action.payload.id)
      if (!list) return
      for (const music of action.payload.musicList) {
        const dup = list.musicList.find(m => m.source === music.source && m.songmid === music.songmid)
        if (!dup) list.musicList.push(music)
      }
    },
    removeMusicFromList(state, action: PayloadAction<{ id: string; index: number }>) {
      const list = state.lists.find(l => l.id === action.payload.id)
      if (list) list.musicList.splice(action.payload.index, 1)
    },
    clearList(state, action: PayloadAction<{ id: string }>) {
      const list = state.lists.find(l => l.id === action.payload.id)
      if (list) list.musicList = []
    },
  },
})

export const {
  setLists,
  createList,
  removeList,
  renameList,
  addMusicToList,
  addMusicsToList,
  removeMusicFromList,
  clearList,
} = playListSlice.actions
export default playListSlice.reducer
