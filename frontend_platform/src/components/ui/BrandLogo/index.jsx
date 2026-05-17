import Image from 'next/image';
import styles from './style.module.scss';

/** Site brand mark — 3:2 aspect (logo.png is 1200×810). */
export default function BrandLogo({ className = '', priority = false }) {
    return (
        <span className={`${styles.wrap} ${className}`.trim()}>
            <Image
                src="/logo.png"
                alt="Expert Visits"
                width={120}
                height={80}
                className={styles.img}
                priority={priority}
                unoptimized
            />
        </span>
    );
}
