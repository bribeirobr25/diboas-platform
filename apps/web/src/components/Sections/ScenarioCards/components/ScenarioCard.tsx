'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from '../ScenarioCards.module.css';

interface ScenarioCardProps {
  card: {
    id: string;
    title: string;
    description: string;
    backgroundImage: string;
    imageAlt: string;
  };
}

export function ScenarioCard({ card }: ScenarioCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const handleImageError = useCallback(() => {
    setImgFailed(true);
  }, []);

  return (
    <article className={styles.card} aria-label={card.title}>
      {/* Background image at 30% opacity */}
      {card.backgroundImage && !imgFailed ? (
        <div className={styles.cardBackgroundImage} aria-hidden="true">
          <Image
            src={card.backgroundImage}
            alt={card.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: 'cover', opacity: 1.0 }}
            onError={handleImageError}
          />
        </div>
      ) : null}
      {/* Gradient overlay */}
      <div className={styles.cardBackground} aria-hidden="true" />
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>&ldquo;{card.title}&rdquo;</h3>
        <p className={styles.cardDescription}>{card.description}</p>
      </div>
    </article>
  );
}
