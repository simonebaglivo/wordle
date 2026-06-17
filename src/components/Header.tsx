import styles from './Header.module.css'

interface HeaderProps {
  onShowStats: () => void
}

export function Header({ onShowStats }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Parole</h1>
      <button className={styles.statsButton} onClick={onShowStats} aria-label="statistiche">
        📊
      </button>
    </header>
  )
}
