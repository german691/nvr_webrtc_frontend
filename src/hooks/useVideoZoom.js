import { useState, useRef } from "react";

/**
 * Hook de React para manejar la funcionalidad de zoom (escala) y paneo (arrastre) de un video.
 *
 * @returns {object} Estados y controladores de zoom/paneo.
 */
export const useVideoZoom = () => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.2;
    setScale((prev) => {
      const delta = e.deltaY < 0 ? zoomSensitivity : -zoomSensitivity;
      const newScale = Math.min(Math.max(prev + delta, 1), 4);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return {
    scale,
    position,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};

export default useVideoZoom;
