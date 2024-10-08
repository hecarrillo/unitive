"use client";

import { FC } from 'react';
import Map from './MapLayout';

const Main: FC = () => {  
  return (
    <div className="relative h-screen w-full">
      {/* Map Component */}
      <main className="h-full w-full">
        <Map/>
      </main>
    </div>
  );
};

export default Main;