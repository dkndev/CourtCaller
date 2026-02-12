<template>
  <header class="app-header">
    <h1>CourtCaller</h1>
    <div class="header-controls">
      <textarea v-model="playbackText" class="playback-textarea" placeholder=""></textarea>
      <button type="button" class="btn play-btn" :disabled="!playbackText.trim() || isPlaying" @click="playText">
        <span v-if="!isPlaying">🔊 Afspelen</span>
        <span v-else>⏳ Afspelen...</span>
      </button>
    </div>
  </header>

  <div class="queue">
    <h2>Queue</h2>

    <div v-if="queue.length === 0" class="queue-empty">Nog geen wedstrijden in de queue.</div>

    <div v-else class="queue-list">
      <div v-for="item in queue" :key="item.id" class="queue-item" :class="{ 'queue-item-duplicate': isDuplicateCourt(item.court) }">
        <div class="queue-item-court">
          <label :for="`court-${item.id}`">Veld</label>
          <select :id="`court-${item.id}`" v-model.number="item.court" class="select">
            <option v-for="n in COURT_COUNT" :key="n" :value="n">Veld {{ n }}</option>
          </select>
        </div>
        <div class="queue-item-main">
          <div class="queue-item-info">
            <span class="queue-discipline">{{ DISCIPLINE_NAMES[item.teamA.discipline] }}</span>
            <span class="queue-level">{{ item.teamA.levelLabel }}</span>
          </div>
          <div class="queue-teams">
            <div class="queue-team">
              <div v-for="(name, idx) in item.teamA.names" :key="`a-${item.id}-${idx}`">{{ name }}</div>
            </div>
            <div class="queue-vs">vs</div>
            <div class="queue-team">
              <div v-for="(name, idx) in item.teamB.names" :key="`b-${item.id}-${idx}`">{{ name }}</div>
            </div>
          </div>
        </div>
        <div class="queue-item-actions">
          <button type="button" class="btn primary" :disabled="!item.court" @click="prepareForPlayback(item)">Bereid voor afspelen</button>
          <button type="button" class="btn" @click="removeQueueItem(item.id)">Verwijder</button>
        </div>
      </div>
    </div>

    <div class="queue-actions">
      <button type="button" class="btn" :disabled="queue.length === 0" @click="clearQueue">Queue leegmaken</button>
    </div>
  </div>

  <div class="match-builder">
    <h2>Wedstrijden voorbereiden</h2>

    <div class="controls">
      <div class="control">
        <label>Geselecteerd ({{ selectedTeams.length }}/2)</label>
        <div class="selected">
          <div v-if="selectedTeams[0]" class="selected-item">
            <div class="selected-names">
              <div v-for="(name, idx) in selectedTeams[0].names" :key="idx">{{ name }}</div>
            </div>
            <button type="button" class="btn" @click="removeSelected(0)">Verwijder</button>
          </div>
          <div v-else class="selected-empty">Team 1: klik een speler/team</div>

          <div v-if="selectedTeams[1]" class="selected-item">
            <div class="selected-names">
              <div v-for="(name, idx) in selectedTeams[1].names" :key="idx">{{ name }}</div>
            </div>
            <button type="button" class="btn" @click="removeSelected(1)">Verwijder</button>
          </div>
          <div v-else class="selected-empty">Team 2: klik een speler/team</div>
        </div>
      </div>

      <div class="control">
        <button type="button" class="btn primary" :disabled="!canAdd" @click="addToQueue">
          Zet in queue
        </button>
        <button type="button" class="btn" :disabled="selectedTeams.length === 0" @click="clearSelected">
          Reset selectie
        </button>
      </div>
    </div>
  </div>

  <player-list :selected-ids="selectedIds" @toggle="toggleTeam"/>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PlayerList from '@/components/PlayerList.vue'

const COURT_COUNT = 11
const QUEUE_STORAGE_KEY = 'courtcaller.queue.v1'

const DISCIPLINE_NAMES = {
  'HE': 'Heren Enkel',
  'HD': 'Heren Dubbel',
  'DE': 'Dames Enkel',
  'DD': 'Dames Dubbel',
  'GD': 'Gemengd Dubbel'
}

const selectedTeams = ref([])
const playbackText = ref('')
const isPlaying = ref(false)

const selectedIds = computed(() => selectedTeams.value.map(t => t.id))

const canAdd = computed(() => selectedTeams.value.length === 2)

const courtCounts = computed(() => {
  const counts = {}
  queue.value.forEach(item => {
    if (item.court) {
      counts[item.court] = (counts[item.court] || 0) + 1
    }
  })
  return counts
})

const isDuplicateCourt = (court) => {
  return court && courtCounts.value[court] > 1
}

const toggleTeam = (team) => {
  if (!team) return

  const idx = selectedTeams.value.findIndex(t => t.id === team.id)
  if (idx !== -1) {
    selectedTeams.value.splice(idx, 1)
    return
  }

  if (selectedTeams.value.length >= 2) return
  selectedTeams.value.push(team)
}

const removeSelected = (index) => {
  selectedTeams.value.splice(index, 1)
}

const clearSelected = () => {
  selectedTeams.value = []
}

const loadQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const queue = ref(loadQueue())

watch(
  queue,
  (val) => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(val))
  },
  {deep: true}
)

const addToQueue = () => {
  if (!canAdd.value) return
  const [teamA, teamB] = selectedTeams.value
  queue.value.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    court: null,
    teamA,
    teamB,
  })
  clearSelected()
}

const removeQueueItem = (id) => {
  queue.value = queue.value.filter(i => i.id !== id)
}

const clearQueue = () => {
  queue.value = []
}

const generatePlaybackText = (item) => {
  const teamANames = item.teamA.names.join(' en ')
  const teamBNames = item.teamB.names.join(' en ')
  const disciplineId = item.teamA.discipline
  const disciplineName = disciplineId ? DISCIPLINE_NAMES[disciplineId] || disciplineId : ''
  const discipline = disciplineName ? `${disciplineName} ` : ''
  const level = item.teamA.levelLabel ? `${item.teamA.levelLabel} ` : ''
  return `Op baan ${item.court} ${discipline}${level}: ${teamANames} tegen ${teamBNames}`
}

const prepareForPlayback = (item) => {
  const text = generatePlaybackText(item)
  playbackText.value = text
}

const playText = async () => {
  if (!playbackText.value.trim()) return

  isPlaying.value = true

  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: playbackText.value,
        length_scale: 1.6,
        noise_scale: 0.5,
        noise_w_scale: 0.8
      }),
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    audio.play()
  } catch (err) {
    console.error('TTS playback error:', err)
    alert(`Error: ${err.message}. Make sure the TTS API is running on /api`)
  } finally {
    isPlaying.value = false
  }
}
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 16px 0;
  font-size: 28px;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: center;
  max-width: 700px;
  margin: 0 auto;
}

.playback-textarea {
  flex: 1;
  min-height: 60px;
  padding: 12px;
  border: 2px solid #fff;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.play-btn {
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: 2px solid white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.play-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.match-builder,
.queue {
  padding: 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.selected {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.selected-item,
.selected-empty {
  border: 1px dashed #ddd;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.selected-empty {
  color: #999;
  font-weight: 600;
}

.selected-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-weight: 600;
}

.btn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn.primary {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.queue-empty {
  color: #999;
  font-weight: 600;
  padding: 10px 0;
}

.queue-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.queue-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 12px;
  background: white;
  transition: all 0.2s ease;
}

.queue-item-court {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.queue-item-court label {
  font-weight: 600;
  font-size: 12px;
}

.queue-item-court .select {
  padding: 6px 10px;
  font-size: 13px;
}

.queue-teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.queue-team {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #0e0e0e;
  font-weight: 600;
}

.queue-vs {
  color: #0e0e0e;
  font-weight: 700;
}

.queue-item-duplicate {
  border-color: #ff3d23;
  background: #fff8f0;
  box-shadow: 0 0 0 3px rgb(255, 70, 46);
}

.queue-item-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.queue-item-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-item-info {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.queue-discipline {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

.queue-level {
  background: #e8f5e9;
  padding: 4px 8px;
  border-radius: 4px;
  color: #2e7d32;
}

.queue-actions {
  margin-top: 10px;
}

@media (max-width: 900px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
