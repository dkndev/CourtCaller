<template>
  <Dialog v-model:visible="isOpen" header="Settings" :modal="true" :style="{ width: '100%', maxWidth: '1200px' }">
    <Accordion :activeIndex="activeAccordion" multiple>
      <!-- General Settings -->
      <AccordionTab header="Algemene Instellingen">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label for="clubTornooiMode" class="text-xs font-bold text-white block">Club Tornooi Modus</label>
              <small class="text-gray-500 text-xs">Upload CSV bestand in plaats van scrapen van URL</small>
            </div>
            <ToggleSwitch id="clubTornooiMode" v-model="localSettings.clubTornooiMode"/>
          </div>

          <div v-if="!localSettings.clubTornooiMode">
            <label for="scrapeUrl" class="text-xs font-bold text-white block mb-1">Scrape URL</label>
            <InputText id="scrapeUrl" v-model="localSettings.scrapeUrl" type="text" class="w-full"/>
          </div>

          <div>
            <label for="courtAmount" class="text-xs font-bold text-white block mb-1">Aantal Banen</label>
            <InputNumber id="courtAmount" v-model="localSettings.courtAmount" :min="1" :max="30" :step="1" showButtons class="w-full"/>
          </div>
        </div>
      </AccordionTab>

      <!-- Announcement Templates -->
      <AccordionTab header="Omroep Tekst Templates">
        <div class="space-y-4">
          <div>
            <label for="announcementTemplate" class="text-xs font-bold text-white block mb-1">
              Omroep Tekst Template
            </label>
            <Textarea
              id="announcementTemplate"
              v-model="localSettings.announcementTemplate"
              rows="3"
              class="w-full"
              placeholder="Op baan {court}, {discipline} {level}: {teamA} tegen {teamB}. Baan {court}"
            />
            <small class="text-gray-500 text-xs">
              Variabelen: {court}, {discipline}, {level}, {teamA}, {teamB}
            </small>
          </div>

          <div>
            <label for="aanvangenTemplate" class="text-xs font-bold text-white block mb-1">
              Aanvangen Tekst Template
            </label>
            <Textarea
              id="aanvangenTemplate"
              v-model="localSettings.aanvangenTemplate"
              rows="2"
              class="w-full"
              placeholder="Baan {court}, aanvangen alsjeblieft"
            />
            <small class="text-gray-500 text-xs">
              Variabelen: {court}
            </small>
          </div>

          <div>
            <label for="recallTemplate" class="text-xs font-bold text-white block mb-1">
              Oproep Tekst Template
            </label>
            <Textarea
              id="recallTemplate"
              v-model="localSettings.recallTemplate"
              rows="2"
              class="w-full"
              placeholder="{callCount} oproep, baan {court}, {teamNames}"
            />
            <small class="text-gray-500 text-xs">
              Variabelen: {callCount}, {court}, {teamNames}
            </small>
          </div>
        </div>
      </AccordionTab>

      <!-- TTS Settings -->
      <AccordionTab header="TTS Instellingen">
        <div class="space-y-4">
          <div>
            <label for="ttsUrl" class="text-xs font-bold text-white block mb-1">TTS Server URL (CourtCaller)</label>
            <InputText id="ttsUrl" v-model="localSettings.ttsApiUrl" type="text" placeholder="http://localhost:5000" class="w-full"/>
            <small class="text-gray-500 text-xs">
              Moet altijd verwijzen naar de CourtCaller server — ook in TV modus (audio wordt daar afgespeeld via SSE)
            </small>
          </div>

          <div>
            <label for="apiKey" class="text-xs font-bold text-white block mb-1">ElevenLabs API key</label>
            <Password id="apiKey" v-model="localSettings.elevenApiKey" :feedback="false" autocomplete="off" inputClass="w-full" :style="{ width: '100%' }"/>
          </div>

          <div>
            <label for="voiceId" class="text-xs font-bold text-white block mb-1">ElevenLabs Voice ID (optional)</label>
            <InputText id="voiceId" v-model="localSettings.elevenVoiceId" type="text" class="w-full"/>
          </div>
        </div>
      </AccordionTab>

      <!-- Toernooi TV Mode -->
      <AccordionTab header="📺 Toernooi TV">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label for="tvMode" class="text-xs font-bold text-white block">Toernooi TV Modus</label>
              <small class="text-gray-500 text-xs">Schakelt de cafetaria TV weergave in</small>
            </div>
            <ToggleSwitch id="tvMode" v-model="localSettings.tvMode"/>
          </div>

          <template v-if="localSettings.tvMode">
            <div>
              <label for="tvUpcomingCount" class="text-xs font-bold block mb-1">Aantal Komende Wedstrijden</label>
              <InputNumber id="tvUpcomingCount" v-model="localSettings.tvUpcomingCount" :min="1" :step="1" showButtons class="w-full"/>
            </div>

            <div>
              <label for="tvCurrentCount" class="text-xs font-bold block mb-1">Aantal Huidige Wedstrijden</label>
              <InputNumber id="tvCurrentCount" v-model="localSettings.tvCurrentCount" :min="1" :step="1" showButtons class="w-full"/>
            </div>

            <div>
              <label for="tvRefreshInterval" class="text-xs font-bold block mb-1">Auto-refresh Interval (seconden)</label>
              <InputNumber id="tvRefreshInterval" v-model="localSettings.tvRefreshInterval" :min="10" :max="300" :step="5" showButtons class="w-full"/>
            </div>

            <div class="flex items-center justify-between">
              <label for="tvAutoRefresh" class="text-xs font-bold">Auto-refresh Inschakelen</label>
              <ToggleSwitch id="tvAutoRefresh" v-model="localSettings.tvAutoRefreshEnabled"/>
            </div>

            <div>
              <label for="tvViewToggleInterval" class="text-xs font-bold block mb-1">Wissel Interval (seconden)</label>
              <InputNumber id="tvViewToggleInterval" v-model="localSettings.tvViewToggleInterval" :min="5" :max="60" :step="5" showButtons class="w-full"/>
              <small class="text-gray-500 text-xs">Hoe lang elke weergave wordt getoond (Huidige / Komende)</small>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label for="tvDemoMode" class="text-xs font-bold block">Demo Modus</label>
                <small class="text-gray-500 text-xs">Voegt een volgnummer toe aan de eerste {{ localSettings.tvCurrentCount }} wedstrijden</small>
              </div>
              <ToggleSwitch id="tvDemoMode" v-model="localSettings.tvDemoMode"/>
            </div>
          </template>
        </div>
      </AccordionTab>
    </Accordion>

    <template #footer>
      <Button label="Annuleer" severity="secondary" @click="handleCancel"/>
      <Button label="Opslaan" @click="handleSave"/>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import ToggleSwitch from 'primevue/toggleswitch'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'save'])

const isOpen = ref(props.visible)
const localSettings = ref({...props.settings})
const activeAccordion = ref([])

watch(() => props.visible, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    // Reset local settings when dialog opens
    localSettings.value = {...props.settings}
  }
})

watch(isOpen, (newVal) => {
  emit('update:visible', newVal)


  if (localSettings.value.tvMode) {
    activeAccordion.value = [3]
  } else {
    activeAccordion.value = []
  }
})

const handleCancel = () => {
  isOpen.value = false
}

const handleSave = () => {
  emit('save', {...localSettings.value})
  isOpen.value = false
}
</script>
