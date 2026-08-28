import { useEffect, useRef, useCallback } from 'react'

const PREVENT_DEFAULT_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  ' '
])

export interface GameInputHandlers {
  onKeyDown?: (key: string, e: KeyboardEvent) => void
  onKeyUp?: (key: string, e: KeyboardEvent) => void
}

export function useGameInput(handlers: GameInputHandlers = {}, enabled: boolean = true) {
  const activeKeys = useRef<Set<string>>(new Set())
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    if (PREVENT_DEFAULT_KEYS.has(e.key) || PREVENT_DEFAULT_KEYS.has(e.code)) {
      e.preventDefault()
    }

    activeKeys.current.add(e.key.toLowerCase())
    activeKeys.current.add(e.code.toLowerCase())

    if (handlersRef.current.onKeyDown) {
      handlersRef.current.onKeyDown(e.key, e)
    }
  }, [enabled])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    activeKeys.current.delete(e.key.toLowerCase())
    activeKeys.current.delete(e.code.toLowerCase())

    if (handlersRef.current.onKeyUp) {
      handlersRef.current.onKeyUp(e.key, e)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('keyup', handleKeyUp, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      activeKeys.current.clear()
    }
  }, [enabled, handleKeyDown, handleKeyUp])

  const isPressed = useCallback((key: string): boolean => {
    return activeKeys.current.has(key.toLowerCase())
  }, [])

  return { isPressed }
}
