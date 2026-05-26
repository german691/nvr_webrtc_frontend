import { useState, useEffect } from "react";

/**
 * Hook de React para manejar el redimensionamiento dinámico de las celdas del videowall.
 * Escucha eventos globales del mouse únicamente cuando el usuario arrastra una barra divisoria.
 * 
 * @param {number} count - Cantidad de cámaras activas.
 * @param {string} currentLayout - Identificador del diseño activo.
 * @param {number} cols - Cantidad de columnas de la cuadrícula.
 * @param {number} rows - Cantidad de filas de la cuadrícula.
 * @param {function} getDefaultRatios - Función para consultar ratios por defecto.
 * @param {React.RefObject} containerRef - Referencia al contenedor HTML de la cuadrícula.
 * @returns {object} Ratios, estados y controladores de redimensionamiento.
 */
export const useGridResizing = (
  count,
  currentLayout,
  cols,
  rows,
  getDefaultRatios,
  containerRef
) => {
  const [colRatio, setColRatio] = useState(50);
  const [colRatio2, setColRatio2] = useState(66.66);
  const [rowRatio, setRowRatio] = useState(50);
  const [rowRatio2, setRowRatio2] = useState(66.66);

  const [resizingColIdx, setResizingColIdx] = useState(null);
  const [resizingRowIdx, setResizingRowIdx] = useState(null);

  // Sincronizar ratios cuando cambia el diseño o distribución de columnas/filas
  useEffect(() => {
    const defaults = getDefaultRatios(count, currentLayout);
    const timer = setTimeout(() => {
      setColRatio(defaults.colRatio);
      setColRatio2(defaults.colRatio2);
      setRowRatio(defaults.rowRatio);
      setRowRatio2(defaults.rowRatio2);
    }, 0);
    return () => clearTimeout(timer);
  }, [cols, rows, count, currentLayout, getDefaultRatios]);

  // Escuchar eventos globales de arrastre de mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (resizingColIdx === 1) {
        const clientX = e.clientX;
        const offsetLeft = clientX - rect.left;
        const percentage = (offsetLeft / rect.width) * 100;
        // Límite: entre 15% y colRatio2 - 15% (si hay 3 columnas) o 85% (si hay 2 columnas)
        const maxVal = cols === 3 ? colRatio2 - 15 : 85;
        setColRatio(Math.min(Math.max(percentage, 15), maxVal));
      } else if (resizingColIdx === 2) {
        const clientX = e.clientX;
        const offsetLeft = clientX - rect.left;
        const percentage = (offsetLeft / rect.width) * 100;
        // Límite: entre colRatio + 15% y 85%
        setColRatio2(Math.min(Math.max(percentage, colRatio + 15), 85));
      }

      if (resizingRowIdx === 1) {
        const clientY = e.clientY;
        const offsetTop = clientY - rect.top;
        const percentage = (offsetTop / rect.height) * 100;
        // Límite: entre 15% y rowRatio2 - 15% (si hay 3 filas) o 85% (si hay 2 filas)
        const maxVal = rows === 3 ? rowRatio2 - 15 : 85;
        setRowRatio(Math.min(Math.max(percentage, 15), maxVal));
      } else if (resizingRowIdx === 2) {
        const clientY = e.clientY;
        const offsetTop = clientY - rect.top;
        const percentage = (offsetTop / rect.height) * 100;
        // Límite: entre rowRatio + 15% y 85%
        setRowRatio2(Math.min(Math.max(percentage, rowRatio + 15), 85));
      }
    };

    const handleMouseUp = () => {
      setResizingColIdx(null);
      setResizingRowIdx(null);
    };

    if (resizingColIdx !== null || resizingRowIdx !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    resizingColIdx,
    resizingRowIdx,
    colRatio,
    colRatio2,
    rowRatio,
    rowRatio2,
    cols,
    rows,
    containerRef,
  ]);

  const handleReset = () => {
    const defaults = getDefaultRatios(count, currentLayout);
    setColRatio(defaults.colRatio);
    setColRatio2(defaults.colRatio2);
    setRowRatio(defaults.rowRatio);
    setRowRatio2(defaults.rowRatio2);
  };

  return {
    colRatio,
    colRatio2,
    rowRatio,
    rowRatio2,
    resizingColIdx,
    resizingRowIdx,
    setResizingColIdx,
    setResizingRowIdx,
    handleReset,
  };
};

export default useGridResizing;
