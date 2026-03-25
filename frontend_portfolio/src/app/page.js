import { redirect } from 'next/navigation';

export default function HomePage() {
    // Root page – redirect or show a landing page
    // For now, show a simple landing
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Expert Visits Portfolio</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                Visit <code>/username</code> to see a portfolio
            </p>
        </div>
    );
}
