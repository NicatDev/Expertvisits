import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Shield, FileText, HelpCircle } from 'lucide-react';
import styles from './style.module.scss';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* Brand / About */}
                <div className={styles.column}>
                    <h4>Expert Visits</h4>
                    <p>Connecting professionals with opportunities worldwide. Share your expertise, take quizzes, and grow.</p>
                </div>

                {/* Legal */}
                <div className={styles.column}>
                    <h4>Legal</h4>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/cookies">Cookie Policy</Link>
                    <Link href="/security"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} /> Security</span></Link>
                </div>

                {/* Support */}
                <div className={styles.column}>
                    <h4>Support</h4>
                    <Link href="/help"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> Help Center</span></Link>
                    <Link href="/contact">Contact Us</Link>
                    <Link href="/faq">FAQ</Link>
                </div>

                {/* Connect */}
                <div className={styles.column}>
                    <h4>Stay Connected</h4>
                    <Link href="/blog">Blog</Link>
                    <Link href="/newsletter">Newsletter</Link>
                </div>
            </div>

            <div className={styles.bottomBar}>
                <div>
                    &copy; {new Date().getFullYear()} Expert Visits. All rights reserved.
                </div>
                <div className={styles.socials}>
                    <a href="#"><Facebook size={20} /></a>
                    <a href="#"><Twitter size={20} /></a>
                    <a href="#"><Linkedin size={20} /></a>
                    <a href="#"><Instagram size={20} /></a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
