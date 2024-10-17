import Head from 'next/head';
import Main from '../components/Map/Main';
import '../app/globals.css';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Unitive</title>
        <meta name="description" content="Interactive Google Map with Next.js" />
      </Head>
      <Main />
    </div>
  );
}
