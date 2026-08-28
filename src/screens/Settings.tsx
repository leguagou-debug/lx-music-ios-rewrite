/** 设置页：主题 / 播放 / 列表 / 缓存 / 关于 */
import React from 'react'
import { View, Text, ScrollView, Switch, TouchableOpacity, ActionSheetIOS, Alert, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSetting } from '../store/setting'
import { sources, supportQuality } from '../musicSdk'
import { AppSetting, Quality, TogglePlayMethod, playMethodNames } from '../types'
import { setPlayRate } from '../core/player'
import { clearDir, musicCacheDir, lyricCacheDir, picCacheDir } from '../utils/fs'
import { useTheme, THEME_PRESETS } from '../theme'

interface SettingRowProps {
  label: string
  value?: string
  onPress?: () => void
  children?: React.ReactNode
}

const Settings: React.FC<{ componentId: string }> = () => {
  const setting = useSelector((s: RootState) => s.setting)
  const dispatch = useDispatch()
  const t = useTheme()
  const c = t.colors

  const set = (key: keyof AppSetting, value: any) => { dispatch(setSetting({ [key]: value } as any)) }

  const s = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    rowLabel: {
      fontSize: 15,
      color: c.text,
    },
    rowValue: {
      fontSize: 14,
      color: c.weakText,
    },
    section: {
      marginTop: 14,
    },
    sectionTitle: {
      fontSize: 13,
      color: c.weakText,
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    sectionBody: {
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      paddingBottom: 30,
    },
    about: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.card,
    },
    aboutText: {
      fontSize: 12,
      lineHeight: 18,
      color: c.weakText,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    colorDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginRight: 12,
      marginBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorDotActive: {
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    checkMark: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    modeRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    modeChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 15,
      marginRight: 10,
      backgroundColor: c.bg,
    },
    modeChipActive: {
      backgroundColor: c.primary,
    },
    modeChipText: {
      fontSize: 13,
      color: c.subText,
    },
    modeChipTextActive: {
      color: c.primaryText,
      fontWeight: '600',
    },
  })

  const SettingRow: React.FC<SettingRowProps> = ({ label, value, onPress, children }) => (
    <TouchableOpacity style={s.row} activeOpacity={onPress ? 0.6 : 1} onPress={onPress} disabled={!onPress}>
      <Text style={s.rowLabel}>{label}</Text>
      {children ?? (value ? <Text style={s.rowValue}>{value}</Text> : null)}
    </TouchableOpacity>
  )

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  )

  const pickSource = () => {
    const names = sources.map(s => s.name)
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '选择音源', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) set('common.apiSource', sources[index - 1].id)
      },
    )
  }

  const pickQuality = () => {
    const qs: Quality[] = supportQuality[setting['common.apiSource']]?.length
      ? supportQuality[setting['common.apiSource']]
      : ['128k', '320k', 'flac']
    const names = qs.map(q => (q === 'flac' ? '无损 FLAC' : q === 'flac24bit' ? 'Hi-Res' : q))
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '播放音质', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) set('player.playQuality', qs[index - 1])
      },
    )
  }

  const pickMethod = () => {
    const methods = Object.keys(playMethodNames) as TogglePlayMethod[]
    const names = methods.map(m => playMethodNames[m])
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '循环模式', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) set('player.togglePlayMethod', methods[index - 1])
      },
    )
  }

  const pickRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const names = rates.map(r => `${r}x`)
    ActionSheetIOS.showActionSheetWithOptions(
      { title: '播放倍速', options: ['取消', ...names], cancelButtonIndex: 0 },
      index => {
        if (index > 0) {
          set('player.playbackRate', rates[index - 1])
          void setPlayRate(rates[index - 1])
        }
      },
    )
  }

  const pickThemeMode = (mode: 'light' | 'dark' | 'system') => set('theme.mode', mode)

  const clearCache = () => {
    Alert.alert('清空缓存', '将删除已缓存的歌曲、歌词与封面文件，确定？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          void Promise.all([musicCacheDir, lyricCacheDir, picCacheDir].map(clearDir)).then(() => {
            Alert.alert('完成', '缓存已清空')
          })
        },
      },
    ])
  }

  const sourceName = sources.find(s => s.id === setting['common.apiSource'])?.name ?? setting['common.apiSource']
  const modeName = setting['theme.mode'] === 'dark' ? '深色' : setting['theme.mode'] === 'light' ? '浅色' : '跟随系统'

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Section title="主题">
        <View style={s.modeRow}>
          {(['light', 'dark', 'system'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.modeChip, setting['theme.mode'] === m && s.modeChipActive]}
              onPress={() => pickThemeMode(m)}
            >
              <Text style={[s.modeChipText, setting['theme.mode'] === m && s.modeChipTextActive]}>
                {m === 'light' ? '浅色' : m === 'dark' ? '深色' : '跟随系统'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.colorRow}>
          {THEME_PRESETS.map(p => {
            const active = setting['theme.id'] === p.id
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.colorDot, { backgroundColor: p.primary }, active && s.colorDotActive]}
                onPress={() => set('theme.id', p.id)}
              >
                {active && <Text style={s.checkMark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>
      </Section>

      <Section title="播放">
        <SettingRow label="音源" value={sourceName} onPress={pickSource} />
        <SettingRow
          label="音质"
          value={setting['player.playQuality'] === 'flac' ? '无损 FLAC' : setting['player.playQuality']}
          onPress={pickQuality}
        />
        <SettingRow label="循环模式" value={playMethodNames[setting['player.togglePlayMethod']]} onPress={pickMethod} />
        <SettingRow label="播放倍速" value={`${setting['player.playbackRate']}x`} onPress={pickRate} />
        <SettingRow label="启动自动播放">
          <Switch
            value={setting['player.startupAutoPlay']}
            onValueChange={v => set('player.startupAutoPlay', v)}
            trackColor={{ true: c.primary }}
          />
        </SettingRow>
        <SettingRow label="显示歌词翻译">
          <Switch
            value={setting['player.isShowLyricTranslation']}
            onValueChange={v => set('player.isShowLyricTranslation', v)}
            trackColor={{ true: c.primary }}
          />
        </SettingRow>
      </Section>

      <Section title="列表">
        <SettingRow label="显示歌曲来源">
          <Switch value={setting['list.isShowSource']} onValueChange={v => set('list.isShowSource', v)} trackColor={{ true: c.primary }} />
        </SettingRow>
        <SettingRow label="显示专辑名">
          <Switch value={setting['list.isShowAlbumName']} onValueChange={v => set('list.isShowAlbumName', v)} trackColor={{ true: c.primary }} />
        </SettingRow>
        <SettingRow label="显示歌曲时长">
          <Switch value={setting['list.isShowInterval']} onValueChange={v => set('list.isShowInterval', v)} trackColor={{ true: c.primary }} />
        </SettingRow>
      </Section>

      <Section title="存储">
        <SettingRow label="清空缓存" onPress={clearCache} />
      </Section>

      <Section title="关于">
        <SettingRow label="外观模式" value={modeName} />
        <SettingRow label="版本" value="1.8.4 (iOS)" />
        <View style={s.about}>
          <Text style={s.aboutText}>
            本应用为开源音乐播放器（基于 lyswhut/lx-music-mobile 的功能重写），仅供技术学习交流，音乐版权归各平台所有，请支持正版。
          </Text>
        </View>
      </Section>
    </ScrollView>
  )
}

export default Settings
