<template>
  <header class="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 shadow-lg sticky top-0 z-50">
    <div class="flex justify-between items-center px-5">
      <Button icon="pi pi-cog" rounded text @click="openSettings"/>
      <h1 class="text-3xl font-bold">CourtCaller</h1>
      <Button
        severity="primary"
        :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"
        :disabled="!settings.scrapeUrl.trim() || isLoading"
        @click="updateMatches"
        label="Update machten"
      />
    </div>
  </header>

  <SettingsDialog
    v-model:visible="isSettingsOpen"
    :settings="settings"
    @save="saveSettings"
  />

  <match-list
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
</template>

<script setup>
import { ref } from 'vue'
import MatchList from '@/components/MatchList.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import Button from 'primevue/button'

const SETTINGS_STORAGE_KEY = 'courtcaller.settings.v1'

const settings = ref({
  scrapeUrl: '',
  courtAmount: 11,
  announcementTemplate: 'Op baan {court}, {discipline} {level}: {teamA} tegen {teamB}. Baan {court}',
  aanvangenTemplate: 'Baan {court}, aanvangen alsjeblieft',
  recallTemplate: '{callCount} oproep, baan {court}, {teamNames}',
  ttsApiUrl: 'http://localhost:5000',
  elevenApiKey: '',
  elevenVoiceId: ''
})

const isLoading = ref(false)
const matchListRef = ref(null)

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return
    settings.value = {
      ...settings.value,
      ...parsed,
    }
  } catch {
    // ignore
  }
}

loadSettings()

const isSettingsOpen = ref(false)

const openSettings = () => {
  isSettingsOpen.value = true
}

const saveSettings = (newSettings) => {
  settings.value = {...newSettings}
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  } catch {
    // ignore
  }
}

const updateMatches = () => {
  if (matchListRef.value && matchListRef.value.fetchMatches) {
    matchListRef.value.fetchMatches()
  }
}

</script>

<style scoped>
:deep(.p-button-rounded) {
  color: white;
}
</style>
