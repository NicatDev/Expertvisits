"use client";
import React from 'react';
import { X } from 'lucide-react';
import styles from './style.module.scss';

export default function LegalModal({ isOpen, onClose, type }) {
    if (!isOpen) return null;
    
    const renderContent = () => {
        if (type === 'privacy') {
            return (
                <>
                    <h3>Privacy Policy</h3>
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>Welcome to Expert Visits. We are committed to protecting your personal information and your right to privacy.</p>
                    <p><strong>Important Disclaimer:</strong> The platform owner is not responsible for any lost data, account issues, server downtimes, or information leaks. Use this platform at your own risk.</p>
                    <p>Users are entirely responsible for all the content they generate, write, post, and share on this platform. We reserve the right to remove any content without prior notice if it violates our terms or local laws. We take no responsibility for any user-generated content or its accuracy.</p>
                </>
            );
        } else {
            return (
                <>
                    <h3>Terms of Service</h3>
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>By accessing and using Expert Visits, you agree to the following terms and conditions.</p>
                    <p><strong>Disclaimer & Liability:</strong> We provide this platform &quot;as is&quot;. The creator and owner of Expert Visits assume absolutely no liability for any loss of data, loss of business, data breaches, or any direct or indirect damages resulting from your use of this service.</p>
                    <p>Users are fully responsible for whatever they write and publish. The owner is completely indemnified from any legal consequences resulting from user actions. Any loss of content, account deletion, or lost data is not the responsibility of the owner.</p>
                </>
            );
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.card} onClick={e => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onClose}
                    className={styles.closeBtn}
                    aria-label="Close"
                >
                    <X size={20} color="#4b5563" />
                </button>
                <div className={styles.prose}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
