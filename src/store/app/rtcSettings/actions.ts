import { defineActions } from 'direct-vuex'
import { moduleActionContext } from '@/store'
import { rtcSettings } from './index'
import { ActionContext } from 'vuex'
import { S } from './state'

export const rtcSettingsActionContext = (
  context: ActionContext<unknown, unknown>
) => moduleActionContext(context, rtcSettings)

export const actions = defineActions({
  /**
   * 問題ないdeviceIdがセットされていることを確認する
   * セットされていなかったらセットする
   *
   * @returns 問題ないものがセットされているかどうか
   */
  async ensureDeviceIds(context): Promise<boolean> {
    const { state, commit } = rtcSettingsActionContext(context)
    if (!state.isEnabled) return false

    // 許可を求める
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return false
    }

    let devices: MediaDeviceInfo[]
    try {
      devices = await navigator.mediaDevices.enumerateDevices()
    } catch {
      return false
    }
    if (devices.length === 0 || devices[0].label === '') {
      return false
    }

    const audioInputDevices = devices.filter(
      device => device.kind === 'audioinput'
    )

    const isAlreadySet = audioInputDevices.some(
      d => d.deviceId === state.audioInputDeviceId
    )
    if (isAlreadySet) return true

    // デフォルトをセットする
    if (audioInputDevices.length > 0) {
      commit.set(['audioInputDeviceId', audioInputDevices[0].deviceId])
      return true
    }
    return false
  },
  /**
   * keyに一致しないvalueを入れることができるので注意
   */
  set<K extends keyof S>(
    context: ActionContext<unknown, unknown>,
    [key, val]: [K, S[K]]
  ) {
    const { commit, rootCommit } = rtcSettingsActionContext(context)
    commit.set([key, val])

    if (key === 'masterVolume') {
      rootCommit.app.rtc.setMasterVolume(val as S['masterVolume'])
    }
  }
})
