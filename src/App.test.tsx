import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('con timer reali', () => {
    it('parola non in dizionario: toast di errore, nessuna riga consumata', async () => {
      const user = userEvent.setup()
      render(<App initialTarget="mela" />)

      await user.keyboard('zzqx{Enter}')
      expect(screen.getByRole('alert')).toHaveTextContent('Parola non trovata')
    })

    it('la tastiera virtuale inserisce lettere nella griglia', async () => {
      const user = userEvent.setup()
      render(<App initialTarget="mela" />)

      await user.click(screen.getByRole('button', { name: 'p' }))
      const tiles = screen.getAllByTestId('tile')
      expect(tiles[0]).toHaveTextContent('p')
    })

    it('due submit identici di una parola non valida rimostrano l\'errore', async () => {
      const user = userEvent.setup()
      render(<App initialTarget="mela" />)

      await user.keyboard('zzqx{Enter}')
      expect(screen.getByRole('alert')).toHaveTextContent('Parola non trovata')

      // senza modificare l'input, un secondo invio deve riproporre l'errore
      await user.keyboard('{Enter}')
      expect(screen.getByRole('alert')).toHaveTextContent('Parola non trovata')
    })
  })

  describe('con timer finti (apertura modale a fine partita)', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('partita vinta con la tastiera fisica: modale con statistiche aggiornate', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<App initialTarget="mela" />)

      await user.keyboard('mela{Enter}')

      // il modale si apre dopo che l'animazione di flip si è conclusa:
      // lunghezza*250 + 500 + 250. Per "mela" (4 lettere) = 1750ms.
      await act(async () => {
        vi.advanceTimersByTime(1750)
      })
      expect(screen.getByText('Statistiche')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })
})
