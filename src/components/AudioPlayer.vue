<template>
  <div class="audio-player">
    <div class="player-controls">
      <button @click="togglePlay" class="play-button" :aria-label="isPlaying ? 'Pause' : 'Play'">
        <span v-if="!isPlaying">▶</span>
        <span v-else>⏸</span>
      </button>

      <div class="progress-container">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="duration"
          :value="currentTime"
          @input="seek"
          class="progress-bar"
          :aria-label="'Progress'"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <button @click="toggleMute" class="mute-button" :aria-label="isMuted ? 'Unmute' : 'Mute'">
        <span v-if="!isMuted">🔊</span>
        <span v-else>🔇</span>
      </button>

      <input
        type="range"
        min="0"
        max="100"
        :value="volume"
        @input="changeVolume"
        class="volume-slider"
        :aria-label="'Volume'"
      />
    </div>

    <audio
      ref="audioElement"
      @timeupdate="updateTime"
      @loadedmetadata="updateDuration"
      @ended="onAudioEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @playing="isPlaying = true"
    ></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  autoplay: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['ended'])

const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const isMuted = ref(false)
const inputSrc = ref(props.src)

const togglePlay = () => {
  if (audioElement.value) {
    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      audioElement.value.play().catch(() => {})
    }
  }
}

const seek = (event) => {
  if (audioElement.value) {
    audioElement.value.currentTime = event.target.value
  }
}

const updateTime = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const updateDuration = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}

const toggleMute = () => {
  if (audioElement.value) {
    isMuted.value = !isMuted.value
    audioElement.value.muted = isMuted.value
  }
}

const changeVolume = (event) => {
  volume.value = event.target.value
  if (audioElement.value) {
    audioElement.value.volume = volume.value / 100
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
  emit('ended')
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const play = () => {
  if (audioElement.value) {
    audioElement.value.play()
  }
}

const pause = () => {
  if (audioElement.value) {
    audioElement.value.pause()
  }
}

const setSrc = (newSrc) => {
  if (audioElement.value) {
    audioElement.value.src = newSrc
  }
}

const updateSource = () => {
  if (inputSrc.value) {
    if (audioElement.value) {
      audioElement.value.src = inputSrc.value
      audioElement.value.load()
      currentTime.value = 0
      isPlaying.value = false
    }
  }
}

defineExpose({
  play,
  pause,
  setSrc
})

onMounted(() => {
  if (audioElement.value && props.src) {
    audioElement.value.src = props.src
  }
})

watch(() => props.src, (newSrc) => {
  if (audioElement.value) {
    audioElement.value.src = newSrc
    audioElement.value.load()
  }
})
</script>

<style scoped>
.audio-player {
  width: 100%;
  max-width: 500px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

button:hover {
  background: rgba(255, 255, 255, 0.3);
}

button:active {
  transform: scale(0.95);
}

.play-button {
  min-width: 40px;
}

.mute-button {
  min-width: 40px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.time {
  font-size: 12px;
  min-width: 35px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-bar::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider {
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
}

audio {
  display: none;
}
</style>
