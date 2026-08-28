/** App 入口（RNN 启动） */
import { Navigation } from 'react-native-navigation'
import TrackPlayer from 'react-native-track-player'
import { registerScreens, setRoot } from './src/navigation'
import { loadPersistedState, setupPersist } from './src/store'
import { setupPlayer, registerPlayerEvents } from './src/core/player'
import { initDirs } from './src/utils/fs'

registerScreens()

Navigation.events().registerAppLaunchedListener(async () => {
  await initDirs()
  await loadPersistedState()
  setupPersist()
  await setupPlayer()
  registerPlayerEvents()
  setRoot()
})

TrackPlayer.registerPlaybackService(() => require('./src/core/playbackService'))
