"use client";
import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", isDangerous = true }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '8px',
                width: '400px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: '#666', marginBottom: '24px' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd',
                            background: '#fff', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            padding: '8px 16px', borderRadius: '4px', border: 'none',
                            background: isDangerous ? '#ff4d4f' : '#1890ff',
                            color: '#fff', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
