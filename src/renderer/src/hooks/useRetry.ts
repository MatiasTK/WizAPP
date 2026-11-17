import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'

/**
 * "Retry" for an offline bulb: busy while the probe runs, and `stillOffline` when it ended
 * without an answer (the store marks the bulb `online: false` again; no toast says so).
 */
export const useRetry = (ip: string) => {
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const [retrying, setRetrying] = useState(false)
  const [stillOffline, setStillOffline] = useState(false)

  const retry = async () => {
    setRetrying(true)
    setStillOffline(false)
    await probeBulb(ip)
    setRetrying(false)
    setStillOffline(!useBulbStore.getState().bulbs.find((b) => b.ip === ip)?.online)
  }

  return { retrying, stillOffline, retry }
}
