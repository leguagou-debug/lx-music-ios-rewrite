/** AsyncStorage 持久化封装（JSON 存取） */
import AsyncStorage from '@react-native-async-storage/async-storage'

export const getStorage = async <T = any>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const setStorage = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const removeStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/** 存储 key 常量 */
export const STORAGE_KEYS = {
  setting: 'lx_setting',
  playList: 'lx_play_list',
  playDetail: 'lx_play_detail',
  searchHistory: 'lx_search_history',
  downloadList: 'lx_download_list',
  playTime: 'lx_play_time',
} as const
