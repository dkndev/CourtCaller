<template>
  <div class="p-5 max-w-6xl mx-auto">
    <div class="mb-8 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Wedstrijden</h2>
      <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-lg text-sm border-l-4 border-red-700">{{ error }}</div>
      <div v-if="successMessage" class="p-3 bg-green-100 text-green-700 rounded-lg text-sm border-l-4 border-green-700 mt-2">{{ successMessage }}</div>
      <Button
        icon="pi pi-stop"
        :disabled="!isPlaying"
        @click="stopAudio"
        severity="danger"
        label="Afspelen stoppen"
      >
      </Button>
    </div>

    <div v-if="matches.length === 0" class="text-center text-gray-500 font-semibold py-5">
      Geen wedstrijden geladen. Voer een URL in en klik Update.
    </div>

    <div v-else class="space-y-2 mb-8">
      <template v-for="(match, index) in matches" :key="match.id">
        <!-- Time divider -->
        <div
          v-if="index === 0 || match.time !== matches[index - 1].time"
          class="flex items-center gap-3 my-4 pt-4"
        >
          <div class="flex-1 h-px bg-orange-500"></div>
          <div class="text-white font-bold text-lg px-3 py-1 bg-orange-500 rounded-full">
            {{ match.time || match.matchNumber }}
          </div>
          <div class="flex-1 h-px bg-orange-500"></div>
        </div>

        <div
          class="border-2 border-gray-500 rounded-lg p-3 cursor-pointer hover:border-orange-500 hover:shadow-lg hover:-translate-y-0.5"
          role="button"
          tabindex="0"
        >
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-3 items-center">
            <div>
              <div class="font-bold text-sm text-white">{{ match.time || match.matchNumber }}</div>
              <div class="flex gap-2 mt-2">
                <span class="text-xs font-bold text-white px-2 py-1 rounded" :class="getDisciplineClass(match.teamA.discipline)">
                  {{ getDisciplineName(match.teamA.discipline) }}
                </span>
                <span class="text-xs font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded">{{ match.teamA.levelLabel }}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 col-span-2 gap-2 items-center">
              <div class="flex items-center gap-2">
                <Button
                  v-if="match.court"
                  :label="match.callCount"
                  icon="pi pi-volume-up"
                  severity="info"
                  text
                  rounded
                  @click.stop="playTeamRecall(match, 'A')"
                  class="text-xs"
                />
                <div class="text-sm font-semibold text-white text-lg flex-1">
                  <span v-for="(name, idx) in match.teamA.names" :key="`a-${idx}`" class="block">{{ name }}</span>
                </div>
              </div>
              <div class="text-center font-bold text-white text-sm">vs</div>
              <div class="flex items-center gap-2">
                <div class="text-sm font-semibold text-white text-lg flex-1">
                  <span v-for="(name, idx) in match.teamB.names" :key="`b-${idx}`" class="block">{{ name }}</span>
                </div>
                <Button
                  v-if="match.court"
                  :label="match.callCount"
                  icon="pi pi-volume-up"
                  severity="info"
                  text
                  rounded
                  @click.stop="playTeamRecall(match, 'B')"
                  class="text-xs"
                />

              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between gap-2 flex-wrap pt-2 border-t border-gray-400">
              <div class="flex justify-center gap-2">
                <Button
                  v-for="court in courtAmount"
                  :key="court"
                  :label="court.toString()"
                  :severity="match.court === court ? 'primary' : 'secondary'"
                  @click.stop="assignCourt(match, court)"
                />
              </div>
              <Button
                v-if="match.court"
                icon="pi pi-play"
                label="Aanvangen"
                severity="success"
                @click.stop="playMatchAanvangen(match)"
              />
            </div>
          </div>
        </div>
        </div>
      </template>
    </div>

    <div v-if="matches.length > 0" class="text-center p-5 bg-gray-100 rounded-lg text-gray-600 text-sm">
      <p>Totaal wedstrijden: {{ matches.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  scrapeUrl: {
    type: String,
    default: '',
  },
  courtAmount: {
    type: Number,
    default: 11,
  },
  announcementTemplate: {
    type: String,
    default: 'Op baan {court}, {discipline} {level}: {teamA} tegen {teamB}. Baan {court}',
  },
  aanvangenTemplate: {
    type: String,
    default: 'Baan {court}, aanvangen alsjeblieft',
  },
  recallTemplate: {
    type: String,
    default: '{callCount} oproep, baan {court}, {teamNames}',
  },
  apiBaseUrl: {
    type: String,
    default: 'http://localhost:5000',
  },
  apiKey: {
    type: String,
    default: '',
  },
  voiceId: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle', 'court-assigned', 'update:isLoading'])

const CACHE_KEY = 'courtcaller_matches_cache'

const matchUrl = ref(props.scrapeUrl || '')
const matches = ref([])
const error = ref('')
const successMessage = ref('')

let currentAudioElement = null
const isPlaying = ref(false)

// Load cached matches on component mount
const loadCachedMatches = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      matches.value = data.matches || []
      matchUrl.value = data.url || matchUrl.value
      if (matches.value.length > 0) {
        successMessage.value = `${matches.value.length} wedstrijden geladen uit cache`
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      }
    }
  } catch (err) {
    console.error('Failed to load cached matches:', err)
  }
}

// Save matches to cache
const saveCacheMatches = () => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      matches: matches.value,
      url: matchUrl.value,
      timestamp: new Date().toISOString()
    }))
  } catch (err) {
    console.error('Failed to save matches to cache:', err)
  }
}

// Load cached data on mount
loadCachedMatches()

watch(
  () => props.scrapeUrl,
  (val) => {
    matchUrl.value = val || ''
  },
  {immediate: true}
)

const DISCIPLINE_NAMES = {
  'HE': 'Heren Enkel',
  'HD': 'Heren Dubbel',
  'DE': 'Dames Enkel',
  'DD': 'Dames Dubbel',
  'GD': 'Gemengd Dubbel'
}

const fetchMatches = async () => {
  if (!matchUrl.value.trim()) return

  emit('update:isLoading', true)
  error.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(`${props.apiBaseUrl}/api/scrape-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: matchUrl.value
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    const newMatches = data.matches || []

    // Preserve court assignments from existing matches
    const oldMatches = matches.value
    const mergedMatches = newMatches.map(newMatch => {
      // Try to find existing match with same ID or similar properties
      const existingMatch = oldMatches.find(oldMatch =>
        oldMatch.id === newMatch.id ||
        (oldMatch.time === newMatch.time &&
         oldMatch.teamA.names[0] === newMatch.teamA.names[0])
      )

      // If found and has manually assigned court, preserve it
      // Otherwise use the court from the server (newMatch.court)
      if (existingMatch && existingMatch.court) {
        return { ...newMatch, court: existingMatch.court, callCount: existingMatch.callCount || 1 }
      }

      // New match or no previous court assignment - use server's court if available
      return { ...newMatch, callCount: newMatch.court ? 1 : 0 }
    })

    matches.value = mergedMatches
    saveCacheMatches()
    successMessage.value = `${matches.value.length} wedstrijden geladen!`
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Fetch matches error:', err)
    error.value = `Fout: ${err.message}`
  } finally {
    emit('update:isLoading', false)
  }
}

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

const playText = async (text) => {
  if (!text.trim()) return

  isPlaying.value = true

  try {
    const audioBlob = await callTtsApi(text)
    playAudio(audioBlob)
  } catch (err) {
    console.error('TTS playback error:', err)
    error.value = `Fout bij afspelen: ${err.message}`
    setTimeout(() => {
      error.value = ''
    }, 3000)
  }
}

const getDisciplineName = (disciplineId) => {
  return DISCIPLINE_NAMES[disciplineId] || disciplineId
}

const getDisciplineClass = (disciplineId) => {
  return `discipline-${String(disciplineId || '').toLowerCase()}`
}


const assignCourt = (match, courtNumber) => {
  match.court = courtNumber
  match.callCount = 1
  saveCacheMatches()

  // Generate announcement using template
  const discipline = DISCIPLINE_NAMES[match.teamA.discipline] || match.teamA.discipline || 'Onbekend'
  const level = match.teamA.levelLabel ? `${match.teamA.levelLabel}` : ''
  const teamANames = match.teamA.names.length > 0 ? match.teamA.names.join(' en ') : 'Team A'
  const teamBNames = match.teamB.names.length > 0 ? match.teamB.names.join(' en ') : 'Team B'

  // Replace template variables
  const text = props.announcementTemplate
    .replace(/{court}/g, match.court)
    .replace(/{discipline}/g, discipline)
    .replace(/{level}/g, level)
    .replace(/{teamA}/g, teamANames)
    .replace(/{teamB}/g, teamBNames)

  playText(text)
}

const generateAnnouncementTextAanvangen = (match) => {
  return props.aanvangenTemplate.replace(/{court}/g, match.court)
}

const playMatchAanvangen = (match) => {
  if (!match.court) return

  const announcementText = generateAnnouncementTextAanvangen(match)

  playText(announcementText)
}

const playTeamRecall = (match, team) => {
  if (!match.court) return

  if (!match.callCount) {
    match.callCount = 0
  }
  match.callCount++

  // Save to cache after incrementing callCount
  saveCacheMatches()

  const teamNames = team === 'A' ? match.teamA.names : match.teamB.names
  const teamNamesText = teamNames.length > 0 ? teamNames.join(' en ') : (team === 'A' ? 'Team A' : 'Team B')

  // Convert number to Dutch ordinal
  const ordinals = {
    2: 'tweede',
    3: 'derde',
    4: 'vierde',
  }
  const callCountText = ordinals[match.callCount] || `${match.callCount}de`

  // Replace template variables
  const announcementText = props.recallTemplate
    .replace(/{callCount}/g, callCountText)
    .replace(/{court}/g, match.court)
    .replace(/{teamNames}/g, teamNamesText)

  playText(announcementText)
}

// Expose fetchMatches so parent can call it
defineExpose({
  fetchMatches
})
</script>

<style scoped>
.discipline-he {
  background-color: #ff6600; /* Orange */
}

.discipline-hd {
  background-color: #cc0000; /* Red */
}

.discipline-de {
  background-color: #ff9933; /* Light orange */
}

.discipline-dd {
  background-color: #004080; /* Blue */
}

.discipline-gd {
  background-color: #ff3300; /* Red-orange */
}
</style>
