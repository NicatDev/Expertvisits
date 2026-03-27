"use client";
import React from 'react';

export default function Loading() {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px',
            padding: '40px'
        }}>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #f3f3f3', 
                borderTop: '3px solid #333', 
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
