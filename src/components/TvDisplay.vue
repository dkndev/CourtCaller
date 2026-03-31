<template>
  <div class="min-h-screen p-3">
    <div class="mx-auto">
      <!-- Error Message -->
      <Message v-if="error" severity="error" class="mb-6" :closable="true" @close="$emit('clear-error')">
        {{ error }}
      </Message>

      <!-- Loading State -->
      <div v-if="loading && matches.length === 0" class="text-center py-20">
        <ProgressSpinner
          style="width: 80px; height: 80px"
          strokeWidth="4"
          fill="transparent"
          animationDuration="1s"
        />
        <p class="text-white text-xl mt-4">Wedstrijden laden...</p>
      </div>

      <!-- Matches Display -->
      <div v-else-if="matches.length > 0" class="space-y-6">
        <div v-if="displayMatches && displayMatches.length > 0">

          <!-- Current Matches: Sports Hall Layout -->
          <div v-if="showCurrentView" class="sports-hall-layout">
            <!-- Row 1: Courts 1–4 -->
            <div class="grid grid-cols-4 gap-4 mb-2 items-stretch">
              <template v-for="court in [1, 2, 3, 4]" :key="`court-${court}`">
                <MatchCard v-if="getMatchByCourt(court)" :match="getMatchByCourt(court)" :is-current="true" />
                <div v-else class="p-4 rounded-lg border-2 border-dashed border-surface-600 flex items-center justify-center">
                  <span class="text-surface-500 text-sm">Baan {{ court }} — Beschikbaar</span>
                </div>
              </template>
            </div>

            <!-- Row 2: Empty + Courts 5–7 -->
            <div class="grid grid-cols-4 gap-4 mb-2 items-stretch">
              <div></div>
              <template v-for="court in [5, 6, 7]" :key="`court-${court}`">
                <MatchCard v-if="getMatchByCourt(court)" :match="getMatchByCourt(court)" :is-current="true" />
                <div v-else class="p-4 rounded-lg border-2 border-dashed border-surface-600 flex items-center justify-center">
                  <span class="text-surface-500 text-sm">Baan {{ court }} — Beschikbaar</span>
                </div>
              </template>
            </div>

            <!-- Row 3: Courts 8–11 -->
            <div class="grid grid-cols-4 gap-4 mb-2 items-stretch">
              <template v-for="court in [8, 9, 10, 11]" :key="`court-${court}`">
                <MatchCard v-if="getMatchByCourt(court)" :match="getMatchByCourt(court)" :is-current="true" />
                <div v-else class="p-4 rounded-lg border-2 border-dashed border-surface-600 flex items-center justify-center">
                  <span class="text-surface-500 text-sm">Baan {{ court }} — Beschikbaar</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Upcoming Matches -->
          <div v-else class="grid gap-4 grid-cols-1">
            <MatchCard
              v-for="(match, index) in displayMatches"
              :key="index"
              :match="match"
              :is-current="false"
            />
          </div>
        </div>

        <!-- No Matches -->
        <div v-if="currentMatches.length === 0 && upcomingMatches.length === 0" class="text-center py-20">
          <i class="pi pi-info-circle text-white text-6xl mb-4"></i>
          <p class="text-white text-2xl">Geen huidige of komende wedstrijden gevonden</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center py-20">
        <i class="pi pi-inbox text-white text-6xl mb-4"></i>
        <p class="text-white text-2xl">Klik op instellingen om te beginnen</p>
        <p class="text-surface-400 mt-2">Configureer de toernooi URL in de instellingen</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import MatchCard from '@/components/MatchCard.vue'

defineProps({
  matches: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  showCurrentView: { type: Boolean, default: true },
  currentMatches: { type: Array, default: () => [] },
  upcomingMatches: { type: Array, default: () => [] },
  displayMatches: { type: Array, default: () => [] },
  getMatchByCourt: { type: Function, required: true },
})

defineEmits(['clear-error'])
</script>
