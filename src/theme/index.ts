/** 主题系统：浅色/深色/跟随系统 + 主题色
 * 用法：const t = useTheme() 得到当前主题色板；t.colors 为具体颜色
 */
import { useColorScheme } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

/** 主题色预设 */
export interface ThemePreset {
  id: string
  name: string
  /** 主色（按钮/高亮） */
  primary: string
  /** 主色浅底 */
  primaryLight: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'green', name: '翠绿', primary: '#07c556', primaryLight: '#e8f6ee' },
  { id: 'red', name: '中国红', primary: '#e64340', primaryLight: '#fdecec' },
  { id: 'blue', name: '海洋蓝', primary: '#2d8cf0', primaryLight: '#e8f1fd' },
  { id: 'purple', name: '葡萄紫', primary: '#8a4ff3', primaryLight: '#f0e9fd' },
  { id: 'orange', name: '活力橙', primary: '#ff7d00', primaryLight: '#fff1e0' },
  { id: 'pink', name: '樱花粉', primary: '#f56ca2', primaryLight: '#fdeef5' },
  { id: 'cyan', name: '青瓷', primary: '#00b8a9', primaryLight: '#e4f7f5' },
  { id: 'gold', name: '鎏金', primary: '#c9a227', primaryLight: '#f8f1dc' },
]

export const getPreset = (id: string): ThemePreset =>
  THEME_PRESETS.find(p => p.id === id) ?? THEME_PRESETS[0]

/** 单页色板 */
export interface ThemeColors {
  /** 页面背景 */
  bg: string
  /** 卡片/输入框背景 */
  card: string
  /** 主文本 */
  text: string
  /** 次级文本 */
  subText: string
  /** 占位/弱文本 */
  weakText: string
  /** 分割线 */
  divider: string
  primary: string
  primaryLight: string
  /** 主文本反色（主色按钮上的字） */
  primaryText: string
}

export interface Theme {
  mode: 'light' | 'dark'
  colors: ThemeColors
  preset: ThemePreset
}

const lightColors = (preset: ThemePreset): ThemeColors => ({
  bg: '#f5f5f7',
  card: '#ffffff',
  text: '#1c1c1e',
  subText: '#55555c',
  weakText: '#8a8a93',
  divider: '#e5e5ea',
  primary: preset.primary,
  primaryLight: preset.primaryLight,
  primaryText: '#ffffff',
})

const darkColors = (preset: ThemePreset): ThemeColors => ({
  bg: '#000000',
  card: '#1c1c1e',
  text: '#f2f2f7',
  subText: '#aeaeb2',
  weakText: '#636366',
  divider: '#2c2c2e',
  primary: preset.primary,
  primaryLight: 'rgba(255,255,255,0.08)',
  primaryText: '#000000',
})

/** 根据设置 + 系统颜色方案计算当前主题 */
export const buildTheme = (mode: 'light' | 'dark' | 'system', systemMode: 'light' | 'dark', preset: ThemePreset): Theme => {
  const actual: 'light' | 'dark' = mode === 'system' ? systemMode : mode
  return {
    mode: actual,
    preset,
    colors: actual === 'dark' ? darkColors(preset) : lightColors(preset),
  }
}

/** 在组件内获取当前主题 */
export const useTheme = (): Theme => {
  const systemMode = useColorScheme() ?? 'light'
  const mode = useSelector((s: RootState) => s.setting['theme.mode'])
  const presetId = useSelector((s: RootState) => s.setting['theme.id'])
  return buildTheme(mode, systemMode, getPreset(presetId))
}
