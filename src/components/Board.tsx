import styles from './Board.module.css'
import { Row } from './Row'
import { MAX_GUESSES } from '../hooks/useGame'
import type { LetterState } from '../lib/types'

interface BoardProps {
  wordLength: number
  guesses: string[]
  evaluations: LetterState[][]
  current: string
  shakeCurrent: boolean
}

export function Board({
  wordLength,
  guesses,
  evaluations,
  current,
  shakeCurrent,
}: BoardProps) {
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) {
      return (
        <Row key={i} length={wordLength} guess={guesses[i]} evaluation={evaluations[i]} />
      )
    }
    if (i === guesses.length) {
      return <Row key={i} length={wordLength} guess={current} shake={shakeCurrent} />
    }
    return <Row key={i} length={wordLength} guess="" />
  })

  return <div className={styles.board}>{rows}</div>
}
