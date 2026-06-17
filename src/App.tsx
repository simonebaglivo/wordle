import { useEffect, useState } from 'react'
import { useGame } from './hooks/useGame'
import { useStats } from './hooks/useStats'
import { Header } from './components/Header'
import { Board } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { StatsModal } from './components/StatsModal'

interface AppProps {
  initialTarget?: string // solo per i test
}

export default function App({ initialTarget }: AppProps) {
  const game = useGame(initialTarget)
  const { stats, recordGame } = useStats()
  const [showStats, setShowStats] = useState(false)
  const [shake, setShake] = useState(false)

  const { status, guesses, error, errorEvent, addLetter, removeLetter, submitGuess } =
    game

  // input da tastiera fisica (ignorato mentre il modale è aperto)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showStats) return
      if (e.key === 'Enter') submitGuess()
      else if (e.key === 'Backspace') removeLetter()
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [submitGuess, removeLetter, addLetter, showStats])

  // shake + auto-dismiss del toast a ogni errore. Dipende da errorEvent (non
  // dal solo messaggio) così due submit identici di fila rifanno comunque lo
  // shake: errorEvent cambia identità anche quando il messaggio è lo stesso.
  useEffect(() => {
    if (!errorEvent) return
    setShake(true)
    const shakeTimer = setTimeout(() => setShake(false), 500)
    const dismissTimer = setTimeout(() => game.clearError(), 2000)
    return () => {
      clearTimeout(shakeTimer)
      clearTimeout(dismissTimer)
    }
  }, [errorEvent])

  // fine partita: registra le statistiche e apri il modale dopo che
  // l'animazione di flip dell'ultima riga si è conclusa.
  useEffect(() => {
    if (status === 'playing') return
    recordGame(status === 'won', guesses.length)
    const flipDuration = game.target.length * 250 + 500
    const t = setTimeout(() => setShowStats(true), flipDuration + 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function handleNewGame() {
    setShowStats(false)
    game.newGame()
  }

  return (
    <div className="app">
      <Header onShowStats={() => setShowStats(true)} />
      <Toast message={error} />
      <Board
        wordLength={game.target.length}
        guesses={guesses}
        evaluations={game.evaluations}
        current={game.current}
        shakeCurrent={shake}
      />
      <Keyboard
        keyStates={game.keyStates}
        onLetter={addLetter}
        onEnter={submitGuess}
        onBackspace={removeLetter}
      />
      <StatsModal
        open={showStats}
        stats={stats}
        status={status}
        target={game.target}
        onClose={() => setShowStats(false)}
        onNewGame={handleNewGame}
      />
    </div>
  )
}
