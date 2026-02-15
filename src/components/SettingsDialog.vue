<template>
  <Dialog v-model:visible="isOpen" header="Settings" :modal="true" :style="{ width: '100%', maxWidth: '800px' }">
    <Accordion :activeIndex="[0]" multiple>
      <!-- General Settings -->
      <AccordionTab header="Algemene Instellingen">
        <div class="space-y-4">
          <div>
            <label for="scrapeUrl" class="text-xs font-bold text-white block mb-1">Scrape URL</label>
            <InputText id="scrapeUrl" v-model="localSettings.scrapeUrl" type="text" class="w-full"/>
          </div>

          <div>
            <label for="courtAmount" class="text-xs font-bold text-white block mb-1">Aantal Banen</label>
            <InputNumber id="courtAmount" v-model="localSettings.courtAmount" :min="1" :max="30" :step="1" showButtons class="w-full" />
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
              placeholder="{callCount}de oproep, baan {court}, {teamNames}"
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
            <label for="ttsUrl" class="text-xs font-bold text-white block mb-1">TTS Server URL</label>
            <InputText id="ttsUrl" v-model="localSettings.ttsApiUrl" type="text" placeholder="http://localhost:5000" class="w-full"/>
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

watch(() => props.visible, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    // Reset local settings when dialog opens
    localSettings.value = {...props.settings}
  }
})

watch(isOpen, (newVal) => {
  emit('update:visible', newVal)
})

const handleCancel = () => {
  isOpen.value = false
}

const handleSave = () => {
  emit('save', {...localSettings.value})
  isOpen.value = false
}
</script>
