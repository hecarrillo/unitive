// components/Map/NumberedMarker.tsx
import React from 'react';

interface NumberedMarkerProps {
  number: number;
  selected?: boolean;
  onClick?: () => void;
}

const NumberedMarker: React.FC<NumberedMarkerProps> = ({ number, selected, onClick }) => {
  return (
    <div
      className={`
        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
        ${selected ? 'bg-red-500' : 'bg-green-600'}
        border-2 border-white shadow-lg cursor-pointer
        transition-all duration-200 hover:scale-110
      `}
      onClick={onClick}
    >
      {number < 0 ? 0 : number}
    </div>
  );
};

export default NumberedMarker;