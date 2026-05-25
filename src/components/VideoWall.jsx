import { useState, useEffect, useRef } from "react";
import { Center, Text, Box, VStack, HStack, IconButton, Popover, Portal } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { MonitorPlay, GripVertical, RotateCcw, LayoutGrid } from "lucide-react";
import WebRTCPlayer from "./WebRTCPlayer";
import { Tooltip } from "./ui/tooltip";

const VideoWall = () => {
  const { list } = useSelector((state) => state.cameras);
  const [orderedCameras, setOrderedCameras] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggableCameraId, setDraggableCameraId] = useState(null);

  // Estados locales para el redimensionamiento dinámico
  const containerRef = useRef(null);
  const [colRatio, setColRatio] = useState(50);
  const [colRatio2, setColRatio2] = useState(66.66);
  const [rowRatio, setRowRatio] = useState(50);
  const [rowRatio2, setRowRatio2] = useState(66.66);

  const [resizingColIdx, setResizingColIdx] = useState(null);
  const [resizingRowIdx, setResizingRowIdx] = useState(null);

  // Estado local para recordar el diseño fijo seleccionado según cantidad de cámaras
  const [layoutSelections, setLayoutSelections] = useState({
    1: "A",
    2: "A",
    3: "A",
    4: "C", // Cuadrantes iguales por defecto
    5: "A",
    6: "A", // Iguales por defecto
    7: "A",
    8: "A"  // Iguales por defecto
  });

  // Obtener las dimensiones del grid dinámico
  const activeCameras = list.filter((cam) => cam.streaming && cam.webrtc_url);
  const stableActiveCameras = [...activeCameras].sort((a, b) => a.dev.localeCompare(b.dev));
  const count = stableActiveCameras.length;
  const currentLayout = layoutSelections[count] || "A";

  const getLayoutOptions = (num) => {
    switch (num) {
      case 1:
        return [];
      case 2:
        return [
          { key: "A", label: "Lado a lado", desc: "2 cámaras horizontales" }
        ];
      case 3:
        return [
          { key: "A", label: "Layout A", desc: "1 Principal Derecha, 2 Pequeñas Izquierda" },
          { key: "B", label: "Layout B", desc: "1 Principal Superior, 2 Pequeñas Inferior" },
          { key: "C", label: "Layout C", desc: "3 Columnas Iguales" }
        ];
      case 4:
        return [
          { key: "A", label: "Layout A", desc: "1 Principal Derecha, 3 Pequeñas Izquierda" },
          { key: "B", label: "Layout B", desc: "1 Principal Superior, 3 Pequeñas Inferior" },
          { key: "C", label: "Layout C (Defecto)", desc: "4 Cuadrantes Iguales (2x2)" },
          { key: "D", label: "Layout D", desc: "1 Grande Superior Derecha, 3 en Esquinas" }
        ];
      case 5:
        return [
          { key: "A", label: "Layout A", desc: "1 Principal Superior Derecha (2x2), 4 Pequeñas" },
          { key: "B", label: "Layout B", desc: "2 Grandes Derecha, 3 Pequeñas Izquierda" }
        ];
      case 6:
        return [
          { key: "A", label: "Layout A (Defecto)", desc: "6 Cuadrantes Iguales (3x2)" },
          { key: "B", label: "Layout B", desc: "2 Grandes Derecha, 4 Pequeñas Izquierda" },
          { key: "C", label: "Layout C", desc: "1 Principal Superior Derecha (2x2), 5 Pequeñas" }
        ];
      case 7:
        return [
          { key: "A", label: "Layout A", desc: "1 Principal Superior Derecha (2x2), 6 Pequeñas" },
          { key: "B", label: "Layout B", desc: "1 Grande Derecha (toda la altura), 6 Pequeñas" }
        ];
      case 8:
        return [
          { key: "A", label: "Layout A (Defecto)", desc: "8 Cuadrantes Iguales (4x2)" },
          { key: "B", label: "Layout B", desc: "1 Grande Superior Derecha (2x2), 7 Pequeñas" },
          { key: "C", label: "Layout C", desc: "2 Grandes Derecha (toda la altura), 6 Pequeñas" }
        ];
      default:
        return [];
    }
  };

  const getGridDimensions = (num, layout) => {
    if (num <= 1) return { cols: 1, rows: 1 };
    if (num === 2) return { cols: 2, rows: 1 };
    if (num === 3) {
      if (layout === "C") return { cols: 3, rows: 1 };
      return { cols: 2, rows: 2 };
    }
    if (num === 4) {
      if (layout === "A") return { cols: 2, rows: 3 };
      if (layout === "B") return { cols: 3, rows: 2 };
      return { cols: 2, rows: 2 };
    }
    if (num === 5) {
      if (layout === "B") return { cols: 2, rows: 6 };
      return { cols: 3, rows: 3 };
    }
    if (num === 6) {
      if (layout === "B") return { cols: 2, rows: 4 };
      if (layout === "C") return { cols: 3, rows: 3 };
      return { cols: 3, rows: 2 };
    }
    if (num === 7) {
      return { cols: 4, rows: 3 };
    }
    if (num === 8) {
      if (layout === "A") return { cols: 4, rows: 2 };
      if (layout === "B") return { cols: 4, rows: 3 };
      if (layout === "C") return { cols: 4, rows: 6 };
    }
    return { cols: 3, rows: 3 };
  };

  const { cols, rows } = getGridDimensions(count, currentLayout);

  const getDefaultRatios = (num, layout) => {
    const { cols: activeCols, rows: activeRows } = getGridDimensions(num, layout);

    // Valores simétricos/equitativos por defecto según la estructura de la cuadrícula
    let defCol = activeCols === 3 ? 33.33 : 50;
    let defCol2 = 66.66;
    let defRow = activeRows === 3 ? 33.33 : 50;
    let defRow2 = 66.66;

    if (num === 2) {
      defCol = 50;
    } else if (num === 3) {
      if (layout === "A") {
        // 1 principal derecha (82% de ancho), 2 pequeñas izquierda (18% de ancho)
        defCol = 18; 
      } else if (layout === "B") {
        // 1 principal superior (82% de alto), 2 pequeñas inferior (18% de alto)
        defRow = 82;
      } else if (layout === "C") {
        defCol = 33.33;
        defCol2 = 66.66;
      }
    } else if (num === 4) {
      if (layout === "A") {
        // 1 principal derecha (82% ancho), 3 pequeñas izquierda (18% ancho)
        defCol = 18;
      } else if (layout === "B") {
        // 1 principal superior (82% alto), 3 pequeñas inferior (18% alto)
        defRow = 82;
      } else if (layout === "D") {
        defCol = 18;
        defRow = 82;
      }
    } else if (num === 5) {
      if (layout === "A") {
        defCol = 18;
        defCol2 = 59; // col 1 = 18%, col 2 = 41%, col 3 = 41%
        defRow = 41;
        defRow2 = 82;   // row 1 = 41%, row 2 = 41%, row 3 = 18%
      } else if (layout === "B") {
        defCol = 18;
      }
    } else if (num === 6) {
      if (layout === "B") {
        defCol = 18;
      } else if (layout === "C") {
        defCol = 18;
        defCol2 = 59;
        defRow = 41;
        defRow2 = 82;
      } else if (layout === "A") {
        defCol = 33.33;
        defCol2 = 66.66;
        defRow = 50;
      }
    } else if (num === 7) {
      if (layout === "A") {
        defRow = 41;
        defRow2 = 82;
      }
    } else if (num === 8) {
      if (layout === "B") {
        defRow = 41;
        defRow2 = 82;
      }
    }

    return { colRatio: defCol, colRatio2: defCol2, rowRatio: defRow, rowRatio2: defRow2 };
  };

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
  }, [cols, rows, count, currentLayout]);

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
  }, [resizingColIdx, resizingRowIdx, colRatio, colRatio2, rowRatio, rowRatio2, cols, rows]);

  // Sincronizar orderedCameras cuando cambia la lista de Redux (cámaras encendidas / apagadas)
  useEffect(() => {
    const active = list.filter((cam) => cam.streaming && cam.webrtc_url);
    
    const timer = setTimeout(() => {
      setOrderedCameras((prev) => {
        // 1. Conservamos las que siguen activas en el orden que ya tenían
        const stillActive = prev.filter((prevCam) =>
          active.some((actCam) => actCam.dev === prevCam.dev)
        );
        
        // 2. Agregamos las nuevas cámaras que se acaban de encender
        const newActive = active.filter((actCam) =>
          !prev.some((prevCam) => prevCam.dev === actCam.dev)
        );
        
        return [...stillActive, ...newActive];
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [list]);

  // Iniciar arrastre
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Intercambiar posiciones en tiempo real al arrastrar sobre otro elemento
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setOrderedCameras((prev) => {
      const result = [...prev];
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(index, 0, removed);
      return result;
    });
    setDraggedIndex(index); // Actualiza la posición de arrastre para transiciones continuas
  };

  // Finalizar arrastre
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggableCameraId(null);
  };

  // Reajustar cuadrícula a ratios predeterminados según la distribución
  const handleReset = () => {
    const defaults = getDefaultRatios(count, currentLayout);
    setColRatio(defaults.colRatio);
    setColRatio2(defaults.colRatio2);
    setRowRatio(defaults.rowRatio);
    setRowRatio2(defaults.rowRatio2);
  };

  if (orderedCameras.length === 0) {
    return (
      <Center
        h="100%"
        w="100%"
        bg="#f8fafc"
        backgroundImage="radial-gradient(rgba(100, 116, 139, 0.24) 1.5px, transparent 1.5px)"
        backgroundSize="20px 20px"
        position="relative"
        overflow="hidden"
      >
        {/* Círculo dinámico de fondo con gradiente pastel para el efecto Glassmorphism */}
        <Box
          position="absolute"
          top="15%"
          left="20%"
          w="400px"
          h="400px"
          bgGradient="radial(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%)"
          borderRadius="full"
          filter="blur(60px)"
          pointerEvents="none"
          zIndex={1}
          className="float-slow-bg"
        />

        <Box
          px={6}
          py={2.5}
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.65)"
          backdropFilter="blur(100px)"
          boxShadow="0 10px 30px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 1)"
          border="1px solid rgba(255, 255, 255, 0.7)"
          whiteSpace="nowrap"
          zIndex={10}
          animation="modal-content-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        >
          <HStack gap={3} align="center">
            <Box color="blue.600" display="flex" alignItems="center">
              <MonitorPlay size={16} strokeWidth={2.5} />
            </Box>
            <Text
              fontSize="10px"
              color="gray.500"
              letterSpacing="widest"
              textTransform="uppercase"
              fontWeight="semibold"
            >
              Selecciona al menos una cámara
            </Text>
          </HStack>
        </Box>
      </Center>
    );
  }

  // Dibujar diagrama miniatura interactivo para representar el diseño
  const renderLayoutShape = (num, layout) => {
    let cells = [];

    if (num === 2) {
      cells = [
        { col: "1", row: "1", bg: "blue.500" },
        { col: "2", row: "1", bg: "blue.500" }
      ];
    } else if (num === 3) {
      if (layout === "A") {
        cells = [
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "1 / span 2", bg: "blue.500" }
        ];
      } else if (layout === "B") {
        cells = [
          { col: "1 / span 2", row: "1", bg: "blue.500" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "1", row: "1", bg: "blue.500" },
          { col: "2", row: "1", bg: "blue.500" },
          { col: "3", row: "1", bg: "blue.500" }
        ];
      }
    } else if (num === 4) {
      if (layout === "A") {
        cells = [
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "2", row: "1 / span 3", bg: "blue.500" }
        ];
      } else if (layout === "B") {
        cells = [
          { col: "1 / span 3", row: "1", bg: "blue.500" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "3", row: "2", bg: "gray.300" }
        ];
      } else if (layout === "D") {
        cells = [
          { col: "2", row: "1", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" }
        ];
      }
    } else if (num === 5) {
      if (layout === "A") {
        cells = [
          { col: "2 / span 2", row: "1 / span 2", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "2 / span 2", row: "3", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "2", row: "1 / span 3", bg: "blue.500" },
          { col: "2", row: "4 / span 3", bg: "blue.500" },
          { col: "1", row: "1 / span 2", bg: "gray.300" },
          { col: "1", row: "3 / span 2", bg: "gray.300" },
          { col: "1", row: "5 / span 2", bg: "gray.300" }
        ];
      }
    } else if (num === 6) {
      if (layout === "B") {
        cells = [
          { col: "2", row: "1 / span 2", bg: "blue.500" },
          { col: "2", row: "3 / span 2", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "1", row: "4", bg: "gray.300" }
        ];
      } else if (layout === "C") {
        cells = [
          { col: "2 / span 2", row: "1 / span 2", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "2", row: "3", bg: "gray.300" },
          { col: "3", row: "3", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "3", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "3", row: "2", bg: "gray.300" }
        ];
      }
    } else if (num === 7) {
      if (layout === "A") {
        cells = [
          { col: "3 / span 2", row: "1 / span 2", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "1 / span 2", row: "3", bg: "gray.300" },
          { col: "3 / span 2", row: "3", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "3 / span 2", row: "1 / span 3", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "2", row: "3", bg: "gray.300" }
        ];
      }
    } else if (num === 8) {
      if (layout === "B") {
        cells = [
          { col: "3 / span 2", row: "1 / span 2", bg: "blue.500" },
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "1", row: "3", bg: "gray.300" },
          { col: "2", row: "3", bg: "gray.300" },
          { col: "3 / span 2", row: "3", bg: "gray.300" }
        ];
      } else if (layout === "C") {
        cells = [
          { col: "3 / span 2", row: "1 / span 3", bg: "blue.500" },
          { col: "3 / span 2", row: "4 / span 3", bg: "blue.500" },
          { col: "1", row: "1 / span 2", bg: "gray.300" },
          { col: "2", row: "1 / span 2", bg: "gray.300" },
          { col: "1", row: "3 / span 2", bg: "gray.300" },
          { col: "2", row: "3 / span 2", bg: "gray.300" },
          { col: "1", row: "5 / span 2", bg: "gray.300" },
          { col: "2", row: "5 / span 2", bg: "gray.300" }
        ];
      } else {
        cells = [
          { col: "1", row: "1", bg: "gray.300" },
          { col: "2", row: "1", bg: "gray.300" },
          { col: "3", row: "1", bg: "gray.300" },
          { col: "4", row: "1", bg: "gray.300" },
          { col: "1", row: "2", bg: "gray.300" },
          { col: "2", row: "2", bg: "gray.300" },
          { col: "3", row: "2", bg: "gray.300" },
          { col: "4", row: "2", bg: "gray.300" }
        ];
      }
    }

    const { cols: dCols, rows: dRows } = getGridDimensions(num, layout);

    return (
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${dCols}, 1fr)`}
        gridTemplateRows={`repeat(${dRows}, 1fr)`}
        gap="2px"
        w="54px"
        h="38px"
        bg="rgba(15, 23, 42, 0.04)"
        p="2px"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        {cells.map((c, idx) => (
          <Box
            key={idx}
            gridColumn={c.col}
            gridRow={c.row}
            bg={c.bg}
            borderRadius="1px"
            opacity={0.85}
          />
        ))}
      </Box>
    );
  };

  // Estilos de cuadrícula dinámicos según el recuento de cámaras y layout
  const getGridTemplateStyles = () => {
    if (count <= 1) {
      return {
        display: "grid",
        gridTemplateColumns: "100%",
        gridTemplateRows: "100%",
      };
    }

    let gridTemplateColumns;
    let gridTemplateRows;

    // Construir columnas
    if (cols === 2) {
      gridTemplateColumns = `${colRatio}% ${100 - colRatio}%`;
    } else if (cols === 3) {
      gridTemplateColumns = `${colRatio}% ${colRatio2 - colRatio}% ${100 - colRatio2}%`;
    } else {
      gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }

    // Construir filas
    if (rows === 2) {
      gridTemplateRows = `${rowRatio}% ${100 - rowRatio}%`;
    } else if (rows === 3) {
      gridTemplateRows = `${rowRatio}% ${rowRatio2 - rowRatio}% ${100 - rowRatio2}%`;
    } else {
      gridTemplateRows = `repeat(${rows}, 1fr)`;
    }

    return {
      display: "grid",
      gridTemplateColumns,
      gridTemplateRows,
    };
  };

  // Posicionar celdas de rejilla según el recuento, layout seleccionado y la posición ordenada
  const getGridAreaProps = (visualIdx, count, layout) => {
    if (count <= 1) {
      return { gridColumn: "1", gridRow: "1" };
    }
    if (count === 2) {
      return {
        gridColumn: visualIdx === 0 ? "1" : "2",
        gridRow: "1"
      };
    }
    if (count === 3) {
      // Layout A: 1 principal derecha (toda la columna derecha), 2 pequeñas izquierda.
      if (layout === "A") {
        if (visualIdx === 0) return { gridColumn: "2", gridRow: "1 / span 2" }; // Principal Derecha
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "2" };
      }
      // Layout B: 1 principal en parte superior, 2 pequeñas en el inferior.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "1 / span 2", gridRow: "1" }; // Principal Superior
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 2) return { gridColumn: "2", gridRow: "2" };
      }
      // Layout C: 3 columnas iguales.
      return {
        gridColumn: `${visualIdx + 1}`,
        gridRow: "1"
      };
    }
    if (count === 4) {
      // Layout A: 1 principal derecha, 3 pequeñas izquierda.
      if (layout === "A") {
        if (visualIdx === 0) return { gridColumn: "2", gridRow: "1 / span 3" }; // Principal Derecha
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "3" };
      }
      // Layout B: 1 principal superior, 3 pequeñas inferior.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "1 / span 3", gridRow: "1" }; // Principal Superior
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 2) return { gridColumn: "2", gridRow: "2" };
        if (visualIdx === 3) return { gridColumn: "3", gridRow: "2" };
      }
      // Layout D: 1 grande superior derecha, 3 en esquinas restantes.
      if (layout === "D") {
        if (visualIdx === 0) return { gridColumn: "2", gridRow: "1" }; // Grande superior derecha
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" }; // Superior izquierda
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "2" }; // Inferior izquierda
        if (visualIdx === 3) return { gridColumn: "2", gridRow: "2" }; // Inferior derecha
      }
      // Layout C (defecto): cuadrantes iguales 2x2.
      const col = (visualIdx % 2) + 1;
      const row = Math.floor(visualIdx / 2) + 1;
      return { gridColumn: `${col}`, gridRow: `${row}` };
    }
    if (count === 5) {
      // Layout A: 1 principal superior derecha (2x2), 4 pequeñas.
      if (layout === "A") {
        if (visualIdx === 0) return { gridColumn: "2 / span 2", gridRow: "1 / span 2" }; // Grande superior derecha (2x2)
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" }; // Superior izquierda
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "2" }; // Medio izquierda
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "3" }; // Inferior izquierda
        if (visualIdx === 4) return { gridColumn: "2 / span 2", gridRow: "3" }; // Inferior derecha horizontal
      }
      // Layout B: 2 grandes a la derecha, 3 pequeñas a la izquierda.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "2", gridRow: "1 / span 3" }; // Grande 1 superior derecha
        if (visualIdx === 1) return { gridColumn: "2", gridRow: "4 / span 3" }; // Grande 2 inferior derecha
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "1 / span 2" }; // Pequeña 1 izquierda
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "3 / span 2" }; // Pequeña 2 izquierda
        if (visualIdx === 4) return { gridColumn: "1", gridRow: "5 / span 2" }; // Pequeña 3 izquierda
      }
    }
    if (count === 6) {
      // Layout B: 2 grandes a la derecha, 4 pequeñas a la izquierda.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "2", gridRow: "1 / span 2" }; // Grande 1 superior derecha
        if (visualIdx === 1) return { gridColumn: "2", gridRow: "3 / span 2" }; // Grande 2 inferior derecha
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 4) return { gridColumn: "1", gridRow: "3" };
        if (visualIdx === 5) return { gridColumn: "1", gridRow: "4" };
      }
      // Layout C: 1 principal superior derecha (2x2), 5 pequeñas rodeando.
      if (layout === "C") {
        if (visualIdx === 0) return { gridColumn: "2 / span 2", gridRow: "1 / span 2" }; // Grande superior derecha (2x2)
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" }; // Superior izquierda
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "2" }; // Medio izquierda
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "3" }; // Inferior izquierda
        if (visualIdx === 4) return { gridColumn: "2", gridRow: "3" }; // Inferior centro
        if (visualIdx === 5) return { gridColumn: "3", gridRow: "3" }; // Inferior derecha
      }
      // Layout A (defecto): cuadrantes iguales 3x2.
      const col = (visualIdx % 3) + 1;
      const row = Math.floor(visualIdx / 3) + 1;
      return { gridColumn: `${col}`, gridRow: `${row}` };
    }
    if (count === 7) {
      // Layout A: 1 grande superior derecha (2x2), y las otras 6 la rodean de forma balanceada.
      if (layout === "A") {
        if (visualIdx === 0) return { gridColumn: "3 / span 2", gridRow: "1 / span 2" }; // Grande superior derecha (2x2)
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 2) return { gridColumn: "2", gridRow: "1" };
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 4) return { gridColumn: "2", gridRow: "2" };
        if (visualIdx === 5) return { gridColumn: "1 / span 2", gridRow: "3" }; // Bottom left span 2
        if (visualIdx === 6) return { gridColumn: "3 / span 2", gridRow: "3" }; // Bottom right span 2
      }
      // Layout B: 1 cámara grande superior derecha (toda la altura vertical de la col derecha), y las otras 6 pequeñas en 2x3 a la izquierda.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "3 / span 2", gridRow: "1 / span 3" }; // Principal derecha (toda la altura)
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 2) return { gridColumn: "2", gridRow: "1" };
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 4) return { gridColumn: "2", gridRow: "2" };
        if (visualIdx === 5) return { gridColumn: "1", gridRow: "3" };
        if (visualIdx === 6) return { gridColumn: "2", gridRow: "3" };
      }
    }
    if (count === 8) {
      // Layout B: 1 grande superior derecha (2x2), 7 pequeñas.
      if (layout === "B") {
        if (visualIdx === 0) return { gridColumn: "3 / span 2", gridRow: "1 / span 2" }; // Grande superior derecha (2x2)
        if (visualIdx === 1) return { gridColumn: "1", gridRow: "1" };
        if (visualIdx === 2) return { gridColumn: "2", gridRow: "1" };
        if (visualIdx === 3) return { gridColumn: "1", gridRow: "2" };
        if (visualIdx === 4) return { gridColumn: "2", gridRow: "2" };
        if (visualIdx === 5) return { gridColumn: "1", gridRow: "3" };
        if (visualIdx === 6) return { gridColumn: "2", gridRow: "3" };
        if (visualIdx === 7) return { gridColumn: "3 / span 2", gridRow: "3" }; // Bottom right under large
      }
      // Layout C: 2 grandes a la derecha (ocupando toda la altura), 6 pequeñas distribuidas en 2 columnas de 3 filas.
      if (layout === "C") {
        if (visualIdx === 0) return { gridColumn: "3 / span 2", gridRow: "1 / span 3" }; // Grande 1 derecha superior
        if (visualIdx === 1) return { gridColumn: "3 / span 2", gridRow: "4 / span 3" }; // Grande 2 derecha inferior
        if (visualIdx === 2) return { gridColumn: "1", gridRow: "1 / span 2" };
        if (visualIdx === 3) return { gridColumn: "2", gridRow: "1 / span 2" };
        if (visualIdx === 4) return { gridColumn: "1", gridRow: "3 / span 2" };
        if (visualIdx === 5) return { gridColumn: "2", gridRow: "3 / span 2" };
        if (visualIdx === 6) return { gridColumn: "1", gridRow: "5 / span 2" };
        if (visualIdx === 7) return { gridColumn: "2", gridRow: "5 / span 2" };
      }
      // Layout A (defecto): 8 cuadrantes iguales (4x2).
      const col = (visualIdx % 4) + 1;
      const row = Math.floor(visualIdx / 4) + 1;
      return { gridColumn: `${col}`, gridRow: `${row}` };
    }

    // Distribución por defecto
    const col = (visualIdx % cols) + 1;
    const row = Math.floor(visualIdx / cols) + 1;
    return { gridColumn: `${col}`, gridRow: `${row}` };
  };

  return (
    <Box
      ref={containerRef}
      h="100%"
      w="100%"
      bg="black"
      position="relative"
      overflow="hidden"
      userSelect={resizingColIdx !== null || resizingRowIdx !== null ? "none" : "auto"}
      {...getGridTemplateStyles()}
    >
      {stableActiveCameras.map((cam) => {
        // Encontrar la posición visual del elemento en el arreglo de orden del usuario
        let visualIdx = orderedCameras.findIndex((c) => c.dev === cam.dev);
        if (visualIdx === -1) visualIdx = 0;

        return (
          <Box
            key={cam.dev}
            order={visualIdx} // Usar propiedad CSS `order` para el reordenamiento visual sin mover nodos del DOM
            position="relative"
            borderWidth="1px"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderRadius="none"
            overflow="hidden"
            bg="black"
            transition="border-color 0.2s ease, opacity 0.2s ease"
            _hover={{
              borderColor: "blue.500",
            }}
            draggable={draggableCameraId === cam.dev}
            onDragStart={(e) => handleDragStart(e, visualIdx)}
            onDragOver={(e) => handleDragOver(e, visualIdx)}
            onDragEnd={handleDragEnd}
            opacity={draggedIndex === visualIdx ? 0.4 : 1}
            {...getGridAreaProps(visualIdx, count, currentLayout)}
          >
            <WebRTCPlayer url={cam.webrtc_url} camera={cam} />

            {/* Badge del Nombre con Grip de Arrastre */}
            <Box
              position="absolute"
              top={3}
              left={3}
              bg="blackAlpha.700"
              backdropFilter="blur(8px)"
              px={3}
              py={1.5}
              borderRadius="lg"
              zIndex={5}
              opacity={0.8}
              transition="all 0.2s ease-in-out"
              _hover={{ opacity: 0.95, transform: "scale(1.02)" }}
              cursor="grab"
              _active={{ cursor: "grabbing" }}
              onMouseEnter={() => setDraggableCameraId(cam.dev)}
              onMouseLeave={() => setDraggableCameraId(null)}
            >
              <HStack gap={2}>
                <GripVertical size={14} color="#A0AEC0" />
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    {cam.name || cam.dev}
                  </Text>
                  {cam.active_settings && (
                    <Text fontSize="3xs" color="gray.300" textTransform="uppercase" fontWeight="medium">
                      {cam.active_settings.resolution} @ {cam.active_settings.fps}FPS
                      | {cam.active_settings.bitrate}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          </Box>
        );
      })}

      {/* Barras divisorias deslizantes e interactivas */}
      {/* Divider Vertical 1 (cols === 2 o cols === 3) */}
      {(cols === 2 || cols === 3) && (
        <Box
          position="absolute"
          left={`${colRatio}%`}
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          cursor="col-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => { e.preventDefault(); setResizingColIdx(1); }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5
          }}
          transition="all 0.2s"
        />
      )}

      {/* Divider Vertical 2 (cols === 3) */}
      {cols === 3 && (
        <Box
          position="absolute"
          left={`${colRatio2}%`}
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          cursor="col-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => { e.preventDefault(); setResizingColIdx(2); }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5
          }}
          transition="all 0.2s"
        />
      )}

      {/* Divider Horizontal 1 (rows === 2 o rows === 3) */}
      {(rows === 2 || rows === 3) && (
        <Box
          position="absolute"
          top={`${rowRatio}%`}
          left={0}
          right={0}
          h="8px"
          mt="-4px"
          cursor="row-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => { e.preventDefault(); setResizingRowIdx(1); }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5
          }}
          transition="all 0.2s"
        />
      )}

      {/* Divider Horizontal 2 (rows === 3) */}
      {rows === 3 && (
        <Box
          position="absolute"
          top={`${rowRatio2}%`}
          left={0}
          right={0}
          h="8px"
          mt="-4px"
          cursor="row-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => { e.preventDefault(); setResizingRowIdx(2); }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5
          }}
          transition="all 0.2s"
        />
      )}

      {/* BOTONES FLOTANTES: Reajuste y Selector de Layout */}
      <Box position="absolute" top={3} right={3} zIndex={50}>
        <HStack gap={2}>
          {/* BOTÓN SELECTOR DE LAYOUT */}
          <Popover.Root portalled={true} unmountOnExit={true}>
            <Tooltip content="Seleccionar diseño de cuadrícula" showArrow>
              <span style={{ display: "inline-block" }}>
                <Popover.Trigger asChild>
                  <IconButton
                    size="sm"
                    variant="solid"
                    borderRadius="full"
                    disabled={count <= 1}
                    aria-label="Seleccionar diseño de cuadrícula"
                    boxShadow="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    bg="white"
                    color="gray.700"
                    transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                    _hover={{
                      bg: "gray.50",
                      borderColor: "blue.500",
                      color: "blue.600",
                      transform: "scale(1.05)"
                    }}
                    _active={{
                      transform: "scale(0.95)"
                    }}
                  >
                    <LayoutGrid size={16} />
                  </IconButton>
                </Popover.Trigger>
              </span>
            </Tooltip>
            <Portal>
              <Popover.Positioner zIndex={1600}>
                <Popover.Content
                  bg="white"
                  borderColor="gray.200"
                  shadow="2xl"
                  p={3}
                  borderRadius="xl"
                  zIndex="popover"
                  w="260px"
                >
                  <Popover.Arrow />
                  <Popover.Body p={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.700"
                      mb={2}
                      px={2}
                    >
                      Diseño de Cuadrícula
                    </Text>
                    <HStack gap={3} justify="start" wrap="wrap" px={2} py={1}>
                      {getLayoutOptions(count).map((opt) => {
                        const isSelected = currentLayout === opt.key;
                        return (
                          <Box
                            key={opt.key}
                            as="button"
                            onClick={() => {
                              setLayoutSelections((prev) => ({
                                ...prev,
                                [count]: opt.key
                              }));
                            }}
                            p="5px"
                            borderRadius="xl"
                            border="2px solid"
                            borderColor={isSelected ? "blue.500" : "gray.200"}
                            bg={isSelected ? "blue.50" : "white"}
                            _hover={{
                              borderColor: isSelected ? "blue.600" : "blue.300",
                              bg: isSelected ? "blue.50" : "gray.50",
                              transform: "translateY(-1.5px)"
                            }}
                            transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                            boxShadow={isSelected ? "0 4px 12px rgba(59, 130, 246, 0.18)" : "none"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {renderLayoutShape(count, opt.key)}
                          </Box>
                        );
                      })}
                    </HStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>

          {/* BOTÓN REAJUSTE DE CUADRÍCULA */}
          <Tooltip content="Restablecer cuadrícula" showArrow>
            <span style={{ display: "inline-block" }}>
              <IconButton
                size="sm"
                variant="solid"
                borderRadius="full"
                onClick={handleReset}
                disabled={count <= 1}
                aria-label="Restablecer cuadrícula"
                boxShadow="lg"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
                color="gray.700"
                transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                _hover={{
                  bg: "gray.50",
                  borderColor: "blue.500",
                  color: "blue.600",
                  transform: "scale(1.05) rotate(-45deg)"
                }}
                _active={{
                  transform: "scale(0.95)"
                }}
              >
                <RotateCcw size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </HStack>
      </Box>
    </Box>
  );
};

export default VideoWall;
