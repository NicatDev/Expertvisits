"use client";
import React from 'react';
import { X } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, type }) {
    if (!isOpen) return null;
    
    const renderContent = () => {
        if (type === 'privacy') {
            return (
                <>
                    <h3 style={{marginBottom:'16px', fontSize:'24px', fontWeight:'700'}}>Privacy Policy</h3>
                    <p style={{marginBottom:'16px'}}>Last updated: {new Date().toLocaleDateString()}</p>
                    <p style={{marginBottom:'16px'}}>Welcome to Expert Visits. We are committed to protecting your personal information and your right to privacy.</p>
                    <p style={{marginBottom:'16px'}}><strong>Important Disclaimer:</strong> The platform owner is not responsible for any lost data, account issues, server downtimes, or information leaks. Use this platform at your own risk.</p>
                    <p>Users are entirely responsible for all the content they generate, write, post, and share on this platform. We reserve the right to remove any content without prior notice if it violates our terms or local laws. We take no responsibility for any user-generated content or its accuracy.</p>
                </>
            );
        } else {
            return (
                <>
                    <h3 style={{marginBottom:'16px', fontSize:'24px', fontWeight:'700'}}>Terms of Service</h3>
                    <p style={{marginBottom:'16px'}}>Last updated: {new Date().toLocaleDateString()}</p>
                    <p style={{marginBottom:'16px'}}>By accessing and using Expert Visits, you agree to the following terms and conditions.</p>
                    <p style={{marginBottom:'16px'}}><strong>Disclaimer & Liability:</strong> We provide this platform "as is". The creator and owner of Expert Visits assume absolutely no liability for any loss of data, loss of business, data breaches, or any direct or indirect damages resulting from your use of this service.</p>
                    <p>Users are fully responsible for whatever they write and publish. The owner is completely indemnified from any legal consequences resulting from user actions. Any loss of content, account deletion, or lost data is not the responsibility of the owner.</p>
                </>
            );
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: '#fff', padding: '32px', borderRadius: '16px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: 'absolute', top: '16px', right: '16px',
                        background: '#f3f4f6', border: 'none', borderRadius: '50%',
                        padding: '8px', cursor: 'pointer', display: 'flex'
                    }}
                >
                    <X size={20} color="#4b5563" />
                </button>
                <div style={{ color: '#374151', lineHeight: '1.7', fontSize: '1rem' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
