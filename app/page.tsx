import Head from 'next/head';
import MapWithOverlay from '../components/Map/MapWithOverlay';
import '../app/globals.css';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Google Maps in Next.js</title>
        <meta name="description" content="Interactive Google Map with Next.js" />
      </Head>

      <h1>My Google Map</h1>
      <MapWithOverlay />
    </div>
  );
}
