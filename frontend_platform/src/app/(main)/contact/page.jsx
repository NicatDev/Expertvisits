"use client";
import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            alert('Message sent!');
        }, 1000);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '8px' }}>
            <h1>Contact Us</h1>
            <p style={{ marginBottom: '24px', color: '#666' }}>Have questions? We'd love to hear from you.</p>

            <form onSubmit={handleSubmit}>
                <Input label="Name" placeholder="Your Name" required />
                <Input label="Email" type="email" placeholder="your@email.com" required />
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
                    <textarea
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            minHeight: '120px',
                            fontFamily: 'inherit'
                        }}
                        required
                    />
                </div>
                <Button type="primary" block htmlType="submit" loading={loading}>Send Message</Button>
            </form>
        </div>
    );
}
