<template>
  <header class="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 shadow-lg">
    <div class="flex justify-between px-5">
      <div></div>
      <h1 class="text-3xl font-bold">CourtCaller</h1>
      <Button icon="pi pi-cog" rounded text @click="openSettings"/>
    </div>
  </header>

  <SettingsDialog
    v-model:visible="isSettingsOpen"
    :settings="settings"
    @save="saveSettings"
  />

  <match-list
    :selected-ids="selectedIds"
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
import { computed, ref } from 'vue'
import MatchList from '@/components/MatchList.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import Button from 'primevue/button'

const selectedIds = computed(() => [])

const SETTINGS_STORAGE_KEY = 'courtcaller.settings.v1'

const settings = ref({
  scrapeUrl: '',
  courtAmount: 11,
  announcementTemplate: 'Op baan {court}, {discipline} {level}: {teamA} tegen {teamB}. Baan {court}',
  aanvangenTemplate: 'Baan {court}, aanvangen alsjeblieft',
  recallTemplate: '{callCount}de oproep, baan {court}, {teamNames}',
  ttsApiUrl: 'http://localhost:5000',
  elevenApiKey: '',
  elevenVoiceId: ''
})

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

</script>

<style scoped>
:deep(.p-button-rounded) {
  color: white;
}
</style>
