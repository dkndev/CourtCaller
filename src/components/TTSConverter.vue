<template>
  <div class="tts-converter">
    <div class="input-section">
      <text-area
        v-model="textInput"
        label="Text to Speech"
        placeholder="Enter text to convert to speech..."
        :rows="6"
        :maxLength="1000"
      />
      <button @click="convertToSpeech" :disabled="isLoading || !textInput.trim()" class="convert-button">
        <span v-if="!isLoading">🎤 Convert to Speech</span>
        <span v-else>⏳ Converting...</span>
      </button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>

    <div v-if="audioUrl" class="player-section">
      <audio-player ref="playerRef" :src="audioUrl" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TextArea from './TextArea.vue'
import AudioPlayer from './AudioPlayer.vue'

const textInput = ref('hallo hoe gaat het?')
const audioUrl = ref('')
const isLoading = ref(false)
const error = ref('')
const playerRef = ref(null)

const currentSettings = ref({
  length_scale: 1.5,
  noise_scale: 0.667,
  noise_w_scale: 0.8
})

const API_URL = '/api'

const convertToSpeech = async () => {
  if (!textInput.value.trim()) {
    error.value = 'Please enter some text'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: textInput.value,
        length_scale: currentSettings.value.length_scale,
        noise_scale: currentSettings.value.noise_scale,
        noise_w_scale: currentSettings.value.noise_w_scale
      }),
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const blob = await response.blob()
    audioUrl.value = URL.createObjectURL(blob)

    setTimeout(() => {
      if (playerRef.value) {
        playerRef.value.play()
      }
    }, 100)
  } catch (err) {
    error.value = `Error: ${err.message}. Make sure the TTS API is running on ${API_URL}`
    console.error('TTS conversion error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.tts-converter {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.convert-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.convert-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.convert-button:active:not(:disabled) {
  transform: translateY(0);
}

.convert-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background-color: #fee;
  color: #c33;
  border-radius: 6px;
  font-size: 14px;
  border-left: 4px solid #c33;
}

.player-section {
  margin-top: 12px;
}
</style>
