export const DISCIPLINE_NAMES = {
  'HE': 'Heren Enkel',
  'HD': 'Heren Dubbel',
  'DE': 'Dames Enkel',
  'DD': 'Dames Dubbel',
  'GD': 'Gemengd Dubbel'
}

export function useMatchActions (props, matches, saveCacheMatches, playText, setError) {
  const getDisciplineName = (disciplineId) => {
    return DISCIPLINE_NAMES[disciplineId] || disciplineId
  }

  const getDisciplineClass = (disciplineId) => {
    return `discipline-${String(disciplineId || '').toLowerCase()}`
  }

  const assignCourt = (match, courtNumber) => {
    match.court = courtNumber
    match.callCount = 1
    saveCacheMatches()

    // Generate announcement using template
    const discipline = DISCIPLINE_NAMES[match.teamA.discipline] || match.teamA.discipline || 'Onbekend'
    const level = match.teamA.levelLabel ? `${match.teamA.levelLabel}` : ''
    const teamANames = match.teamA.names.length > 0 ? match.teamA.names.join(' en ') : 'Team A'
    const teamBNames = match.teamB.names.length > 0 ? match.teamB.names.join(' en ') : 'Team B'

    // Replace template variables
    const text = props.announcementTemplate
      .replace(/{court}/g, match.court)
      .replace(/{discipline}/g, discipline)
      .replace(/{level}/g, level)
      .replace(/{teamA}/g, teamANames)
      .replace(/{teamB}/g, teamBNames)

    playText(text, (errorMsg) => {
      setError(errorMsg)
      setTimeout(() => {
        setError('')
      }, 3000)
    })
  }

  const playMatchAanvangen = (match) => {
    if (!match.court) return

    const announcementText = props.aanvangenTemplate.replace(/{court}/g, match.court)

    playText(announcementText, (errorMsg) => {
      setError(errorMsg)
      setTimeout(() => {
        setError('')
      }, 3000)
    })
  }

  const playTeamRecall = (match, team) => {
    if (!match.court) return

    if (!match.callCount) {
      match.callCount = 0
    }
    match.callCount++

    // Save to cache after incrementing callCount
    saveCacheMatches()

    const teamNames = team === 'A' ? match.teamA.names : match.teamB.names
    const teamNamesText = teamNames.length > 0 ? teamNames.join(' en ') : (team === 'A' ? 'Team A' : 'Team B')

    // Convert number to Dutch ordinal
    const ordinals = {
      2: 'tweede',
      3: 'derde',
      4: 'vierde',
    }
    const callCountText = ordinals[match.callCount] || `${match.callCount}de`

    // Replace template variables
    const announcementText = props.recallTemplate
      .replace(/{callCount}/g, callCountText)
      .replace(/{court}/g, match.court)
      .replace(/{teamNames}/g, teamNamesText)

    playText(announcementText, (errorMsg) => {
      setError(errorMsg)
      setTimeout(() => {
        setError('')
      }, 3000)
    })
  }

  return {
    getDisciplineName,
    getDisciplineClass,
    assignCourt,
    playMatchAanvangen,
    playTeamRecall
  }
}
