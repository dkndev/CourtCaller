<template>
  <header class="bg-gradient-to-r from-dijle-red-400 to-dijle-red-900 text-white py-2 shadow-lg sticky top-0 z-50">
    <div class="flex justify-between items-center px-5">
      <Button icon="pi pi-cog" rounded text @click="openSettings"/>

      <div class="flex flex-col items-center">
        <h1 class="text-3xl font-bold">{{ settings.tvMode ? 'Toernooi TV' : 'CourtCaller' }}</h1>
        <span v-if="settings.tvMode" class="text-sm font-semibold text-blue-200 mt-0.5">
          {{ tvDisplayTitle }}
        </span>
      </div>

      <!-- CourtCaller mode: Update machten button -->
      <Button
        v-if="!settings.tvMode"
        severity="secondary"
        :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
        :disabled="!settings.scrapeUrl.trim() || isLoading"
        @click="updateMatches"
        label="Update machten"
      />

      <!-- TV mode: Manual refresh button -->
      <Button
        v-else
        severity="secondary"
        :icon="tvLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
        :disabled="!settings.scrapeUrl || !settings.scrapeUrl.trim() || tvLoading"
        @click="tvLoadMatches"
      />
    </div>
  </header>

  <SettingsDialog
    v-model:visible="isSettingsOpen"
    :settings="settings"
    @save="saveSettings"
  />

  <!-- CourtCaller Mode -->
  <match-list
    v-if="!settings.tvMode"
    ref="matchListRef"
    v-model:is-loading="isLoading"
    :scrape-url="settings.scrapeUrl"
    :court-amount="settings.courtAmount"
    :announcement-template="settings.announcementTemplate"
    :aanvangen-template="settings.aanvangenTemplate"
    :recall-template="settings.recallTemplate"
    :api-base-url="settings.ttsApiUrl"
    :api-key="settings.elevenApiKey"
    :voice-id="settings.elevenVoiceId"
  />

  <!-- Toernooi TV Mode -->
  <TvDisplay
    v-if="settings.tvMode"
    :matches="tvMatches"
    :loading="tvLoading"
    :error="tvError"
    :show-current-view="tvShowCurrentView"
    :current-matches="tvCurrentMatches"
    :upcoming-matches="tvUpcomingMatches"
    :display-matches="tvDisplayMatches"
    :get-match-by-court="tvGetMatchByCourt"
    @clear-error="tvClearError"
  />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import MatchList from '@/components/MatchList.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import TvDisplay from '@/components/TvDisplay.vue'
import Button from 'primevue/button'
import { useTvMatches } from '@/composables/useTvMatches.js'

const SETTINGS_STORAGE_KEY = 'courtcaller.settings.v1'

const settings = ref({
  // CourtCaller settings
  scrapeUrl: '',
  courtAmount: 11,
  announcementTemplate: 'Op baan {court}, {discipline} {level}: {teamA} tegen {teamB}. Baan {court}',
  aanvangenTemplate: 'Baan {court}, aanvangen alsjeblieft',
  recallTemplate: '{callCount} oproep, baan {court}, {teamNames}',
  ttsApiUrl: 'http://localhost:5000',
  elevenApiKey: '',
  elevenVoiceId: '',
  // TV mode settings
  tvMode: false,
  tvTournamentUrl: '',
  tvUpcomingCount: 7,
  tvCurrentCount: 11,
  tvRefreshInterval: 30,
  tvAutoRefreshEnabled: false,
  tvViewToggleInterval: 20,
  tvDemoMode: false,
})

const isLoading = ref(false)
const matchListRef = ref(null)

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return
    settings.value = { ...settings.value, ...parsed }
  } catch {
    // ignore
  }
}

loadSettings()

// TV mode composable
const {
  matches: tvMatches,
  loading: tvLoading,
  error: tvError,
  showCurrentView: tvShowCurrentView,
  currentMatches: tvCurrentMatches,
  upcomingMatches: tvUpcomingMatches,
  displayMatches: tvDisplayMatches,
  displayTitle: tvDisplayTitle,
  getMatchByCourt: tvGetMatchByCourt,
  loadMatches: tvLoadMatches,
  startAutoRefresh: tvStartAutoRefresh,
  stopAutoRefresh: tvStopAutoRefresh,
  start: tvStart,
  stop: tvStop,
} = useTvMatches(settings)

const tvClearError = () => {
  tvError.value = ''
}

// Settings
const isSettingsOpen = ref(false)

const openSettings = () => {
  isSettingsOpen.value = true
}

const saveSettings = (newSettings) => {
  const wasTvMode = settings.value.tvMode
  const wasAutoRefresh = settings.value.tvAutoRefreshEnabled

  settings.value = { ...newSettings }

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  } catch {
    // ignore
  }

  // Handle TV mode transitions
  if (!wasTvMode && settings.value.tvMode) {
    tvStart()
  } else if (wasTvMode && !settings.value.tvMode) {
    tvStop()
  } else if (settings.value.tvMode) {
    // Update auto-refresh
    if (wasAutoRefresh !== settings.value.tvAutoRefreshEnabled) {
      if (settings.value.tvAutoRefreshEnabled) tvStartAutoRefresh()
      else tvStopAutoRefresh()
    } else if (settings.value.tvAutoRefreshEnabled) {
      tvStopAutoRefresh()
      tvStartAutoRefresh()
    }
  }
}

const updateMatches = () => {
  if (matchListRef.value && matchListRef.value.fetchMatches) {
    matchListRef.value.fetchMatches()
  }
}

// Start TV mode on mount if already enabled
onMounted(() => {
  if (settings.value.tvMode) {
    tvStart()
  }
})

onUnmounted(() => {
  tvStop()
})

// Watch tvMode toggle to start/stop TV mode
watch(() => settings.value.tvMode, (enabled) => {
  if (enabled) tvStart()
  else tvStop()
})
</script>

<style scoped>
:deep(.p-button-rounded) {
  color: white;
}
</style>
