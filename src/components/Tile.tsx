import styles from './Tile.module.css'
import type { LetterState } from '../lib/types'

interface TileProps {
  letter: string
  state?: LetterState // undefined = non ancora valutata
  revealDelay?: number // ms
}

export function Tile({ letter, state, revealDelay = 0 }: TileProps) {
  const classNames = [styles.tile]
  if (state) classNames.push(styles.revealed, styles[state])
  else if (letter) classNames.push(styles.filled)

  return (
    <div
      data-testid="tile"
      data-state={state}
      className={classNames.join(' ')}
      style={state ? { animationDelay: `${revealDelay}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
