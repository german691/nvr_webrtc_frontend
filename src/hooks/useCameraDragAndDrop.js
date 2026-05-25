import { useState, useEffect } from "react";

/**
 * Hook de React para manejar la funcionalidad de drag-and-drop (arrastre y reordenamiento) de las cámaras.
 *
 * @param {Array} stableActiveCameras - Lista estable de cámaras activas desde Redux.
 * @returns {object} Estados y controladores de arrastre y reordenamiento.
 */
export const useCameraDragAndDrop = (stableActiveCameras) => {
  const [orderedCameras, setOrderedCameras] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggableCameraId, setDraggableCameraId] = useState(null);

  // Sincronizar orderedCameras cuando cambia la lista de cámaras activas
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderedCameras((prev) => {
        // 1. Conservamos las que siguen activas en el orden que ya tenían
        const stillActive = prev.filter((prevCam) =>
          stableActiveCameras.some((actCam) => actCam.dev === prevCam.dev),
        );

        // 2. Agregamos las nuevas cámaras que se acaban de encender
        const newActive = stableActiveCameras.filter(
          (actCam) => !prev.some((prevCam) => prevCam.dev === actCam.dev),
        );

        return [...stillActive, ...newActive];
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [stableActiveCameras]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setOrderedCameras((prev) => {
      const result = [...prev];
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(index, 0, removed);
      return result;
    });
    setDraggedIndex(index); // Mantiene las transiciones fluidas de arrastre
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggableCameraId(null);
  };

  return {
    orderedCameras,
    draggedIndex,
    draggableCameraId,
    setDraggableCameraId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};

export default useCameraDragAndDrop;
