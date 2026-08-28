/** track-player 后台播放服务（在入口注册，负责后台/锁屏事件处理） */
import TrackPlayer, { Event } from 'react-native-track-player'

module.exports = async function () {
  // 后台播放时无需额外处理，核心逻辑在 core/player 中通过事件驱动
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play()
  })
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause()
  })
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop()
  })
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void TrackPlayer.skipToNext()
  })
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void TrackPlayer.skipToPrevious()
  })
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    void TrackPlayer.seekTo(position)
  })
}
