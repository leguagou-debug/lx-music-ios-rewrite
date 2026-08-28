/** RNN 导航注册与根布局 */
import { Navigation } from 'react-native-navigation'
import { Provider } from 'react-redux'
import React from 'react'
import { store } from './store'
import Home from './screens/Home'
import Search from './screens/Search'
import Settings from './screens/Settings'
import PlayDetail from './screens/PlayDetail'
import Leaderboard from './screens/Leaderboard'
import SonglistDetail from './screens/SonglistDetail'

/** 屏幕注册表 */
export const SCREENS = {
  Home,
  Search,
  Settings,
  PlayDetail,
  Leaderboard,
  SonglistDetail,
} as const

export type ScreenName = keyof typeof SCREENS

const withProvider = (Comp: React.ComponentType<any>) => {
  return (props: any) => (
    <Provider store={store}>
      <Comp {...props} />
    </Provider>
  )
}

export const registerScreens = (): void => {
  for (const name of Object.keys(SCREENS) as ScreenName[]) {
    Navigation.registerComponent(name, () => withProvider(SCREENS[name]))
  }
}

/** 设置根布局（底部 Tab：首页 / 搜索 / 设置） */
export const setRoot = (): void => {
  Navigation.setRoot({
    root: {
      bottomTabs: {
        children: [
          {
            stack: {
              children: [{ component: { name: 'Home' } }],
              options: {
                topBar: { title: { text: '洛雪音乐助手' }, visible: false },
                bottomTab: { text: '首页', icon: undefined },
              },
            },
          },
          {
            stack: {
              children: [{ component: { name: 'Search' } }],
              options: {
                topBar: { title: { text: '搜索' }, visible: false },
                bottomTab: { text: '搜索', icon: undefined },
              },
            },
          },
          {
            stack: {
              children: [{ component: { name: 'Settings' } }],
              options: {
                topBar: { title: { text: '设置' }, visible: false },
                bottomTab: { text: '设置', icon: undefined },
              },
            },
          },
        ],
      },
    },
  })
}

/** 通用 push 辅助 */
export const push = (componentId: string, name: ScreenName, passProps: any = {}): void => {
  Navigation.push(componentId, {
    component: {
      name,
      passProps,
      options: {
        topBar: {
          title: { text: passProps.title ?? '' },
        },
      },
    },
  })
}
