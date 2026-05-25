import { useState, useEffect } from "react";
import {
  VStack,
  Text,
  Center,
  Box,
  Flex,
  IconButton,
  Heading,
  Image,
  HStack,
  Badge,
  Button,
  Portal,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import {
  ChevronLeft,
  Video,
  Activity,
  LogOut,
  Users,
} from "lucide-react";
import { BeatLoader } from "react-spinners";
import CameraControlCard from "./CameraControlCard";
import UserManagementModal from "./UserManagementModal";
import { FfmpegDebugModal } from "./FfmpegDebugModal";
import logoImg from "../assets/logoh.png";
import { Tooltip } from "./ui/tooltip";
import { formatDeviceName } from "../utils/camera.js";
import { cameraApi } from "../api/camera.api.js";


const Sidebar = () => {
  const { list, isLoading, error } = useSelector((state) => state.cameras);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const userRole = localStorage.getItem("nvr_role");
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const checkDebugMode = async () => {
      try {
        const res = await cameraApi.getDebugModeStatus();
        setIsDebugMode(!!res.debugMode);
      } catch (err) {
        console.warn("No se pudo obtener el estado de depuración del backend:", err);
      }
    };
    checkDebugMode();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nvr_token");
    localStorage.removeItem("nvr_role");
    localStorage.removeItem("nvr_needs_password_change");
    window.location.reload();
  };

  // Estados locales para la depuración de FFmpeg
  const [isFfmpegOpen, setIsFfmpegOpen] = useState(false);
  const [isFfmpegClosing, setIsFfmpegClosing] = useState(false);

  const handleOpenDebug = () => {
    setIsFfmpegOpen(true);
    setIsFfmpegClosing(false);
  };

  const handleCloseDebug = () => {
    setIsFfmpegClosing(true);
    setTimeout(() => {
      setIsFfmpegOpen(false);
      setIsFfmpegClosing(false);
    }, 280); // Ligeramente por debajo de los 300ms de CSS para un desmontado limpio
  };


  if (isLoading) {
    return (
      <Center p={8} flexDirection="column" gap={4}>
        <BeatLoader size={12} color="#2563eb" />
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
      <Flex
        flexShrink={0}
        p={3}
        borderBottomWidth="1px"
        borderColor="gray.100"
        justifyContent={isCollapsed ? "center" : "space-between"}
        alignItems="center"
        w="full"
        zIndex={10}
        h="64px"
        overflow="hidden"
      >
        <HStack
          gap={isCollapsed ? 0 : 3}
          overflow="hidden"
          flex={isCollapsed ? "none" : "1"}
          style={{
            width: isCollapsed ? "0px" : "auto",
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? "translateX(-20px)" : "translateX(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Image
            src={logoImg}
            alt="Logo"
            boxSize={isCollapsed ? "0px" : "32px"}
            objectFit="contain"
            flexShrink={0}
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "scale(0)" : "scale(1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <Box
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-15px)" : "translateX(0)",
              transition: "opacity 0.2s linear, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Heading
              size="md"
              color="black"
              letterSpacing="tight"
              whiteSpace="nowrap"
            >
              UCAMI Odontología
            </Heading>
            {isDebugMode && (
              <Badge
                colorPalette="blue"
                variant="solid"
                size="2xs"
                borderRadius="full"
                px={2}
                py={0.2}
                className="pulse-blue-badge"
                style={{
                  fontSize: "8px",
                  fontWeight: "bold",
                  marginTop: "1px",
                  display: "inline-block",
                  letterSpacing: "0.5px"
                }}
              >
                MODO DEMO
              </Badge>
            )}
          </Box>
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

      <Box flex="1" position="relative" w="full" overflow="hidden">
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
                    bg={isStreaming ? "blue.50" : "gray.50"}
                    borderWidth="2px"
                    borderColor={isStreaming ? "blue.500" : "gray.200"}
                    color={isStreaming ? "blue.600" : "gray.500"}
                    cursor="pointer"
                    onClick={() => setIsCollapsed(false)}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      borderColor: isStreaming ? "blue.600" : "gray.400",
                      bg: isStreaming ? "blue.100" : "gray.100",
                      boxShadow: isStreaming ? "0 0 10px rgba(37, 99, 235, 0.2)" : "none"
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
                        bg="blue.500"
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

      <Box
        flexShrink={0}
        p={3}
        borderTopWidth="1px"
        borderColor="gray.100"
        bg="white"
        w="full"
        zIndex={10}
      >
        {isCollapsed ? (
          <VStack gap={2} align="center">
            <Tooltip content="Estado FFmpeg" positioning={{ placement: "right" }} showArrow>
              <IconButton
                size="sm"
                variant="surface"
                colorPalette="gray"
                borderRadius="xl"
                aria-label="Estado FFmpeg"
                onClick={handleOpenDebug}
              >
                <Activity size={18} />
              </IconButton>
            </Tooltip>
            {userRole === "admin" && (
              <Tooltip content="Gestión de Usuarios" positioning={{ placement: "right" }} showArrow>
                <IconButton
                  size="sm"
                  variant="surface"
                  colorPalette="blue"
                  borderRadius="xl"
                  aria-label="Gestión de Usuarios"
                  onClick={() => setIsUserManagementOpen(true)}
                >
                  <Users size={18} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip content="Cerrar sesión" positioning={{ placement: "right" }} showArrow>
              <IconButton
                id="logout-btn-collapsed"
                size="sm"
                variant="surface"
                colorPalette="red"
                borderRadius="xl"
                aria-label="Cerrar sesión"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </IconButton>
            </Tooltip>
          </VStack>
        ) : (
          <HStack w="full" gap={2}>
            <Button
              flex="1"
              variant="surface"
              colorPalette="gray"
              size="sm"
              borderRadius="xl"
              onClick={handleOpenDebug}
              fontWeight="semibold"
              justifyContent="center"
              gap={2}
            >
              <Activity size={16} />
              <Text fontSize="xs">Estado FFmpeg</Text>
            </Button>
            {userRole === "admin" && (
              <Tooltip content="Gestión de Usuarios" showArrow>
                <IconButton
                  size="sm"
                  variant="surface"
                  colorPalette="blue"
                  borderRadius="xl"
                  aria-label="Gestión de Usuarios"
                  onClick={() => setIsUserManagementOpen(true)}
                >
                  <Users size={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip content="Cerrar sesión" showArrow>
              <IconButton
                id="logout-btn"
                size="sm"
                variant="surface"
                colorPalette="red"
                borderRadius="xl"
                aria-label="Cerrar sesión"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </HStack>
        )}
      </Box>

      <FfmpegDebugModal
        isOpen={isFfmpegOpen}
        onClose={handleCloseDebug}
        isClosing={isFfmpegClosing}
      />
      <Portal>
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
        />
      </Portal>
    </Box>
  );
};

export default Sidebar;
