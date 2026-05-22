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
  Badge,
  Button,
  Portal,
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Activity,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  XCircle,
  Trash2,
} from "lucide-react";
import CameraControlCard from "./CameraControlCard";
import logoImg from "../assets/logoh.png";
import { Tooltip } from "./ui/tooltip";
import { formatDeviceName } from "../utils/camera.js";
import { cameraApi } from "../api/camera.api.js";
import { fetchCameras } from "../store/slices/cameraSlice";


const Sidebar = () => {
  const { list, isLoading, error } = useSelector((state) => state.cameras);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const dispatch = useDispatch();

  // Estados locales para la depuración de FFmpeg
  const [isFfmpegOpen, setIsFfmpegOpen] = useState(false);
  const [isFfmpegClosing, setIsFfmpegClosing] = useState(false);
  const [debugStreams, setDebugStreams] = useState([]);
  const [isDebuggingLoading, setIsDebuggingLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [expandedCmds, setExpandedCmds] = useState(new Set());
  const [copiedPid, setCopiedPid] = useState(null);
  const [killingPids, setKillingPids] = useState(new Set());

  const handleOpenDebug = () => {
    setIsFfmpegOpen(true);
    setIsFfmpegClosing(false);
    fetchFfmpegDebug();
  };

  const handleCloseDebug = () => {
    setIsFfmpegClosing(true);
    setTimeout(() => {
      setIsFfmpegOpen(false);
      setIsFfmpegClosing(false);
    }, 280); // Ligeramente por debajo de los 300ms de CSS para un desmontado limpio
  };

  const handleKillProcess = async (pid) => {
    setKillingPids((prev) => {
      const next = new Set(prev);
      next.add(pid);
      return next;
    });
    try {
      await cameraApi.killFfmpegProcess(pid);
      dispatch(fetchCameras());
      await fetchFfmpegDebug();
    } catch (err) {
      console.error(err);
    } finally {
      setKillingPids((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
    }
  };

  const handleKillAll = async () => {
    setIsDebuggingLoading(true);
    try {
      await cameraApi.killAllFfmpegProcesses();
      handleCloseDebug();
      dispatch(fetchCameras());
    } catch (err) {
      console.error(err);
    } finally {
      setIsDebuggingLoading(false);
    }
  };


  const fetchFfmpegDebug = async () => {
    setIsDebuggingLoading(true);
    setDebugError(null);
    try {
      const data = await cameraApi.getFfmpegDebug();
      if (data.status === "success") {
        setDebugStreams(data.streams || []);
      } else {
        setDebugError("No se pudo consultar el estado de FFmpeg.");
      }
    } catch (err) {
      setDebugError(err.response?.data?.details || err.message || "Error al conectar con el servidor.");
    } finally {
      setIsDebuggingLoading(false);
    }
  };

  const toggleCmd = (pid) => {
    setExpandedCmds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const handleCopy = (url, pid) => {
    navigator.clipboard.writeText(url);
    setCopiedPid(pid);
    setTimeout(() => {
      setCopiedPid(null);
    }, 1500);
  };


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

      {/* Footer Fijo para Depuración FFmpeg */}
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
          <Center>
            <Tooltip content="Estado FFmpeg" positioning={{ placement: "right" }} showArrow>
              <IconButton
                size="sm"
                variant="outline"
                colorPalette="blue"
                borderRadius="xl"
                aria-label="Estado FFmpeg"
                onClick={handleOpenDebug}
                _hover={{ bg: "blue.50", borderColor: "blue.300" }}
              >
                <Activity size={18} />
              </IconButton>
            </Tooltip>
          </Center>
        ) : (
          <Button
            w="full"
            variant="outline"
            colorPalette="blue"
            size="sm"
            borderRadius="xl"
            onClick={handleOpenDebug}
            fontWeight="semibold"
            justifyContent="center"
            gap={2}
            _hover={{ bg: "blue.50", borderColor: "blue.300" }}
          >
            <Activity size={16} />
            <Text fontSize="xs">Estado FFmpeg</Text>
          </Button>
        )}
      </Box>

      {/* Modal de Depuración FFmpeg */}
      {isFfmpegOpen && (
        <Portal>
          {/* Backdrop con Blur y Fade */}
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            backdropFilter="blur(8px)"
            zIndex={1900}
            onClick={handleCloseDebug}
            className={isFfmpegClosing ? "animate-backdrop-out" : "animate-backdrop-in"}
          />

          {/* Contenedor del Modal */}
          <Center
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={2000}
            pointerEvents="none"
            p={4}
          >
            {/* Cuerpo del Modal */}
            <Box
              w="full"
              maxW="2xl"
              bg="white"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="2xl"
              pointerEvents="auto"
              display="flex"
              flexDirection="column"
              maxH="85vh"
              overflow="hidden"
              className={isFfmpegClosing ? "animate-modal-out" : "animate-modal-in"}
              transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            >
              {/* Header */}
              <Flex
                p={4}
                borderBottomWidth="1px"
                borderColor="gray.100"
                justify="space-between"
                align="center"
                bg="gray.50"
              >
                <HStack gap={3}>
                  <Center p={2} borderRadius="xl" bg="blue.50" color="blue.600">
                    <Activity size={20} />
                  </Center>
                  <VStack align="stretch" gap={0}>
                    <HStack gap={2}>
                      <Text fontWeight="bold" fontSize="md" color="gray.800">
                        Depuración de Flujos FFmpeg
                      </Text>
                      {!isDebuggingLoading && !debugError && debugStreams.length > 0 && (
                        <Badge colorPalette="green" variant="subtle" borderRadius="full">
                          {debugStreams.length} ACTIVO{debugStreams.length > 1 ? "S" : ""}
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="2xs" color="gray.500">
                      Métricas de rendimiento y consumo del hardware de captura
                    </Text>
                  </VStack>
                </HStack>
                <HStack gap={2}>
                  {!isDebuggingLoading && !debugError && debugStreams.length > 0 && (
                    <Button
                      size="xs"
                      variant="subtle"
                      colorPalette="red"
                      onClick={handleKillAll}
                      borderRadius="xl"
                      gap={1}
                    >
                      <Trash2 size={12} />
                      Detener Todos
                    </Button>
                  )}
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="gray"
                    onClick={fetchFfmpegDebug}
                    title="Actualizar datos"
                    disabled={isDebuggingLoading}
                    borderRadius="xl"
                  >
                    <RefreshCw size={16} className={isDebuggingLoading ? "spin-animation" : ""} />
                  </IconButton>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    onClick={handleCloseDebug}
                    borderRadius="xl"
                  >
                    Cerrar
                  </Button>
                </HStack>
              </Flex>

              {/* Body */}
              <Box flex="1" overflowY="auto" p={4} bg="gray.50/50">
                {/* Cargando */}
                {isDebuggingLoading && (
                  <Center py={16} flexDirection="column" gap={4}>
                    <Spinner size="lg" color="blue.500" />
                    <Text fontSize="sm" color="gray.500">
                      Analizando procesos en el host remoto...
                    </Text>
                  </Center>
                )}

                {/* Error */}
                {!isDebuggingLoading && debugError && (
                  <Center py={12} flexDirection="column" gap={3} px={4}>
                    <Text color="red.500" fontWeight="medium" fontSize="sm" textAlign="center">
                      {debugError}
                    </Text>
                    <Button size="sm" variant="subtle" colorPalette="blue" onClick={fetchFfmpegDebug} borderRadius="xl">
                      Reintentar Consulta
                    </Button>
                  </Center>
                )}

                {/* Sin Procesos Activos (Vacío) */}
                {!isDebuggingLoading && !debugError && debugStreams.length === 0 && (
                  <Center py={16} flexDirection="column" gap={4} px={6}>
                    <Center p={4} borderRadius="full" bg="gray.100" color="gray.400">
                      <Terminal size={32} />
                    </Center>
                    <VStack gap={1} align="center">
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        No hay transmisiones FFmpeg activas
                      </Text>
                      <Text fontSize="xs" color="gray.500" textAlign="center" maxW="sm">
                        Todos los canales de hardware de captura se encuentran liberados.
                        Los flujos se inician de forma dinámica al activar la visualización de una cámara.
                      </Text>
                    </VStack>
                  </Center>
                )}

                {/* Lista de Streams */}
                {!isDebuggingLoading && !debugError && debugStreams.length > 0 && (
                  <VStack gap={4} align="stretch">
                    {debugStreams.map((stream) => (
                      <Box
                        key={stream.pid}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="xl"
                        p={4}
                        bg="white"
                        shadow="sm"
                        transition="all 0.2s"
                        _hover={{ shadow: "md", borderColor: "gray.300" }}
                      >
                        {/* Header de la tarjeta de proceso */}
                        <Flex justify="space-between" align="center" mb={3}>
                          <HStack gap={2}>
                            <Box className="pulse-green-dot" />
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" fontFamily="mono">
                              {stream.device}
                            </Text>
                          </HStack>
                          <HStack gap={2}>
                            <Badge colorPalette="blue" variant="subtle" fontSize="2xs" borderRadius="md" px={2} py={0.5}>
                              PID: {stream.pid}
                            </Badge>
                            <IconButton
                              size="2xs"
                              variant="subtle"
                              colorPalette="red"
                              borderRadius="lg"
                              aria-label="Detener transmisión"
                              onClick={() => handleKillProcess(stream.pid)}
                              disabled={killingPids.has(stream.pid)}
                              title="Detener transmisión"
                            >
                              <XCircle size={12} />
                            </IconButton>
                          </HStack>
                        </Flex>

                        {/* Specs row */}
                        <HStack gap={1.5} wrap="wrap" mb={4}>
                          <Badge size="sm" colorPalette="gray" variant="outline" borderRadius="md" fontSize="2xs">
                            Resolución: {stream.resolution}
                          </Badge>
                          <Badge size="sm" colorPalette="gray" variant="outline" borderRadius="md" fontSize="2xs">
                            FPS: {stream.fps}
                          </Badge>
                          {stream.bitrate !== "N/A" && (
                            <Badge size="sm" colorPalette="gray" variant="outline" borderRadius="md" fontSize="2xs">
                              Bitrate: {stream.bitrate}
                            </Badge>
                          )}
                          {stream.vaapi !== "N/A" && (
                            <Badge size="sm" colorPalette="teal" variant="outline" borderRadius="md" fontSize="2xs">
                              HW: VAAPI
                            </Badge>
                          )}
                        </HStack>

                        {/* Resource usage indicators */}
                        <VStack gap={3.5} align="stretch" mb={4}>
                          {/* CPU */}
                          <Box>
                            <Flex justify="space-between" mb={1} align="center">
                              <HStack gap={1}>
                                <Cpu size={12} color="gray.500" />
                                <Text fontSize="2xs" fontWeight="bold" color="gray.500">CONSUMO DE CPU</Text>
                              </HStack>
                              <Text fontSize="2xs" fontWeight="extrabold" color="gray.700">
                                {stream.cpu}%
                              </Text>
                            </Flex>
                            <Box w="full" h="2" bg="gray.100" borderRadius="full" overflow="hidden">
                              <Box
                                w={`${Math.min(stream.cpu, 100)}%`}
                                h="full"
                                bg={stream.cpu > 50 ? "orange.500" : "green.500"}
                                borderRadius="full"
                                transition="width 0.4s ease-out"
                              />
                            </Box>
                          </Box>

                          {/* Memoria */}
                          <Box>
                            <Flex justify="space-between" mb={1} align="center">
                              <HStack gap={1}>
                                <Activity size={12} color="gray.500" />
                                <Text fontSize="2xs" fontWeight="bold" color="gray.500">CONSUMO DE MEMORIA</Text>
                              </HStack>
                              <Text fontSize="2xs" fontWeight="extrabold" color="gray.700">
                                {stream.mem}% ({(stream.rss / 1024).toFixed(1)} MB)
                              </Text>
                            </Flex>
                            <Box w="full" h="2" bg="gray.100" borderRadius="full" overflow="hidden">
                              <Box
                                w={`${Math.min(stream.mem * 10, 100)}%`} // visual boost for scale
                                h="full"
                                bg={stream.mem > 5 ? "orange.500" : "blue.500"}
                                borderRadius="full"
                                transition="width 0.4s ease-out"
                              />
                            </Box>
                          </Box>
                        </VStack>

                        {/* Meta y Tiempos */}
                        <HStack justify="space-between" fontSize="2xs" color="gray.500" py={1.5} borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100" mb={3}>
                          <Text>Iniciado: <Text as="span" fontWeight="semibold" color="gray.700">{stream.start}</Text></Text>
                          <Text>Tiempo CPU: <Text as="span" fontWeight="semibold" color="gray.700">{stream.time}</Text></Text>
                          <Text>Usuario: <Text as="span" fontWeight="semibold" color="gray.700">{stream.user}</Text></Text>
                        </HStack>

                        {/* RTSP Destination Url card */}
                        {stream.rtspUrl !== "N/A" && (
                          <Box p={2.5} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200" mb={2}>
                            <Flex align="center" justify="space-between" gap={2}>
                              <VStack align="stretch" gap={0.5} overflow="hidden" flex="1">
                                <Text fontSize="3xs" fontWeight="bold" color="gray.400" letterSpacing="wider">URL DE SALIDA RTSP</Text>
                                <Text fontSize="2xs" fontFamily="mono" color="gray.600" truncate>
                                  {stream.rtspUrl}
                                </Text>
                              </VStack>
                              <Button
                                size="xs"
                                variant="subtle"
                                colorPalette={copiedPid === stream.pid ? "green" : "blue"}
                                onClick={() => handleCopy(stream.rtspUrl, stream.pid)}
                                borderRadius="lg"
                                gap={1}
                                flexShrink={0}
                              >
                                {copiedPid === stream.pid ? <Check size={12} /> : <Copy size={12} />}
                                <Text fontSize="2xs" fontWeight="semibold">
                                  {copiedPid === stream.pid ? "Copiado" : "Copiar"}
                                </Text>
                              </Button>
                            </Flex>
                          </Box>
                        )}

                        {/* Accordion command box */}
                        <Box>
                          <Button
                            size="2xs"
                            variant="ghost"
                            colorPalette="gray"
                            onClick={() => toggleCmd(stream.pid)}
                            justifyContent="space-between"
                            w="full"
                            px={0}
                            py={1}
                            _hover={{ bg: "transparent" }}
                          >
                            <Text fontSize="2xs" fontWeight="semibold" color="gray.650">Comando FFmpeg completo</Text>
                            {expandedCmds.has(stream.pid) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </Button>
                          {expandedCmds.has(stream.pid) && (
                            <Box
                              mt={1.5}
                              p={2.5}
                              bg="gray.900"
                              color="green.400"
                              fontFamily="mono"
                              fontSize="3xs"
                              borderRadius="xl"
                              overflowX="auto"
                              whiteSpace="pre-wrap"
                              wordBreak="break-all"
                              borderWidth="1px"
                              borderColor="gray.850"
                              maxH="150px"
                              overflowY="auto"
                              shadow="inner"
                              style={{
                                color: "#4ade80",
                                background: "#111827",
                                border: "1px solid #1f2937"
                              }}
                            >
                              {stream.command}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
          </Center>
        </Portal>
      )}
    </Box>
  );
};

export default Sidebar;
