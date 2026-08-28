/** 歌词滚动视图（当前行高亮并自动居中） */
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { LrcLine, findCurrentLine } from '../utils/lrc'

interface Props {
  lines: LrcLine[]
  currentTimeMs: number
  activeColor?: string
  inactiveColor?: string
  fontSize?: number
  lineHeight?: number
}

const LrcView: React.FC<Props> = ({
  lines,
  currentTimeMs,
  activeColor = '#07c556',
  inactiveColor = '#8a8a93',
  fontSize = 17,
  lineHeight = 36,
}) => {
  const scrollRef = useRef<ScrollView>(null)
  const [layoutHeight, setLayoutHeight] = useState(0)
  const currentIdx = findCurrentLine(lines, currentTimeMs)

  useEffect(() => {
    if (currentIdx < 0 || layoutHeight <= 0) return
    const offset = Math.max(0, currentIdx * lineHeight - layoutHeight / 2 + lineHeight / 2)
    scrollRef.current?.scrollTo({ y: offset, animated: true })
  }, [currentIdx, layoutHeight, lineHeight])

  if (!lines.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.line, { color: inactiveColor, fontSize }]}>纯音乐，请欣赏</Text>
      </View>
    )
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      onLayout={e => setLayoutHeight(e.nativeEvent.layout.height)}
      scrollEventThrottle={100}
    >
      <View style={{ paddingVertical: layoutHeight / 2 }}>
        {lines.map((line, idx) => (
          <Text
            key={`${idx}_${line.time}`}
            style={[
              styles.line,
              {
                color: idx === currentIdx ? activeColor : inactiveColor,
                fontSize,
                lineHeight,
                fontWeight: idx === currentIdx ? '600' : '400',
              },
            ]}
            numberOfLines={2}
          >
            {line.text || ' '}
          </Text>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  line: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default LrcView
