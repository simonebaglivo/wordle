import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Senza globals: true, Vitest non esegue il cleanup automatico di Testing
// Library tra un test e l'altro: i render si accumulerebbero nello stesso
// document, facendo vedere a getAllBy* anche i nodi dei test precedenti.
afterEach(() => {
  cleanup()
})
