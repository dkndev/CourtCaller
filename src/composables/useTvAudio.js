import { onUnmounted, ref } from 'vue'

/**
 * Connects to the TTS server SSE stream and plays audio whenever
 * the CourtCaller computer triggers a TTS announcement.
 */
export function useTvAudio(settings) {
  const isPlaying = ref(false)
  let eventSource = null
  let currentAudio = null

  const stop = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    isPlaying.value = false
  }

  const play = (audioB64) => {
    stop()

    const byteChars = atob(audioB64)
    const bytes = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.playbackRate = 0.9
    audio.onended = () => {
      isPlaying.value = false
      URL.revokeObjectURL(url)
    }

    currentAudio = audio
    isPlaying.value = true
    audio.play().catch((err) => {
      console.warn('TV audio play failed:', err)
      isPlaying.value = false
    })
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    stop()
  }

  const connect = () => {
    disconnect()

    // Connect SSE to the CourtCaller TTS server — that's where audio is
    // synthesised and broadcast, regardless of which port this page is on.
    const base = (settings.value.ttsApiUrl || 'http://localhost:5000').replace(/\/$/, '')
    eventSource = new EventSource(`${base}/api/audio-stream`)

    eventSource.onmessage = (e) => {
      if (e.data) play(e.data)
    }

    eventSource.onerror = () => {
      // Browser auto-reconnects on error; just log it
      console.warn('TV audio stream disconnected, retrying...')
    }
  }

  onUnmounted(disconnect)

  return { isPlaying, connect, disconnect }
}
