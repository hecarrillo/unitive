import Head from 'next/head';
import MapWithOverlay from '../components/Map/MapWithOverlay';
import '../app/globals.css';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Unitive</title>
        <meta name="description" content="Interactive Google Map with Next.js" />
      </Head>

      <MapWithOverlay />
    </div>
  );
}
