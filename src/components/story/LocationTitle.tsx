import { useEffect, useState } from 'react';
import styles from './LocationTitle.module.css';

interface LocationTitleProps {
  locationId: string;
  locationName: string;
}

export function LocationTitle({ locationId, locationName }: LocationTitleProps) {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState(locationName);

  useEffect(() => {
    setLabel(locationName);
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 1000);
    return () => window.clearTimeout(hide);
  }, [locationId, locationName]);

  return (
    <div className={`${styles.title} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      {label}
    </div>
  );
}
