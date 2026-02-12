<template>
  <div class="player-list-container">
    <h1>🏸 Badminton Player List</h1>

    <div class="filters">
      <div class="filter-group">
        <label for="discipline-select">Discipline:</label>
        <select v-model="selectedDiscipline" id="discipline-select" class="select-input">
          <option value="">All Disciplines</option>
          <option v-for="disc in disciplines" :key="disc.id" :value="disc.id">
            {{ disc.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="group-select">Level Group:</label>
        <select v-model="selectedGroup" id="group-select" class="select-input">
          <option value="">All Groups</option>
          <option v-for="group in levels" :key="group.group" :value="group.group">
            Group {{ group.group }} (Levels {{ group.levels.join(', ') }})
          </option>
        </select>
      </div>
    </div>

    <div class="players-grid">
      <div
        v-for="player in filteredPlayers"
        :key="player.id"
        class="player-card"
        :class="{ selected: isSelected(player.id), disabled: !filtersSet }"
        @click="filtersSet && toggle(player)"
        role="button"
        :tabindex="filtersSet ? 0 : -1"
        @keydown.enter.prevent="filtersSet && toggle(player)"
        @keydown.space.prevent="filtersSet && toggle(player)"
      >
        <div class="player-header">
          <span class="discipline-badge" :class="getDisciplineClass(player.discipline)">
            {{ getDisciplineName(player.discipline) }}
          </span>
          <span class="level-badge">Level {{ player.levelLabel }}</span>
        </div>
        <div class="player-names">
          <div v-for="(name, index) in player.names" :key="index" class="player-name">
            {{ name }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredPlayers.length === 0" class="no-results">
      No players found matching your filters.
    </div>

    <div class="stats">
      <p>Total Players: {{ filteredPlayers.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import playersData from '@/data/players.json'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['toggle'])

const selectedDiscipline = ref('')
const selectedGroup = ref('')

const disciplines = playersData.disciplines
const levels = playersData.levels

const filtersSet = computed(() => selectedDiscipline.value && selectedGroup.value)

const parseLevelKeyToLevels = (levelKey) => {
  if (!levelKey) return []
  const parts = String(levelKey).split('-').map(p => parseInt(p, 10)).filter(n => Number.isFinite(n))
  if (parts.length === 1) return parts
  if (parts.length === 2) {
    const [start, end] = parts
    const result = []
    const step = start <= end ? 1 : -1
    for (let i = start; step > 0 ? i <= end : i >= end; i += step) result.push(i)
    return result
  }
  return parts
}

const allPlayers = computed(() => {
  const playlist = playersData.playlist || {}
  const flattened = []

  for (const [disciplineId, byLevel] of Object.entries(playlist)) {
    for (const [levelKey, entries] of Object.entries(byLevel || {})) {
      const parsedLevels = parseLevelKeyToLevels(levelKey)
      const levelLabel = String(levelKey)

      ;(entries || []).forEach((entry, index) => {
        const names = Array.isArray(entry) ? entry : [entry]
        flattened.push({
          id: `${disciplineId}-${levelKey}-${index}`,
          discipline: disciplineId,
          levels: parsedLevels,
          levelLabel,
          names,
        })
      })
    }
  }

  return flattened
})

const filteredPlayers = computed(() => {
  return allPlayers.value.filter(player => {
    const disciplineMatch = !selectedDiscipline.value || player.discipline === selectedDiscipline.value
    
    let groupMatch = true
    if (selectedGroup.value) {
      const selectedGroupObj = levels.find(g => g.group === parseInt(selectedGroup.value))
      groupMatch = !!(
        selectedGroupObj &&
        Array.isArray(player.levels) &&
        player.levels.some(lvl => selectedGroupObj.levels.includes(lvl))
      )
    }
    
    return disciplineMatch && groupMatch
  })
})

const getDisciplineName = (disciplineId) => {
  const disc = disciplines.find(d => d.id === disciplineId)
  return disc ? disc.name : disciplineId
}

const getDisciplineClass = (disciplineId) => {
  return `discipline-${String(disciplineId || '').toLowerCase()}`
}

const isSelected = (id) => props.selectedIds.includes(id)

const toggle = (player) => {
  emit('toggle', player)
}
</script>

<style scoped>
.player-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.select-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
  min-width: 200px;
}

.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.player-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.player-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.player-card.selected {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.18);
}

.player-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.player-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.discipline-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.discipline-he {
  background: #667eea;
}

.discipline-hd {
  background: #764ba2;
}

.discipline-de {
  background: #f093fb;
}

.discipline-dd {
  background: #4facfe;
}

.discipline-gd {
  background: #43e97b;
}

.level-badge {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.player-names {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  padding: 4px 0;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

.stats {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
}
</style>
