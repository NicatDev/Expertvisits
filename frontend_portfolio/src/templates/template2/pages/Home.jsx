'use client';

import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Projects from '../sections/Projects';
import styles from '../styles/template2.module.scss';

export default function Home({ data, user }) {
    return (
        <div className={styles.template2}>
            <Navbar data={data} user={user} />
            <main className={styles.main}>
                <Hero data={data} user={user} />
                <About data={data} user={user} />
                <Projects data={data} user={user} />
            </main>
            <Footer data={data} user={user} />
        </div>
    );
}
