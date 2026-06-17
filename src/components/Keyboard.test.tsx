import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keyboard } from './Keyboard'
import type { LetterState } from '../lib/types'

function renderKeyboard(keyStates = new Map<string, LetterState>()) {
  const onLetter = vi.fn()
  const onEnter = vi.fn()
  const onBackspace = vi.fn()
  render(
    <Keyboard
      keyStates={keyStates}
      onLetter={onLetter}
      onEnter={onEnter}
      onBackspace={onBackspace}
    />,
  )
  return { onLetter, onEnter, onBackspace }
}

describe('Keyboard', () => {
  it('click su una lettera chiama onLetter', async () => {
    const { onLetter } = renderKeyboard()
    await userEvent.click(screen.getByRole('button', { name: 'q' }))
    expect(onLetter).toHaveBeenCalledWith('q')
  })

  it('click su Invio e Backspace chiamano i rispettivi handler', async () => {
    const { onEnter, onBackspace } = renderKeyboard()
    await userEvent.click(screen.getByRole('button', { name: 'invio' }))
    expect(onEnter).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'cancella' }))
    expect(onBackspace).toHaveBeenCalled()
  })

  it('colora i tasti secondo keyStates', () => {
    renderKeyboard(new Map([['a', 'correct'], ['s', 'absent']]))
    expect(screen.getByRole('button', { name: 'a' })).toHaveAttribute('data-state', 'correct')
    expect(screen.getByRole('button', { name: 's' })).toHaveAttribute('data-state', 'absent')
    expect(screen.getByRole('button', { name: 'd' })).not.toHaveAttribute('data-state')
  })
})
