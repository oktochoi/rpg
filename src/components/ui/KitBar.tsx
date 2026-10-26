import styles from './ui-kit.module.css';

type KitBarKind = 'hp' | 'mp' | 'boss' | 'exp';

const FILL_CLASS: Record<KitBarKind, string> = {
  hp: styles.hpFill,
  mp: styles.mpFill,
  boss: styles.bossFill,
  exp: styles.expFill,
};

interface KitBarProps {
  kind: KitBarKind;
  ratio: number;
  label?: string;
}

export function KitBar({ kind, ratio, label }: KitBarProps) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div
      className={`${styles.bar} ${styles[kind]}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div className={styles.barClip} style={{ width: `calc((100% - 12px) * ${clamped})` }}>
        <div className={`${styles.barFill} ${FILL_CLASS[kind]}`} />
      </div>
    </div>
  );
}
