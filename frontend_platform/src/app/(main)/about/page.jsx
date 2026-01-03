import React from 'react';

export default function AboutPage() {
    return (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px' }}>
            <h1>About Octopus</h1>
            <p style={{ marginTop: '16px', fontSize: '16px', lineHeight: '1.6' }}>
                Octopus is a professional identity and collaboration ecosystem designed to help you build your digital presence,
                connect with experts, and grow your career.
            </p>

            <div style={{ marginTop: '32px' }}>
                <h2>Our Mission</h2>
                <p>To empower professionals worldwide with the tools they need to succeed in the digital economy.</p>
            </div>

            <div style={{ marginTop: '32px' }}>
                <h2>Features</h2>
                <ul>
                    <li>Professional Profile & CV Generation</li>
                    <li>Content Publishing (Articles, Quizzes, Surveys)</li>
                    <li>Company & Vacancy Management</li>
                    <li>Service Booking System</li>
                    <li>Personal Website Builder</li>
                </ul>
            </div>
        </div>
    );
}
