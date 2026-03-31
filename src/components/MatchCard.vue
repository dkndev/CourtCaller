<template>
  <Card class="h-full !bg-surface-800 border border-surface-700" :pt="{ body: { class: 'h-full !bg-transparent' }, content: { class: 'h-full !bg-transparent' } }">
    <template #content>
      <!-- CURRENT: vertical layout -->
      <div v-if="isCurrent" class="flex flex-col h-full">
        <div class="flex items-center justify-between">
          <Badge
            v-if="match.court"
            :value="`Baan ${match.court}`"
            severity="danger"
            class="text-base px-3 py-1"
          />
          <Tag
            :value="getDisciplineLabel(match.teamA.discipline) + ' ' + match.teamA.levelLabel"
            :icon="getDisciplineIcon(match.teamA.discipline)"
            :severity="getDisciplineSeverity(match.teamA.discipline)"
            class="text-sm font-semibold"
          />
        </div>

        <Divider />

        <div class="flex flex-col flex-1">
          <div class="flex-1 p-2 rounded-lg bg-surface-700 shadow-md flex flex-col justify-center">
            <div v-for="(player, index) in match.teamA.names" :key="index" class="mb-1">
              <div class="text-xl font-bold text-white">{{ player }}</div>
            </div>
          </div>

          <Divider />

          <div class="flex-1 p-2 rounded-lg bg-surface-700 shadow-md flex flex-col justify-center">
            <div v-for="(player, index) in match.teamB.names" :key="index" class="mb-1">
              <div class="text-xl font-bold text-white">{{ player }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- UPCOMING: horizontal layout -->
      <div v-else class="flex items-center gap-6">
        <!-- Meta -->
        <div class="flex flex-col gap-2 shrink-0 w-50">
          <Badge
            :value="match.time"
            severity="danger"
            class="text-base px-3 py-1"
          />
          <Tag
            :value="getDisciplineLabel(match.teamA.discipline) + ' ' + match.teamA.levelLabel"
            :icon="getDisciplineIcon(match.teamA.discipline)"
            :severity="getDisciplineSeverity(match.teamA.discipline)"
            class="text-xs font-semibold"
          />
        </div>

        <!-- Team A -->
        <div class="flex-1 p-3 rounded-lg bg-surface-700">
          <div v-for="(player, index) in match.teamA.names" :key="index">
            <span class="text-lg font-bold text-white">{{ player }}</span>
          </div>
        </div>

        <!-- VS -->
        <div class="shrink-0 text-surface-400 font-bold text-xl">VS</div>

        <!-- Team B -->
        <div class="flex-1 p-3 rounded-lg bg-surface-700">
          <div v-for="(player, index) in match.teamB.names" :key="index">
            <span class="text-lg font-bold text-white">{{ player }}</span>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

defineProps({
  match: {
    type: Object,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
})

const getDisciplineLabel = (discipline) => {
  const labels = {
    'HE': 'Heren Enkel',
    'DE': 'Dames Enkel',
    'HD': 'Heren Dubbel',
    'DD': 'Dames Dubbel',
    'GD': 'Gemengd Dubbel'
  }
  return labels[discipline] || discipline
}

const getDisciplineIcon = (discipline) => {
  const icons = {
    'HE': 'pi pi-user',
    'DE': 'pi pi-user',
    'HD': 'pi pi-users',
    'DD': 'pi pi-users',
    'GD': 'pi pi-users'
  }
  return icons[discipline] || 'pi pi-flag'
}

const getDisciplineSeverity = (discipline) => {
  const severities = {
    'HE': 'info',
    'DE': 'success',
    'HD': 'warn',
    'DD': 'danger',
    'GD': 'secondary'
  }
  console.log(severities[discipline] || 'info')
  return severities[discipline] || 'info'
}
</script>
