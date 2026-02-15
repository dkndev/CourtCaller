import { ref } from 'vue'

export function useAudio (props) {
  let currentAudioElement = null
  const isPlaying = ref(false)

  const stopAudio = () => {
    if (currentAudioElement) {
      currentAudioElement.pause()
      currentAudioElement.currentTime = 0
      currentAudioElement = null
    }
    isPlaying.value = false
  }

  const callTtsApi = async (text) => {
    const response = await fetch(`${props.apiBaseUrl}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        api_key: props.apiKey || '',
        voice_id: props.voiceId || ''
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    return await response.blob()
  }

  const playAudio = (audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    const audioElement = new Audio(audioUrl)
    currentAudioElement = audioElement
    audioElement.playbackRate = 0.9
    audioElement.onended = () => {
      isPlaying.value = false
    }
    audioElement.play()
  }

  const playText = async (text, onError) => {
    if (!text.trim()) return

    isPlaying.value = true

    try {
      const audioBlob = await callTtsApi(text)
      playAudio(audioBlob)
    } catch (err) {
      console.error('TTS playback error:', err)
      if (onError) {
        onError(`Fout bij afspelen: ${err.message}`)
      }
      isPlaying.value = false
    }
  }

  return {
    isPlaying,
    stopAudio,
    playText
  }
}
