import { computed, ref, watch } from 'vue'

export function useTvMatches(settings) {
  const matches = ref([])
  const loading = ref(false)
  const error = ref('')
  const showCurrentView = ref(true)

  let rafId = null
  let toggleStartTime = null
  let refreshIntervalId = null

  // ── Computed ─────────────────────────────────────────────────────────────

  const currentMatches = computed(() => {
    const count = settings.value.tvCurrentCount ?? 11
    const slice = matches.value.slice(0, Math.min(count, matches.value.length))
    if (!settings.value.tvDemoMode) return slice
    return slice.map((match, i) => ({ ...match, court: i + 1 }))
  })

  const upcomingMatches = computed(() => {
    const start = currentMatches.value.length
    return matches.value.slice(start, start + (settings.value.tvUpcomingCount ?? 5))
  })

  const displayMatches = computed(() =>
    showCurrentView.value ? currentMatches.value : upcomingMatches.value
  )

  const displayTitle = computed(() =>
    showCurrentView.value ? 'Huidige Wedstrijden' : 'Komende Wedstrijden'
  )

  const getMatchByCourt = (courtNumber) =>
    currentMatches.value.find(m => m.court === courtNumber)

  // ── Data fetching ─────────────────────────────────────────────────────────

  const loadMatches = async () => {
    const url = settings.value.scrapeUrl?.trim()
    if (!url) {
      error.value = 'Voer een toernooi URL in via de instellingen'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await fetch('http://localhost:5001/api/scrape-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `API error: ${response.status}`)
      if (data.matches) matches.value = data.matches
    } catch (err) {
      console.error('Error loading TV matches:', err)
      error.value = err.message || 'Kon wedstrijden niet laden. Controleer de URL en probeer opnieuw.'
    } finally {
      loading.value = false
    }
  }

  // ── Auto-refresh ──────────────────────────────────────────────────────────

  const stopAutoRefresh = () => {
    clearInterval(refreshIntervalId)
    refreshIntervalId = null
  }

  const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshIntervalId = setInterval(() => {
      if (settings.value.scrapeUrl?.trim()) loadMatches()
    }, (settings.value.tvRefreshInterval ?? 30) * 1000)
  }

  // ── View toggle ───────────────────────────────────────────────────────────

  const stopViewToggle = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    toggleStartTime = null
    showCurrentView.value = true
  }

  const startViewToggle = () => {
    stopViewToggle()
    const duration = (settings.value.tvViewToggleInterval ?? 10) * 1000
    toggleStartTime = performance.now()

    const tick = () => {
      if (performance.now() - toggleStartTime >= duration) {
        showCurrentView.value = !showCurrentView.value
        toggleStartTime = performance.now()
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  // ── Watchers ──────────────────────────────────────────────────────────────

  watch(() => settings.value.tvAutoRefreshEnabled, (enabled) => {
    if (enabled) startAutoRefresh()
    else stopAutoRefresh()
  })

  watch(() => settings.value.tvViewToggleInterval, () => {
    startViewToggle()
  })

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  const start = () => {
    if (settings.value.scrapeUrl?.trim()) loadMatches()
    if (settings.value.tvAutoRefreshEnabled) startAutoRefresh()
    startViewToggle()
  }

  const stop = () => {
    stopAutoRefresh()
    stopViewToggle()
  }

  return {
    matches, loading, error, showCurrentView,
    currentMatches, upcomingMatches, displayMatches, displayTitle,
    getMatchByCourt, loadMatches,
    startAutoRefresh, stopAutoRefresh,
    startViewToggle, stopViewToggle,
    start, stop,
  }
}
