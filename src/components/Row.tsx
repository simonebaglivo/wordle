import styles from './Row.module.css'
import { Tile } from './Tile'
import type { LetterState } from '../lib/types'

interface RowProps {
  length: number
  guess: string
  evaluation?: LetterState[]
  shake?: boolean
}

export function Row({ length, guess, evaluation, shake }: RowProps) {
  return (
    <div className={shake ? `${styles.row} ${styles.shake}` : styles.row}>
      {Array.from({ length }, (_, i) => (
        <Tile
          key={i}
          letter={guess[i] ?? ''}
          state={evaluation?.[i]}
          revealDelay={i * 250}
        />
      ))}
    </div>
  )
}
