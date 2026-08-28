/** 可交互进度条（点击/拖动跳转进度） */
import React, { useRef } from 'react'
import { View, Text, TouchableWithoutFeedback, PanResponder, StyleSheet } from 'react-native'
import { formatInterval } from '../utils/format'

interface Props {
  progress: number // 0-1
  nowTime: number // 秒
  maxTime: number // 秒
  onSeek?: (seconds: number) => void
  height?: number
}

const ProgressBar: React.FC<Props> = ({ progress, nowTime, maxTime, onSeek, height = 4 }) => {
  const containerRef = useRef<View>(null)
  const widthRef = useRef(0)

  const seekFromX = (x: number) => {
    if (!widthRef.current || !onSeek) return
    const ratio = Math.min(1, Math.max(0, x / widthRef.current))
    onSeek(ratio * maxTime)
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => seekFromX(evt.nativeEvent.locationX),
      onPanResponderMove: evt => seekFromX(evt.nativeEvent.locationX),
    }),
  ).current

  return (
    <View style={styles.wrap}>
      <Text style={styles.time}>{formatInterval(nowTime)}</Text>
      <View
        ref={containerRef}
        style={[styles.track, { height }]}
        onLayout={e => {
          widthRef.current = e.nativeEvent.layout.width
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>
      <Text style={styles.time}>{formatInterval(maxTime)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  time: {
    fontSize: 11,
    color: '#8a8a93',
    width: 42,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    backgroundColor: '#d9d9de',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#07c556',
    borderRadius: 2,
  },
})

export default ProgressBar
