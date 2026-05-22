import { SimpleGrid, Center, Text, Box, VStack } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { MonitorPlay } from "lucide-react";
import WebRTCPlayer from "./WebRTCPlayer";

const VideoWall = () => {
  const { list } = useSelector((state) => state.cameras);

  const activeCameras = list.filter((cam) => cam.streaming && cam.webrtc_url);

  if (activeCameras.length === 0) {
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
    const count = activeCameras.length;
    if (count === 1) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  return (
    <SimpleGrid
      columns={getColumns()}
      h="100%"
      w="100%"
      p={2}
      gap={2}
      bg="gray.100"
    >
      {activeCameras.map((cam) => (
        <Box
          key={cam.dev}
          position="relative"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="sm"
          overflow="hidden"
          bg="white"
        >
          <WebRTCPlayer url={cam.webrtc_url} />

          <Box
            position="absolute"
            top={2}
            left={2}
            bg="whiteAlpha.900"
            px={3}
            py={1}
            borderRadius="md"
            pointerEvents="none"
            zIndex={5}
          >
            <Text fontSize="sm" fontWeight="bold" color="gray.800">
              {cam.name || cam.dev}
            </Text>
            {cam.active_settings && (
              <Text fontSize="2xs" color="gray.600" textTransform="uppercase">
                {cam.active_settings.resolution} @ {cam.active_settings.fps}FPS
                | {cam.active_settings.bitrate}
              </Text>
            )}
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default VideoWall;
