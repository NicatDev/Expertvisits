import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#111827' }}>404</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                This company site could not be found.
            </p>
            <Link href="/az" style={{
                color: '#1890ff',
                fontSize: '0.95rem',
                fontWeight: 500,
            }}>
                ← Go back home
            </Link>
        </div>
    );
}
