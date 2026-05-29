import { useEffect, useState } from 'react'

export function useCurrentTime(intervalMs = 1000): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [intervalMs])

  return currentTime
}
