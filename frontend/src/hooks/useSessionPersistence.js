import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const STORAGE_PREFIX = 'bbp_session_'

function storageKey(folderName) {
  return `${STORAGE_PREFIX}${folderName}`
}

/**
 * Saves decisions to localStorage whenever they change.
 * Restores saved decisions once loading is complete.
 *
 * Stored format: { [filename]: 'keep' | 'maybe' | 'reject' | null }
 */
export function useSessionPersistence(loadingComplete) {
  const photos = useStore(state => state.photos)
  const sourceDir = useStore(state => state.sourceDir)
  const makeDecision = useStore(state => state.makeDecision)

  const restoredRef = useRef(false)

  // Restore saved decisions after load completes (run once per session)
  useEffect(() => {
    if (!loadingComplete || restoredRef.current || !sourceDir) return
    restoredRef.current = true

    const key = storageKey(sourceDir.name)
    let saved
    try {
      saved = JSON.parse(localStorage.getItem(key))
    } catch {
      return
    }
    if (!saved || typeof saved !== 'object') return

    const currentPhotos = useStore.getState().photos
    let restored = 0
    for (const [filename, decision] of Object.entries(saved)) {
      if (decision && currentPhotos[filename] && !currentPhotos[filename].decision) {
        makeDecision(filename, decision)
        restored++
      }
    }
    if (restored > 0) {
      console.info(`[BBP] Restored ${restored} decisions from previous session`)
    }
  }, [loadingComplete, sourceDir, makeDecision])

  // Persist decisions to localStorage whenever photos change
  useEffect(() => {
    if (!sourceDir) return
    const decisions = {}
    let hasAny = false
    for (const [id, photo] of Object.entries(photos)) {
      if (photo.decision) {
        decisions[id] = photo.decision
        hasAny = true
      }
    }
    if (!hasAny) return

    const key = storageKey(sourceDir.name)
    try {
      localStorage.setItem(key, JSON.stringify(decisions))
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [photos, sourceDir])

  // Clear saved session for the current folder
  const clearSession = () => {
    if (!sourceDir) return
    localStorage.removeItem(storageKey(sourceDir.name))
  }

  return { clearSession }
}
