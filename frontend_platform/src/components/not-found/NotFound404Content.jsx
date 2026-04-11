import Link from 'next/link';
import NotFoundGame from './NotFoundGame';

export default function NotFound404Content() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: 'system-ui, sans-serif',
        color: '#333',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>404</h1>
      <p style={{ marginBottom: '16px', textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
        Səhifə tapılmadı · Page not found · Страница не найдена
      </p>
      <NotFoundGame />
      <p style={{ marginBottom: '24px', fontSize: '13px', color: '#64748b' }}>
        Space / klik — tullan; maneələrdən qaç, dollar topla.
      </p>
      <Link
        href="/az"
        style={{
          color: '#1890ff',
          textDecoration: 'underline',
          fontWeight: 600,
        }}
      >
        Ana səhifə / Home
      </Link>
    </div>
  );
}
