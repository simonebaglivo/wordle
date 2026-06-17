import styles from './StatsModal.module.css'
import type { Stats } from '../hooks/useStats'
import type { GameStatus } from '../lib/types'

interface StatsModalProps {
  open: boolean
  stats: Stats
  status: GameStatus
  target: string
  onClose: () => void
  onNewGame: () => void
}

export function StatsModal({ open, stats, status, target, onClose, onNewGame }: StatsModalProps) {
  if (!open) return null

  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0
  const maxDist = Math.max(...stats.distribution, 1)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="chiudi">
          ×
        </button>
        <h2>Statistiche</h2>
        {status === 'lost' && (
          <p className={styles.reveal}>
            La parola era: <strong>{target}</strong>
          </p>
        )}
        <div className={styles.grid}>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.played}</div>
            <div className={styles.label}>Giocate</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{winPct}%</div>
            <div className={styles.label}>Vittorie</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.currentStreak}</div>
            <div className={styles.label}>Streak</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.maxStreak}</div>
            <div className={styles.label}>Streak max</div>
          </div>
        </div>
        <h3>Distribuzione tentativi</h3>
        <div className={styles.distribution}>
          {stats.distribution.map((count, i) => (
            <div key={i} className={styles.distRow}>
              <span className={styles.distIndex}>{i + 1}</span>
              <div className={styles.distBar} style={{ width: `${(count / maxDist) * 100}%` }}>
                {count}
              </div>
            </div>
          ))}
        </div>
        <button className={styles.newGame} onClick={onNewGame}>
          Nuova parola
        </button>
      </div>
    </div>
  )
}
