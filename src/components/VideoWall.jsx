import { useState, useRef, useMemo } from "react";
import {
  Center,
  Text,
  Box,
  VStack,
  HStack,
  IconButton,
  Popover,
  Portal,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { MonitorPlay, GripVertical, RotateCcw, LayoutGrid } from "lucide-react";
import WebRTCPlayer from "./WebRTCPlayer";
import { Tooltip } from "./ui/tooltip";
import { DottedBackground } from "./ui/DottedBackground";
import { GlassCircle } from "./ui/GlassCircle";
import {
  getLayoutOptions,
  getGridDimensions,
  getDefaultRatios,
  getGridAreaProps,
  renderLayoutShape,
} from "../utils/layoutHelper";
import { useCameraDragAndDrop } from "../hooks/useCameraDragAndDrop";
import { useGridResizing } from "../hooks/useGridResizing";

/**
 * Componente Muro de Video (VideoWall).
 * Compone una cuadrícula interactiva y redimensionable de reproductores WebRTC.
 * Soporta ordenamiento por arrastre HTML5 y divisorias interactivas.
 */
export const VideoWall = () => {
  const { list } = useSelector((state) => state.cameras);
  const containerRef = useRef(null);

  // Estado local para recordar el diseño fijo seleccionado según cantidad de cámaras
  const [layoutSelections, setLayoutSelections] = useState({
    1: "A",
    2: "A",
    3: "A",
    4: "C", // Cuadrantes iguales por defecto
    5: "A",
    6: "A", // Iguales por defecto
    7: "A",
    8: "A", // Iguales por defecto
  });


  // Obtener las dimensiones del grid dinámico de forma memoizada
  const stableActiveCameras = useMemo(() => {
    const active = list.filter((cam) => cam.streaming && cam.webrtc_url);
    return [...active].sort((a, b) => a.dev.localeCompare(b.dev));
  }, [list]);
  const count = stableActiveCameras.length;
  const currentLayout = layoutSelections[count] || "A";

  const { cols, rows } = getGridDimensions(count, currentLayout);

  // Delegar toda la lógica interactiva y de arrastre a hooks de negocio puros
  const {
    orderedCameras,
    draggedIndex,
    draggableCameraId,
    setDraggableCameraId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useCameraDragAndDrop(stableActiveCameras);

  const {
    colRatio,
    colRatio2,
    rowRatio,
    rowRatio2,
    resizingColIdx,
    resizingRowIdx,
    setResizingColIdx,
    setResizingRowIdx,
    handleReset,
  } = useGridResizing(count, currentLayout, cols, rows, getDefaultRatios, containerRef);

  if (orderedCameras.length === 0) {
    return (
      <Center
        h="100%"
        w="100%"
        bg="nvr.bg.app"
        position="relative"
        overflow="hidden"
      >
        {/* Círculo dinámico de fondo con gradiente pastel para el efecto Glassmorphism */}
        <GlassCircle
          top="15%"
          left="20%"
          size="400px"
          color="rgba(59, 130, 246, 0.08)"
          blur="60px"
        />

        {/* Fondo de Puntilleado de Alta Precisión overlay */}
        <DottedBackground />

        <Box
          px={6}
          py={2.5}
          borderRadius="full"
          bg="nvr.glass.emptyBg"
          backdropFilter="blur(100px)"
          boxShadow="nvr.glass"
          border="1px solid"
          borderColor="nvr.glass.emptyBorder"
          whiteSpace="nowrap"
          zIndex={10}
          animation="modal-content-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        >
          <HStack gap={3} align="center">
            <Box color="nvr.brand.primaryText" display="flex" alignItems="center">
              <MonitorPlay size={16} strokeWidth={2.5} />
            </Box>
            <Text
              fontSize="10px"
              color="nvr.text.secondary"
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

  return (
    <Box
      ref={containerRef}
      h="100%"
      w="100%"
      bg="black"
      position="relative"
      overflow="hidden"
      userSelect={
        resizingColIdx !== null || resizingRowIdx !== null ? "none" : "auto"
      }
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
              opacity={1}
              transition="all 0.2s ease-in-out"
              _hover={{ transform: "scale(1.02)" }}
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
                    <Text
                      fontSize="3xs"
                      color="gray.300"
                      textTransform="uppercase"
                      fontWeight="medium"
                    >
                      {cam.active_settings.resolution} @{" "}
                      {cam.active_settings.fps}FPS |{" "}
                      {cam.active_settings.bitrate}
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
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingColIdx(1);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
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
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingColIdx(2);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
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
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingRowIdx(1);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
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
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingRowIdx(2);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
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
                    borderColor="nvr.border.default"
                    bg="nvr.bg.card"
                    color="nvr.text.secondary"
                    transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                    _hover={{
                      bg: "nvr.bg.muted",
                      borderColor: "nvr.brand.primary",
                      color: "nvr.brand.primaryText",
                      transform: "scale(1.05)",
                    }}
                    _active={{
                      transform: "scale(0.95)",
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
                  bg="nvr.bg.modal"
                  borderColor="nvr.border.default"
                  shadow="2xl"
                  p={2}
                  borderRadius="lg"
                  zIndex="popover"
                  w="84px"
                  onWheel={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  <Popover.Arrow />
                  <Popover.Body p={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="nvr.text.secondary"
                      mb={2}
                      textAlign="center"
                    >
                      Orden
                    </Text>
                    <VStack gap={2} align="center" py={1}>
                      {getLayoutOptions(count).map((opt) => {
                        const isSelected = currentLayout === opt.key;
                        return (
                          <Box
                            key={opt.key}
                            as="button"
                            onClick={() => {
                              setLayoutSelections((prev) => ({
                                ...prev,
                                [count]: opt.key,
                               }));
                            }}
                            p="4px"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={
                              isSelected ? "nvr.brand.primary" : "nvr.border.default"
                            }
                            bg={isSelected ? "nvr.brand.activeBg" : "nvr.bg.card"}
                            _hover={{
                              borderColor: isSelected ? "nvr.brand.primaryText" : "blue.300",
                              bg: isSelected ? "nvr.brand.activeBg" : "nvr.bg.muted",
                              transform: "translateY(-1px)",
                            }}
                            transition="all 0.15s ease-in-out"
                            boxShadow={
                              isSelected
                                ? "0 2px 8px rgba(59, 130, 246, 0.12)"
                                : "none"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {renderLayoutShape(count, opt.key)}
                          </Box>
                        );
                      })}
                    </VStack>
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
                borderColor="nvr.border.default"
                bg="nvr.bg.card"
                color="nvr.text.secondary"
                transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                _hover={{
                  bg: "nvr.bg.muted",
                  borderColor: "nvr.brand.primary",
                  color: "nvr.brand.primaryText",
                  transform: "scale(1.05) rotate(-45deg)",
                }}
                _active={{
                  transform: "scale(0.95)",
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
