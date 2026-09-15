import React from "react";

const ImageLightboxModal = ({ selectedImage, onClose }) => {
  if (!selectedImage) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s]"
    >
      <div className="relative max-w-2xl max-h-[90vh]">
        <img
          src={selectedImage}
          alt="Zoom"
          className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ImageLightboxModal;
