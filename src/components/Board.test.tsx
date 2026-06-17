import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Board } from './Board'

describe('Board', () => {
  it('rende 6 righe × lunghezza parola celle', () => {
    render(
      <Board wordLength={4} guesses={[]} evaluations={[]} current="" shakeCurrent={false} />,
    )
    expect(screen.getAllByTestId('tile')).toHaveLength(24)
  })

  it('mostra le lettere dei tentativi inviati e dell\'input corrente', () => {
    render(
      <Board
        wordLength={4}
        guesses={['pera']}
        evaluations={[['absent', 'correct', 'absent', 'correct']]}
        current="me"
        shakeCurrent={false}
      />,
    )
    const tiles = screen.getAllByTestId('tile')
    expect(tiles[0]).toHaveTextContent('p')
    expect(tiles[3]).toHaveTextContent('a')
    expect(tiles[4]).toHaveTextContent('m')
    expect(tiles[5]).toHaveTextContent('e')
  })

  it('applica lo stato di valutazione come data-state', () => {
    render(
      <Board
        wordLength={4}
        guesses={['pera']}
        evaluations={[['absent', 'correct', 'absent', 'correct']]}
        current=""
        shakeCurrent={false}
      />,
    )
    const tiles = screen.getAllByTestId('tile')
    expect(tiles[0]).toHaveAttribute('data-state', 'absent')
    expect(tiles[1]).toHaveAttribute('data-state', 'correct')
  })
})
