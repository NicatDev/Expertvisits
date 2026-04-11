import NotFound404Content from '@/components/not-found/NotFound404Content';

export const metadata = {
  title: '404 | Expert Visits',
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFound404Content />;
}
