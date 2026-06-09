import { Audio } from 'expo-av'
import { File, Paths } from 'expo-file-system'

type SoundKey = 'correct' | 'wrong' | 'tick' | 'milestone' | 'stageComplete' | 'gameOver'

const SOUND_DEFS: Record<SoundKey, Array<[number, number]>> = {
  correct:       [[523, 70], [659, 110]],
  wrong:         [[200, 160]],
  tick:          [[900, 45]],
  milestone:     [[523, 70], [659, 70], [784, 70], [1047, 220]],
  stageComplete: [[523, 70], [659, 70], [784, 70], [1047, 70], [1319, 320]],
  gameOver:      [[440, 120], [349, 120], [294, 120], [220, 300]],
}

function buildWav(notes: Array<[number, number]>): Uint8Array {
  const SR = 22050
  const allSamples: number[] = []

  for (const [freq, ms] of notes) {
    const n = Math.floor(SR * ms / 1000)
    const dur = ms / 1000
    for (let i = 0; i < n; i++) {
      const t = i / SR
      const env = Math.min(t / 0.005, (dur - t) / 0.005, 1)
      const s = Math.floor(128 + 70 * env * Math.sin(2 * Math.PI * freq * t))
      allSamples.push(Math.max(0, Math.min(255, s)))
    }
    const gap = Math.floor(SR * 0.01)
    for (let i = 0; i < gap; i++) allSamples.push(128)
  }

  const n = allSamples.length
  const buf = new Uint8Array(44 + n)
  const dv = new DataView(buf.buffer)

  const w4 = (o: number, s: string) => s.split('').forEach((c, i) => { buf[o + i] = c.charCodeAt(0) })
  w4(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w4(8, 'WAVE')
  w4(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true)
  dv.setUint16(22, 1, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR, true)
  dv.setUint16(32, 1, true); dv.setUint16(34, 8, true)
  w4(36, 'data'); dv.setUint32(40, n, true)
  allSamples.forEach((s, i) => { buf[44 + i] = s })

  return buf
}

const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {}
let audioReady = false

async function ensureAudioMode() {
  if (audioReady) return
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false })
  audioReady = true
}

async function loadSound(key: SoundKey): Promise<Audio.Sound | null> {
  try {
    const file = new File(Paths.cache, `wf_${key}_v3.wav`)
    if (!file.exists) {
      const wav = buildWav(SOUND_DEFS[key])
      const writer = file.writableStream().getWriter()
      await writer.write(wav)
      await writer.close()
    }
    const { sound } = await Audio.Sound.createAsync({ uri: file.uri })
    return sound
  } catch {
    return null
  }
}

export async function playSound(key: SoundKey) {
  try {
    await ensureAudioMode()
    if (!soundCache[key]) {
      const s = await loadSound(key)
      if (!s) return
      soundCache[key] = s
    }
    const sound = soundCache[key]!
    await sound.setPositionAsync(0)
    await sound.playAsync()
  } catch {}
}

export async function preloadSounds() {
  try {
    await ensureAudioMode()
    await Promise.all(
      (Object.keys(SOUND_DEFS) as SoundKey[]).map(async key => {
        if (!soundCache[key]) {
          const s = await loadSound(key)
          if (s) soundCache[key] = s
        }
      })
    )
  } catch {}
}
