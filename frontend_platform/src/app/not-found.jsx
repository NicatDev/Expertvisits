import NotFound404Content from '@/components/not-found/NotFound404Content';

/** Next.js bu faylı mövcud olmayan URL üçün HTTP 404 ilə qaytarır (Google üçün düzgün). */
export const metadata = {
  title: '404 | Expert Visits',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFound404Content />;
}
