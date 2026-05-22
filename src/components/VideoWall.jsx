import { useState, useEffect } from "react";
import { SimpleGrid, Center, Text, Box, VStack, HStack } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { MonitorPlay, GripVertical } from "lucide-react";
import WebRTCPlayer from "./WebRTCPlayer";

const VideoWall = () => {
  const { list } = useSelector((state) => state.cameras);
  const [orderedCameras, setOrderedCameras] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggableCameraId, setDraggableCameraId] = useState(null);

  // Sincronizar orderedCameras cuando cambia la lista de Redux (cámaras encendidas / apagadas)
  useEffect(() => {
    const active = list.filter((cam) => cam.streaming && cam.webrtc_url);
    
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

  if (orderedCameras.length === 0) {
    return (
      <Center
        h="100%"
        w="100%"
        bg="gray.50"
        backgroundImage="radial-gradient(#CBD5E0 1px, transparent 1px)"
        backgroundSize="20px 20px"
      >
        <VStack
          gap={5}
          p={10}
          bg="white"
          borderRadius="xl"
          textAlign="center"
          maxW="md"
          shadow="md"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Box p={4} bg="blue.50" borderRadius="full" color="blue.500">
            <MonitorPlay size={48} strokeWidth={1.5} />
          </Box>
          <VStack gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Selecciona al menos una cámara
            </Text>
            <Text color="gray.500" fontSize="sm">
              Activa una cámara en el panel lateral para iniciar la
              visualización en tiempo real.
            </Text>
          </VStack>
        </VStack>
      </Center>
    );
  }

  const getColumns = () => {
    const count = orderedCameras.length;
    if (count === 1) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // 1. Obtener los elementos activos filtrados
  const activeCameras = list.filter((cam) => cam.streaming && cam.webrtc_url);
  // 2. Orden estable para el DOM (para evitar reparentar/reiniciar elementos <video>)
  const stableActiveCameras = [...activeCameras].sort((a, b) => a.dev.localeCompare(b.dev));

  return (
    <SimpleGrid
      columns={getColumns()}
      h="100%"
      w="100%"
      p={1.5}
      gap={1.5}
      bg="gray.100"
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
            borderColor="gray.200"
            borderRadius="2xl"
            overflow="hidden"
            bg="black"
            shadow="sm"
            transition="transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease"
            _hover={{
              borderColor: "green.400",
              boxShadow: "0 0 16px rgba(34, 197, 94, 0.25)",
            }}
            draggable={draggableCameraId === cam.dev}
            onDragStart={(e) => handleDragStart(e, visualIdx)}
            onDragOver={(e) => handleDragOver(e, visualIdx)}
            onDragEnd={handleDragEnd}
            opacity={draggedIndex === visualIdx ? 0.4 : 1}
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
    </SimpleGrid>
  );
};

export default VideoWall;
