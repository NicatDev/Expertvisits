import Link from 'next/link';
import NotFoundGame from '../NotFoundGame';
import styles from './style.module.scss';

export default function NotFound404Content() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.lead}>
        Səhifə tapılmadı · Page not found · Страница не найдена
      </p>
      <NotFoundGame />
      <p className={styles.hint}>
        Space / klik — tullan; maneələrdən qaç, dollar topla.
      </p>
      <Link href="/az" className={styles.homeLink}>
        Ana səhifə / Home
      </Link>
    </div>
  );
}
