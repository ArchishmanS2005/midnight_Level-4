import { useState, useEffect } from 'react'

interface UseTypewriterOptions {
  speed?: number
  startDelay?: number
}

interface UseTypewriterReturn {
  displayed: string
  done: boolean
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 38, startDelay = 600 } = options
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let index = 0
    let intervalId: NodeJS.Timeout
    let delayId: NodeJS.Timeout

    setDisplayed('')
    setDone(false)

    delayId = setTimeout(() => {
      intervalId = setInterval(() => {
        index++
        if (index <= text.length) {
          setDisplayed(text.slice(0, index))
        } else {
          setDone(true)
          clearInterval(intervalId)
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(delayId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, speed, startDelay])

  return { displayed, done }
}
