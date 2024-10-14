import Head from 'next/head';
import Main from '../components/Map/Main';
import '../app/globals.css';
import Register from '@/components/supaauth/register';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Unitive</title>
        <meta name="description" content="Interactive Google Map with Next.js" />
      </Head>
      <Register/>
      <Main />
    </div>
  );
}
