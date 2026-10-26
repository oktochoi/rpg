import styles from './GameIcon.module.css';

export type GameIconName =
  | 'character'
  | 'bag'
  | 'quest'
  | 'save'
  | 'settings'
  | 'hp'
  | 'mp'
  | 'objective'
  | 'travel'
  | 'training'
  | 'shop'
  | 'inn'
  | 'guild'
  | 'gate'
  | 'village';

interface GameIconProps {
  name: GameIconName;
}

export function GameIcon({ name }: GameIconProps) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      {paths(name)}
    </svg>
  );
}

function paths(name: GameIconName) {
  switch (name) {
    case 'character':
      return (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6.5 19.2c.8-3.2 2.8-4.7 5.5-4.7s4.7 1.5 5.5 4.7" />
        </>
      );
    case 'bag':
      return (
        <>
          <path d="M8 9.5h8l1 9.2H7L8 9.5z" />
          <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" />
        </>
      );
    case 'quest':
      return (
        <>
          <path d="M7 4.5h7.5L18 8v11.5H7z" />
          <path d="M14.2 4.8V8H18" />
          <path d="M9.5 12h5M9.5 15h3.5" />
        </>
      );
    case 'save':
      return (
        <>
          <path d="M6 4.5h9l3 3V19.5H6z" />
          <path d="M8.5 4.5V9h6" />
          <path d="M8.5 19.5v-5h7v5" />
        </>
      );
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="2.4" />
          <path d="M12 4.5v2.2M12 17.3V19.5M4.5 12h2.2M17.3 12H19.5M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6" />
        </>
      );
    case 'hp':
      return <path d="M12 19s-6.2-3.8-6.2-8.1A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.2 2.7C18.2 15.2 12 19 12 19z" />;
    case 'mp':
      return <path d="M12 3.8 16.8 12 12 20.2 7.2 12 12 3.8z" />;
    case 'objective':
      return (
        <>
          <circle cx="12" cy="12" r="6.2" />
          <circle cx="12" cy="12" r="1.6" />
          <path d="M12 3.2V6M12 18v2.8M3.2 12H6M18 12h2.8" />
        </>
      );
    case 'travel':
      return <path d="M5 16.5c2.2-4 4.2-6 7-6s4.8 2 7 6M12 6.2v4.2M9.2 8.2 12 6.2l2.8 2" />;
    case 'training':
      return (
        <>
          <path d="M5 16.5 14.5 7" />
          <path d="M13 5.5 16.2 8.7M4.2 15.2 7.4 18.4" />
          <path d="M15.2 6.4 17.6 4M6.2 17.6 4 19.8" />
        </>
      );
    case 'shop':
      return (
        <>
          <path d="M6.5 9.5h11l-.8 9H7.3z" />
          <path d="M8 9.5 9.2 5.8h5.6L16 9.5" />
        </>
      );
    case 'inn':
      return (
        <>
          <path d="M4.5 18.5V11L12 6.2l7.5 4.8v7.3" />
          <path d="M10 18.5v-4.2h4v4.2" />
        </>
      );
    case 'guild':
      return (
        <>
          <path d="M12 4.2 18.5 7v5.2c0 3.6-2.6 6.2-6.5 7.6-3.9-1.4-6.5-4-6.5-7.6V7L12 4.2z" />
          <path d="M12 8.2v6" />
        </>
      );
    case 'gate':
      return (
        <>
          <path d="M6 19.5V8.5L12 5l6 3.5v11" />
          <path d="M10 19.5v-6h4v6" />
        </>
      );
    case 'village':
      return (
        <>
          <path d="M4.5 18.5V12L9 8.2V18.5M9 18.5V9.2L15.5 5.2v13.3" />
          <path d="M15.5 18.5V11L19.5 13.2V18.5" />
        </>
      );
    default:
      return null;
  }
}
