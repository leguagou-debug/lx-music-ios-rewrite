/** Redux store 配置 + 持久化 */
import { configureStore } from '@reduxjs/toolkit'
import settingReducer from './setting'
import playerReducer from './player'
import playListReducer from './playList'
import { getStorage, setStorage, STORAGE_KEYS } from '../utils/storage'
import { AppSetting, PlayList, defaultSetting } from '../types'

export const store = configureStore({
  reducer: {
    setting: settingReducer,
    player: playerReducer,
    playList: playListReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

/** 从 AsyncStorage 加载持久化状态并替换（在 App 启动时调用） */
export const loadPersistedState = async (): Promise<void> => {
  const setting = await getStorage<AppSetting>(STORAGE_KEYS.setting, defaultSetting)
  const playListData = await getStorage<PlayList[]>(STORAGE_KEYS.playList, [])
  store.dispatch({ type: 'setting/setSetting', payload: setting })
  store.dispatch({ type: 'playList/setLists', payload: playListData })
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
/** 订阅 store 变化并防抖写盘 */
export const setupPersist = (): void => {
  store.subscribe(() => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const state = store.getState()
      void setStorage(STORAGE_KEYS.setting, state.setting)
      void setStorage(STORAGE_KEYS.playList, state.playList.lists)
    }, 500)
  })
}
