/** 设置 slice */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppSetting, defaultSetting } from '../types'

const settingSlice = createSlice({
  name: 'setting',
  initialState: { ...defaultSetting } as AppSetting,
  reducers: {
    setSetting(state, action: PayloadAction<Partial<AppSetting>>) {
      return { ...state, ...action.payload }
    },
    resetSetting() {
      return { ...defaultSetting }
    },
  },
})

export const { setSetting, resetSetting } = settingSlice.actions
export default settingSlice.reducer
