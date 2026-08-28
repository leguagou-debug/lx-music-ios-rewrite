/** App 入口（RNN 启动） */
import { Navigation } from 'react-native-navigation'
import TrackPlayer from 'react-native-track-player'
import { registerScreens, setRoot } from './navigation'
import { loadPersistedState, setupPersist } from './store'
import { setupPlayer, registerPlayerEvents } from './core/player'
import { initDirs } from './utils/fs'

registerScreens()

Navigation.events().registerAppLaunchedListener(async () => {
  await initDirs()
  await loadPersistedState()
  setupPersist()
  await setupPlayer()
  registerPlayerEvents()
  setRoot()
})

TrackPlayer.registerPlaybackService(() => require('./core/playbackService'))
