import styles from './InfoPanel.module.css';

interface InfoPanelProps {
  placeLine?: string;
}

export function InfoPanel({ placeLine }: InfoPanelProps) {
  if (!placeLine) {
    return null;
  }

  return (
    <p className={styles.line} role="status">
      {placeLine}
    </p>
  );
}
