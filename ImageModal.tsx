import React from 'react';
import { XCircleIcon } from './Icons';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-4xl max-h-full" 
        onClick={handleContentClick}
      >
        <img
          src={imageUrl}
          alt="Enlarged view"
          className="object-contain max-w-full max-h-[90vh] rounded-lg shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white transition-transform hover:scale-110"
          aria-label="Close image view"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default ImageModal;