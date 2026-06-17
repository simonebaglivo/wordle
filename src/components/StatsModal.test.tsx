import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsModal } from './StatsModal'
import type { Stats } from '../hooks/useStats'

const stats: Stats = {
  played: 10,
  won: 7,
  currentStreak: 2,
  maxStreak: 5,
  distribution: [0, 1, 3, 2, 1, 0],
}

describe('StatsModal', () => {
  it('non rende nulla se open è false', () => {
    render(
      <StatsModal open={false} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.queryByText('Statistiche')).not.toBeInTheDocument()
  })

  it('mostra le statistiche principali', () => {
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.getByText('Statistiche')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // giocate
    expect(screen.getByText('70%')).toBeInTheDocument() // vittorie
  })

  it('in caso di sconfitta rivela la parola', () => {
    render(
      <StatsModal open={true} stats={stats} status="lost" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.getByText(/mela/i)).toBeInTheDocument()
  })

  it('in caso di vittoria non rivela la parola', () => {
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.queryByText(/la parola era/i)).not.toBeInTheDocument()
  })

  it('"Nuova parola" chiama onNewGame', async () => {
    const onNewGame = vi.fn()
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={onNewGame} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /nuova parola/i }))
    expect(onNewGame).toHaveBeenCalled()
  })
})
