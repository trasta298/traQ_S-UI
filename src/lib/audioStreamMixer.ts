const fileSourcePrefix = '__file-'

export const maxGain = 5
export const maxMasterGain = 3
export const talkingThreshoulds = [300, 1000, 3000, 5000]

export const getTalkingLoundnessLevel = (level = 0) => {
  let ll = 0
  for (const t of talkingThreshoulds) {
    if (level < t) return ll
    ll++
  }
  return ll
}

type WebkitWindow = Window &
  typeof globalThis & {
    webkitAudioContext: AudioContext
  }

export default class AudioStreamMixer {
  private streamSourceNodeMap: Record<string, MediaStreamAudioSourceNode> = {}
  private audioBufferMap: Record<string, AudioBuffer> = {}
  private analyserNodeMap: Record<string, AnalyserNode> = {}
  private gainNodeMap: Record<string, GainNode> = {}
  private context: AudioContext
  private masterVolume = 1
  private fileVolume = 0.25
  /**
   * それぞれのstreamのボリューム
   * ミュート時はミュートされる前の値を保持
   */
  private volumeMap: Record<string, number> = {}
  readonly analyserFftSize = 128
  private readonly frequencyUint8Array = new Uint8Array(
    this.analyserFftSize / 2
  )

  constructor(volume: number) {
    this.context = new (window.AudioContext ||
      (window as WebkitWindow).webkitAudioContext)()
    this.volume = volume
  }

  private calcVolumeValue(gainNode: GainNode, userVolume: number): number {
    const { defaultValue } = gainNode.gain
    const userVolumeSquare = userVolume ** 2 * maxGain
    const masterVolumeSquare = this.masterVolume ** 2 * maxMasterGain
    return defaultValue * userVolumeSquare * masterVolumeSquare
  }

  private async createAudioSourceNodeGraph(buffer: AudioBuffer) {
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    source.buffer = buffer
    gain.gain.value = this.fileVolume
    gain.connect(this.context.destination)
    source.connect(gain)
    return source
  }

  private createStreamNodeGraph(mediaStream: MediaStream) {
    const source = this.context.createMediaStreamSource(mediaStream)
    const analyser = this.context.createAnalyser()
    const gain = this.context.createGain()
    gain.gain.value = this.calcVolumeValue(gain, 1)
    analyser.fftSize = this.analyserFftSize

    gain.connect(this.context.destination)
    analyser.connect(gain)
    source.connect(analyser)
    return { source, gain, analyser }
  }

  createAnalyzer(mediaStream: MediaStream) {
    const source = this.context.createMediaStreamSource(mediaStream)
    const analyser = this.context.createAnalyser()
    analyser.fftSize = this.analyserFftSize

    source.connect(analyser)
    return analyser
  }

  private disconnectNodeGraph(
    source: MediaStreamAudioSourceNode,
    analyser: AnalyserNode,
    gain: GainNode
  ) {
    source.disconnect(analyser)
    analyser.disconnect(gain)
    gain.disconnect(this.context.destination)
  }

  public async addStream(key: string, mediaStream: MediaStream) {
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    if (mediaStream.getAudioTracks().length === 0) {
      throw 'Invalid audio stream'
    }
    if (key.startsWith(fileSourcePrefix)) {
      throw 'Cannot use this name as audio stream key'
    }
    const { source, gain, analyser } = await this.createStreamNodeGraph(
      mediaStream
    )

    // register audio for chrome
    const audio = document.createElement('audio')
    audio.srcObject = mediaStream
    audio.volume = 0

    this.streamSourceNodeMap[key] = source
    this.analyserNodeMap[key] = analyser
    this.gainNodeMap[key] = gain
  }

  public async addFileSource(key: string, url: string) {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const prefixedKey = fileSourcePrefix + key

    this.audioBufferMap[prefixedKey] = await this.context.decodeAudioData(
      buffer
    )
  }

  public async playFileSource(key: string) {
    const suspended = this.context.state === 'suspended'
    const prefixedKey = fileSourcePrefix + key
    const source = await this.createAudioSourceNodeGraph(
      this.audioBufferMap[prefixedKey]
    )
    if (suspended) {
      await this.context.resume()
      source.addEventListener(
        'ended',
        () => {
          this.context.suspend()
        },
        { once: true }
      )
    }
    source.start(0)
  }

  public async removeStream(key: string) {
    this.disconnectNodeGraph(
      this.streamSourceNodeMap[key],
      this.analyserNodeMap[key],
      this.gainNodeMap[key]
    )

    delete this.gainNodeMap[key]
    delete this.streamSourceNodeMap[key]
    delete this.volumeMap[key]
    if (Object.keys(this.gainNodeMap).length === 0) {
      await this.context.suspend()
    }
  }

  public getVolumeOf(key: string) {
    return this.gainNodeMap[key].gain.value
  }

  public setAndSaveVolumeOf(key: string, volume: number) {
    const v = Math.max(0, Math.min(1, volume))
    this.setVolumeOf(key, v)
    this.volumeMap[key] = v
  }

  public setVolumeOf(key: string, userVolume: number) {
    const gainNode = this.gainNodeMap[key]
    const value = this.calcVolumeValue(gainNode, userVolume)
    gainNode.gain.setValueAtTime(value, this.context.currentTime)
  }

  public setfileVolume(volume: number) {
    this.fileVolume = volume
  }

  public getLevelOfNode(node?: AnalyserNode) {
    if (!node) return 0

    const arr = this.frequencyUint8Array
    node.getByteFrequencyData(arr)
    return arr.reduce((acc, cur) => acc + cur, 0)
  }

  public getLevelOf(key: string) {
    return this.getLevelOfNode(this.analyserNodeMap[key])
  }

  public muteAll() {
    Object.keys(this.gainNodeMap).forEach(key => {
      this.setVolumeOf(key, 0)
    })
  }

  public unmuteAll() {
    Object.entries(this.volumeMap).forEach(([key, volume]) => {
      if (!(key in this.gainNodeMap)) return
      this.setVolumeOf(key, volume)
    })
  }

  set volume(v: number) {
    const newMasterVolume = Math.max(0, Math.min(1, v))
    if (this.masterVolume === newMasterVolume) return

    this.masterVolume = newMasterVolume
    Object.keys(this.gainNodeMap).forEach(key => {
      this.setVolumeOf(key, this.volumeMap[key])
    })
  }
  get volume() {
    return this.masterVolume
  }
}
