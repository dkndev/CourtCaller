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
import Button from 'primevue/button'
import { useMatches } from '@/composables/useMatches'
import { useAudio } from '@/composables/useAudio'
import { useMatchActions } from '@/composables/useMatchActions'

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

// Use composables
const {
  matches,
  error,
  successMessage,
  fetchMatches,
  saveCacheMatches
} = useMatches(props, emit)

const { isPlaying, stopAudio, playText } = useAudio(props)

const setError = (msg) => {
  error.value = msg
}

const {
  getDisciplineName,
  getDisciplineClass,
  assignCourt,
  playMatchAanvangen,
  playTeamRecall
} = useMatchActions(props, matches, saveCacheMatches, playText, setError)

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
