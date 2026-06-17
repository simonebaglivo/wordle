import { describe, it, expect } from 'vitest'
import { evaluateGuess } from './evaluate'

describe('evaluateGuess', () => {
  it('parola esatta: tutte correct', () => {
    expect(evaluateGuess('mela', 'mela')).toEqual([
      'correct', 'correct', 'correct', 'correct',
    ])
  })

  it('nessuna lettera in comune: tutte absent', () => {
    expect(evaluateGuess('funi', 'mela')).toEqual([
      'absent', 'absent', 'absent', 'absent',
    ])
  })

  it('lettera presente in posizione sbagliata: present', () => {
    // 'a' e 'e' presenti ma fuori posto, 'l' corretta
    expect(evaluateGuess('aole', 'mela')).toEqual([
      'present', 'absent', 'correct', 'present',
    ])
  })

  it('duplicati: il verde consuma l\'occorrenza, l\'eccesso resta absent', () => {
    // target 'pera' ha una sola 'e' e una sola 'r'
    // guess 'erre': e(0) present, r(1) absent (la r è consumata dal verde in 2), r(2) correct, e(3) absent
    expect(evaluateGuess('erre', 'pera')).toEqual([
      'present', 'absent', 'correct', 'absent',
    ])
  })

  it('duplicati: i gialli si assegnano da sinistra finché ci sono occorrenze', () => {
    // target 'salsa' ha due 's': guess 'sssss' → correct in 0 e 3, le altre absent
    expect(evaluateGuess('sssss', 'salsa')).toEqual([
      'correct', 'absent', 'absent', 'correct', 'absent',
    ])
  })

  it('giallo prima del verde della stessa lettera', () => {
    // target 'mela', guess 'elma':
    // e(0) present (la 'e' è in target a indice 1)
    // l(1) present (la 'l' è in target a indice 2)
    // m(2) present (la 'm' è in target a indice 0)
    // a(3) correct
    expect(evaluateGuess('elma', 'mela')).toEqual([
      'present', 'present', 'present', 'correct',
    ])
  })
})
