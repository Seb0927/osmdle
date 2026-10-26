export type SoundName =
  | 'correct'
  | 'wrong'
  | 'slide'
  | 'gameover'
  | 'new-best'
  | 'tick'
  | 'hover'
  | 'best'

const SOUND_NAMES: SoundName[] = [
  'correct',
  'wrong',
  'slide',
  'gameover',
  'new-best',
  'tick',
  'hover',
  'best',
]

const SOUND_PATHS: Record<SoundName, string> = {
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.wav',
  slide: '/sounds/slide.wav',
  gameover: '/sounds/gameover.wav',
  'new-best': '/sounds/new-best.wav',
  tick: '/sounds/tick.wav',
  hover: '/sounds/hover.wav',
  best: '/sounds/best.wav',
}

const SOUND_VOLUMES: Record<SoundName, number> = {
  correct: 0.75,
  wrong: 1.7,
  slide: 0.9,
  gameover: 0.5,
  'new-best': 0.5,
  tick: 0.95,
  hover: 0.25,
  best: 0.65,
}

const MUTED_KEY = 'osmdle:muted'

let context: AudioContext | null = null
let muted = false
let mutedLoaded = false
const buffers = new Map<SoundName, AudioBuffer>()
const pending = new Map<SoundName, Promise<AudioBuffer | null>>()
const raw = new Map<SoundName, ArrayBuffer>()
const rawPending = new Map<SoundName, Promise<ArrayBuffer | null>>()
const listeners = new Set<() => void>()

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function readMuted(): boolean {
  if (!hasWindow()) {
    return false
  }
  try {
    return window.localStorage.getItem(MUTED_KEY) === 'true'
  } catch {
    return false
  }
}

function writeMuted(value: boolean): void {
  try {
    window.localStorage.setItem(MUTED_KEY, String(value))
  } catch {
    return
  }
}

function ensureMutedLoaded(): void {
  if (!mutedLoaded) {
    muted = readMuted()
    mutedLoaded = true
  }
}

function getContext(): AudioContext | null {
  if (!hasWindow()) {
    return null
  }
  if (!context) {
    try {
      context = new window.AudioContext()
    } catch {
      return null
    }
  }
  return context
}

function fetchSound(name: SoundName): Promise<ArrayBuffer | null> {
  const cached = raw.get(name)
  if (cached) {
    return Promise.resolve(cached)
  }
  const inFlight = rawPending.get(name)
  if (inFlight) {
    return inFlight
  }
  const promise = fetch(SOUND_PATHS[name])
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${name} sound`)
      }
      return response.arrayBuffer()
    })
    .then((data) => {
      raw.set(name, data)
      return data
    })
    .catch(() => null)
    .finally(() => {
      rawPending.delete(name)
    })
  rawPending.set(name, promise)
  return promise
}

function loadSound(name: SoundName): Promise<AudioBuffer | null> {
  const cached = buffers.get(name)
  if (cached) {
    return Promise.resolve(cached)
  }
  const inFlight = pending.get(name)
  if (inFlight) {
    return inFlight
  }
  const audioContext = getContext()
  if (!audioContext) {
    return Promise.resolve(null)
  }
  const promise = (async () => {
    const data = await fetchSound(name)
    if (!data) {
      return null
    }
    try {
      const buffer = await audioContext.decodeAudioData(data)
      buffers.set(name, buffer)
      return buffer
    } catch {
      return null
    }
  })().finally(() => {
    pending.delete(name)
  })
  pending.set(name, promise)
  return promise
}

export function isMuted(): boolean {
  ensureMutedLoaded()
  return muted
}

export function setMuted(next: boolean): void {
  ensureMutedLoaded()
  if (muted === next) {
    return
  }
  muted = next
  if (hasWindow()) {
    writeMuted(next)
  }
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function preloadSounds(): void {
  for (const name of SOUND_NAMES) {
    void fetchSound(name)
  }
}

export function unlockAudio(): void {
  const audioContext = getContext()
  if (!audioContext) {
    return
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  preloadSounds()
  for (const name of SOUND_NAMES) {
    void loadSound(name)
  }
}

export function playSound(name: SoundName): void {
  if (isMuted()) {
    return
  }
  const audioContext = getContext()
  if (!audioContext) {
    return
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  void loadSound(name).then((buffer) => {
    if (!buffer || isMuted()) {
      return
    }
    const source = audioContext.createBufferSource()
    const gain = audioContext.createGain()
    source.buffer = buffer
    gain.gain.value = SOUND_VOLUMES[name]
    source.connect(gain).connect(audioContext.destination)
    source.start()
  })
}
