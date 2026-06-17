import styles from './Keyboard.module.css'
import type { LetterState } from '../lib/types'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

interface KeyboardProps {
  keyStates: Map<string, LetterState>
  onLetter: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
}

export function Keyboard({ keyStates, onLetter, onEnter, onBackspace }: KeyboardProps) {
  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, rowIndex) => (
        <div key={row} className={styles.krow}>
          {rowIndex === 2 && (
            <button className={`${styles.key} ${styles.wide}`} onClick={onEnter}>
              invio
            </button>
          )}
          {[...row].map((letter) => {
            const state = keyStates.get(letter)
            return (
              <button
                key={letter}
                data-state={state}
                className={state ? `${styles.key} ${styles[state]}` : styles.key}
                onClick={() => onLetter(letter)}
              >
                {letter}
              </button>
            )
          })}
          {rowIndex === 2 && (
            <button
              className={`${styles.key} ${styles.wide}`}
              onClick={onBackspace}
              aria-label="cancella"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
