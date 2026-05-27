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
import { useSelector, useDispatch } from "react-redux";
import { toggleStream } from "../store/slices/cameraSlice";
import {
  ChevronLeft,
  Video,
  Activity,
  LogOut,
  Users,
  Server,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { BeatLoader } from "react-spinners";
import CameraControlCard from "./CameraControlCard";
import UserManagementModal from "./UserManagementModal";
import { NodeManagementModal } from "./NodeManagementModal";
import { FfmpegDebugModal } from "./FfmpegDebugModal";
import logoImg from "../assets/logoh.png";
import { Tooltip } from "./ui/tooltip";
import {
  formatDeviceName,
  getSortedResolutions,
  getSortedFps,
} from "../utils/camera.js";
import { cameraApi } from "../api/camera.api.js";

const Sidebar = () => {
  const dispatch = useDispatch();
  const { list, isLoading, error } = useSelector((state) => state.cameras);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isNodeManagementOpen, setIsNodeManagementOpen] = useState(false);
  const userRole = localStorage.getItem("nvr_role");
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [togglingDevs, setTogglingDevs] = useState({});

  const handleToggleCamera = async (cam) => {
    setTogglingDevs((prev) => ({ ...prev, [cam.dev]: true }));
    try {
      if (cam.streaming) {
        await dispatch(toggleStream({ dev: cam.dev, action: "stop" })).unwrap();
      } else {
        const sortedResolutions = getSortedResolutions(cam.modes);
        const sortedFps = getSortedFps(cam.modes);
        const defaultRes = sortedResolutions.includes("1920x1080")
          ? "1920x1080"
          : sortedResolutions[0];
        const defaultFps = sortedFps.includes("30") ? "30" : sortedFps[0];
        const defaultBitrate = "2M";

        await dispatch(
          toggleStream({
            dev: cam.dev,
            resolution: defaultRes,
            fps: defaultFps,
            bitrate: defaultBitrate,
            cleanBitrate: defaultBitrate,
            action: "start",
          }),
        ).unwrap();
      }
    } catch (error) {
      console.error("Fallo al cambiar transmisión en barra reducida:", error);
    } finally {
      setTogglingDevs((prev) => ({ ...prev, [cam.dev]: false }));
    }
  };

  useEffect(() => {
    const checkDebugMode = async () => {
      try {
        const res = await cameraApi.getDebugModeStatus();
        setIsDebugMode(!!res.debugMode);
      } catch (err) {
        console.warn(
          "No se pudo obtener el estado de depuración del backend:",
          err,
        );
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
    }, 280);
  };

  if (isLoading) {
    return (
      <Center p={8} flexDirection="column" gap={4}>
        <BeatLoader size={12} color="#2563eb" />
        <Text color="nvr.text.secondary" fontSize="sm">
          Cargando...
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={8}>
        <Text color="nvr.brand.danger" textAlign="center">
          {error}
        </Text>
      </Center>
    );
  }

  if (!list || list.length === 0) {
    return (
      <Center p={8}>
        <Text color="nvr.text.secondary" fontSize="sm" textAlign="center">
          No se detectaron cámaras conectadas a los servidores.
        </Text>
      </Center>
    );
  }

  return (
    <Box
      w={isCollapsed ? "60px" : "320px"}
      transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
      h="100%"
      bg="nvr.bg.sidebar"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      position="relative"
    >
      <Flex
        flexShrink={0}
        p={2}
        borderBottomWidth="1px"
        borderColor="nvr.border.subtle"
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
              transition:
                "opacity 0.2s linear, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Heading
              size="md"
              color="nvr.text.primary"
              letterSpacing="tight"
              whiteSpace="nowrap"
            >
              UCAMI Odontología
            </Heading>
            {isDebugMode && (
              <Badge
                size="xs"
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
                  letterSpacing: "0.5px",
                }}
              >
                MODO DEMO
              </Badge>
            )}
          </Box>
        </HStack>
        <IconButton
          aria-label={
            isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"
          }
          size="sm"
          variant="ghost"
          color="nvr.text.secondary"
          _hover={{ bg: "nvr.bg.muted", color: "nvr.text.primary" }}
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
          p={2}
          opacity={isCollapsed ? 0 : 1}
          pointerEvents={isCollapsed ? "none" : "auto"}
          transition="opacity 0.25s ease-in-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isCollapsed ? "translateY(10px)" : "translateY(0)"}
        >
          <VStack gap={2} align="stretch">
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
          py={2}
          px={1}
          opacity={isCollapsed ? 1 : 0}
          pointerEvents={isCollapsed ? "auto" : "none"}
          transition="opacity 0.25s ease-in-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isCollapsed ? "translateY(0)" : "translateY(-10px)"}
        >
          <VStack gap={2} w="full" align="center">
            {list.map((cam) => {
              if (cam.loading) {
                return (
                  <Tooltip
                    key={cam.dev}
                    content={cam.name}
                    positioning={{ placement: "right" }}
                    showArrow
                  >
                    <Box
                      p={2.5}
                      borderRadius="full"
                      bg="nvr.bg.muted"
                      borderWidth="2px"
                      borderColor="nvr.border.default"
                      color="nvr.brand.primary"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minW="38px"
                      minH="38px"
                    >
                      <Loader2
                        className="animate-spin"
                        size={18}
                        color="#2563eb"
                      />
                    </Box>
                  </Tooltip>
                );
              }

              if (cam.offline) {
                return (
                  <Tooltip
                    key={cam.dev}
                    content={cam.name}
                    positioning={{ placement: "right" }}
                    showArrow
                  >
                    <Box
                      p={2.5}
                      borderRadius="full"
                      bg="nvr.bg.muted"
                      borderWidth="2px"
                      borderColor="red.500"
                      color="red.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minW="38px"
                      minH="38px"
                    >
                      <AlertTriangle size={18} />
                    </Box>
                  </Tooltip>
                );
              }

              const isStreaming = cam.streaming;
              const isToggling = !!togglingDevs[cam.dev];
              const titleText = `${formatDeviceName(cam.dev)} - ${
                isToggling
                  ? "Cambiando estado..."
                  : isStreaming
                    ? "Apagar Cámara"
                    : "Visualizar Cámara"
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
                    bg={isStreaming ? "nvr.brand.activeBg" : "nvr.bg.muted"}
                    borderWidth="2px"
                    borderColor={
                      isStreaming ? "nvr.brand.primary" : "nvr.border.default"
                    }
                    color={
                      isStreaming
                        ? "nvr.brand.primaryText"
                        : "nvr.text.secondary"
                    }
                    cursor={isToggling ? "not-allowed" : "pointer"}
                    onClick={() => {
                      if (isToggling) return;
                      handleToggleCamera(cam);
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={
                      !isToggling
                        ? {
                            borderColor: isStreaming
                              ? "nvr.brand.activeHoverBorder"
                              : "gray.400",
                            bg: isStreaming
                              ? "nvr.brand.activeHoverBg"
                              : "nvr.bg.muted",
                            boxShadow: isStreaming
                              ? "0 0 10px rgba(37, 99, 235, 0.2)"
                              : "none",
                          }
                        : undefined
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minW="38px"
                    minH="38px"
                  >
                    {isToggling ? (
                      <BeatLoader
                        size={3}
                        color={isStreaming ? "#2563eb" : "#4b5563"}
                      />
                    ) : (
                      <Video size={18} />
                    )}
                    {isStreaming && !isToggling && (
                      <Box
                        position="absolute"
                        top="0"
                        right="0"
                        w="2.5"
                        h="2.5"
                        bg="nvr.brand.primary"
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
        p={2}
        borderTopWidth="1px"
        borderColor="nvr.border.subtle"
        bg="nvr.bg.sidebar"
        w="full"
        zIndex={10}
      >
        {isCollapsed ? (
          <VStack gap={2} align="center">
            <Tooltip
              content="Estado de Servidor"
              positioning={{ placement: "right" }}
              showArrow
            >
              <IconButton
                size="sm"
                variant="surface"
                colorPalette="gray"
                aria-label="Estado de Servidor"
                onClick={handleOpenDebug}
              >
                <Activity size={18} />
              </IconButton>
            </Tooltip>
            {userRole === "admin" && (
              <>
                <Tooltip
                  content="Gestión de Usuarios"
                  positioning={{ placement: "right" }}
                  showArrow
                >
                  <IconButton
                    size="sm"
                    variant="surface"
                    colorPalette="blue"
                    aria-label="Gestión de Usuarios"
                    onClick={() => setIsUserManagementOpen(true)}
                  >
                    <Users size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  content="Gestión de fuentes"
                  positioning={{ placement: "right" }}
                  showArrow
                >
                  <IconButton
                    size="sm"
                    variant="surface"
                    colorPalette="teal"
                    aria-label="Gestión de fuentes"
                    onClick={() => setIsNodeManagementOpen(true)}
                  >
                    <Server size={18} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip
              content="Cerrar sesión"
              positioning={{ placement: "right" }}
              showArrow
            >
              <IconButton
                id="logout-btn-collapsed"
                size="sm"
                variant="surface"
                colorPalette="red"
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
              onClick={handleOpenDebug}
              fontWeight="semibold"
              justifyContent="center"
              gap={2}
            >
              <Activity size={16} />
              <Text fontSize="xs">Estado de Servidor</Text>
            </Button>
            {userRole === "admin" && (
              <>
                <Tooltip content="Gestión de Usuarios" showArrow>
                  <IconButton
                    size="sm"
                    variant="surface"
                    colorPalette="blue"
                    aria-label="Gestión de Usuarios"
                    onClick={() => setIsUserManagementOpen(true)}
                  >
                    <Users size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Gestión de fuentes" showArrow>
                  <IconButton
                    size="sm"
                    variant="surface"
                    colorPalette="teal"
                    aria-label="Gestión de fuentes"
                    onClick={() => setIsNodeManagementOpen(true)}
                  >
                    <Server size={16} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip content="Cerrar sesión" showArrow>
              <IconButton
                id="logout-btn"
                size="sm"
                variant="surface"
                colorPalette="red"
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
        <NodeManagementModal
          isOpen={isNodeManagementOpen}
          onClose={() => setIsNodeManagementOpen(false)}
        />
      </Portal>
    </Box>
  );
};

export default Sidebar;
