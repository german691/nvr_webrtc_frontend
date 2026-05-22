import { useState } from "react";
import {
  VStack,
  Text,
  Center,
  Spinner,
  Box,
  Flex,
  IconButton,
  Heading,
  Image,
  HStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import CameraControlCard from "./CameraControlCard";
import logoImg from "../assets/logoh.png";
import { Tooltip } from "./ui/tooltip";
import { formatDeviceName } from "../utils/camera.js";

const Sidebar = () => {
  const { list, isLoading, error } = useSelector((state) => state.cameras);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <Center p={8} flexDirection="column" gap={4}>
        <Spinner color="blue.500" size="xl" />
        <Text color="gray.600" fontSize="sm">
          Consultando hardware en nodos Edge...
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={8}>
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      </Center>
    );
  }

  if (!list || list.length === 0) {
    return (
      <Center p={8}>
        <Text color="gray.500" fontSize="sm" textAlign="center">
          No se detectaron cámaras conectadas a los servidores.
        </Text>
      </Center>
    );
  }

  return (
    <Box
      w={isCollapsed ? "68px" : "320px"}
      transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
      h="100%"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      position="relative"
    >
      {/* Header unificado */}
      <Flex
        flexShrink={0}
        p={3}
        borderBottomWidth="1px"
        borderColor="gray.100"
        justifyContent="space-between"
        alignItems="center"
        w="full"
        zIndex={10}
        h="64px"
        overflow="hidden"
      >
        <HStack gap={3} overflow="hidden" flex="1">
          <Image
            src={logoImg}
            alt="Logo"
            boxSize="32px"
            objectFit="contain"
            flexShrink={0}
          />
          <Heading
            size="md"
            color="black"
            letterSpacing="tight"
            whiteSpace="nowrap"
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-15px)" : "translateX(0)",
              transition: "opacity 0.2s linear, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            UCAMI Odontología
          </Heading>
        </HStack>
        <IconButton
          aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          size="sm"
          variant="ghost"
          color="gray.500"
          borderRadius="xl"
          _hover={{ bg: "gray.100", color: "gray.900" }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          transition="transform 0.3s ease"
          transform={isCollapsed ? "rotate(180deg)" : "rotate(0)"}
        >
          <ChevronLeft size={18} />
        </IconButton>
      </Flex>

      {/* Contenedor principal con fundido cruzado (Crossfade) */}
      <Box flex="1" position="relative" w="full" overflow="hidden">
        {/* Vista Expandida (Tarjetas de Control) */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          overflowY="auto"
          p={3}
          opacity={isCollapsed ? 0 : 1}
          pointerEvents={isCollapsed ? "none" : "auto"}
          transition="opacity 0.25s ease-in-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isCollapsed ? "translateY(10px)" : "translateY(0)"}
        >
          <VStack gap={3} align="stretch">
            {list.map((cam) => (
              <CameraControlCard key={cam.dev} camera={cam} />
            ))}
          </VStack>
        </Box>

        {/* Vista Colapsada (Iconos de Estado) */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          overflowY="auto"
          py={3}
          px={1.5}
          opacity={isCollapsed ? 1 : 0}
          pointerEvents={isCollapsed ? "auto" : "none"}
          transition="opacity 0.25s ease-in-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isCollapsed ? "translateY(0)" : "translateY(-10px)"}
        >
          <VStack gap={3} w="full" align="center">
            {list.map((cam) => {
              const isStreaming = cam.streaming;
              const titleText = `${formatDeviceName(cam.dev)} - ${
                isStreaming ? "Transmitiendo" : "En Espera"
              }`;
              return (
                <Tooltip
                  key={cam.dev}
                  content={titleText}
                  positioning={{ placement: "right" }}
                  showArrow
                >
                  <Box
                    position="relative"
                    p={2.5}
                    borderRadius="full"
                    bg={isStreaming ? "green.50" : "gray.50"}
                    borderWidth="2px"
                    borderColor={isStreaming ? "green.500" : "gray.200"}
                    color={isStreaming ? "green.600" : "gray.500"}
                    cursor="pointer"
                    onClick={() => setIsCollapsed(false)}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      borderColor: isStreaming ? "green.600" : "gray.400",
                      bg: isStreaming ? "green.100" : "gray.100",
                      boxShadow: isStreaming ? "0 0 10px rgba(34, 197, 94, 0.35)" : "none"
                    }}
                  >
                    <Video size={18} />
                    {isStreaming && (
                      <Box
                        position="absolute"
                        top="0"
                        right="0"
                        w="2.5"
                        h="2.5"
                        bg="red.500"
                        borderRadius="full"
                        borderWidth="1.5px"
                        borderColor="white"
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
