"use client";
import React, { useState, useEffect } from 'react';
import { business } from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';
// import CompanyCard from '@/components/advanced/CompanyCard';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const { data } = await business.getCompanies();
            setCompanies(data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h1>Companies</h1>
                <Button type="primary">Register Company</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {companies.map(company => (
                    <div key={company.id} style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <h3>{company.name}</h3>
                        <p>{company.industry}</p>
                        <Link href={`/business/${company.slug}`}>View Profile</Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
