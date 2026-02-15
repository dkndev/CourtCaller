import { ref, watch } from 'vue'

const CACHE_KEY = 'courtcaller_matches_cache'

export function useMatches (props, emit) {
  const matchUrl = ref(props.scrapeUrl || '')
  const matches = ref([])
  const error = ref('')
  const successMessage = ref('')

  // Load cached matches on component mount
  const loadCachedMatches = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        matches.value = data.matches || []
        matchUrl.value = data.url || matchUrl.value
        if (matches.value.length > 0) {
          successMessage.value = `${matches.value.length} wedstrijden geladen uit cache`
          setTimeout(() => {
            successMessage.value = ''
          }, 3000)
        }
      }
    } catch (err) {
      console.error('Failed to load cached matches:', err)
    }
  }

  // Save matches to cache
  const saveCacheMatches = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        matches: matches.value,
        url: matchUrl.value,
        timestamp: new Date().toISOString()
      }))
    } catch (err) {
      console.error('Failed to save matches to cache:', err)
    }
  }

  // Watch for scrapeUrl prop changes
  watch(
    () => props.scrapeUrl,
    (val) => {
      matchUrl.value = val || ''
    },
    {immediate: true}
  )

  const fetchMatches = async () => {
    if (!matchUrl.value.trim()) return

    emit('update:isLoading', true)
    error.value = ''
    successMessage.value = ''

    try {
      const response = await fetch(`${props.apiBaseUrl}/api/scrape-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: matchUrl.value
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      const newMatches = data.matches || []

      // Preserve court assignments from existing matches
      const oldMatches = matches.value
      const mergedMatches = newMatches.map(newMatch => {
        // Try to find existing match with same ID or similar properties
        const existingMatch = oldMatches.find(oldMatch =>
          oldMatch.id === newMatch.id ||
          (oldMatch.time === newMatch.time &&
            oldMatch.teamA.names[0] === newMatch.teamA.names[0])
        )

        // If found and has manually assigned court, preserve it
        // Otherwise use the court from the server (newMatch.court)
        if (existingMatch && existingMatch.court) {
          return {...newMatch, court: existingMatch.court, callCount: existingMatch.callCount || 1}
        }

        // New match or no previous court assignment - use server's court if available
        return {...newMatch, callCount: newMatch.court ? 1 : 0}
      })

      matches.value = mergedMatches
      saveCacheMatches()
      successMessage.value = `${matches.value.length} wedstrijden geladen!`
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (err) {
      console.error('Fetch matches error:', err)
      error.value = `Fout: ${err.message}`
    } finally {
      emit('update:isLoading', false)
    }
  }

  // Load cached data on initialization
  loadCachedMatches()

  return {
    matchUrl,
    matches,
    error,
    successMessage,
    fetchMatches,
    saveCacheMatches
  }
}
