import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  IconButton,
  Center,
  Portal,
} from "@chakra-ui/react";
import { BeatLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import {
  Activity,
  RefreshCw,
  Cpu,
  Check,
  Copy,
  Terminal,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { cameraApi } from "../api/camera.api.js";
import { fetchCameras } from "../store/slices/cameraSlice";

export const FfmpegDebugModal = ({ isOpen, onClose, isClosing }) => {
  const dispatch = useDispatch();

  // Estados locales para la depuración de FFmpeg
  const [debugStreams, setDebugStreams] = useState([]);
  const [isDebuggingLoading, setIsDebuggingLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [expandedCmds, setExpandedCmds] = useState(new Set());
  const [copiedPid, setCopiedPid] = useState(null);
  const [killingPids, setKillingPids] = useState(new Set());

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
      setDebugError(
        err.response?.data?.details ||
          err.message ||
          "Error al conectar con el servidor."
      );
    } finally {
      setIsDebuggingLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchFfmpegDebug();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
      onClose();
      dispatch(fetchCameras());
    } catch (err) {
      console.error(err);
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

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(8px)"
        zIndex={1900}
        onClick={onClose}
        className={isClosing ? "animate-backdrop-out" : "animate-backdrop-in"}
      />

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
          className={isClosing ? "animate-modal-out" : "animate-modal-in"}
          transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        >
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
                    <Badge colorPalette="blue" variant="subtle" borderRadius="full">
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
                onClick={onClose}
                borderRadius="xl"
              >
                Cerrar
              </Button>
            </HStack>
          </Flex>

          <Box flex="1" overflowY="auto" p={4} bg="gray.50/50">
            {isDebuggingLoading && (
              <Center py={16} flexDirection="column" gap={4}>
                <BeatLoader size={12} color="#2563eb" />
                <Text fontSize="sm" color="gray.500">
                  Analizando procesos en el host remoto...
                </Text>
              </Center>
            )}

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
                    <Flex justify="space-between" align="center" mb={3}>
                      <HStack gap={2}>
                        <Box className="pulse-blue-dot" />
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
                        <Badge size="sm" colorPalette="blue" variant="outline" borderRadius="md" fontSize="2xs">
                          HW: VAAPI
                        </Badge>
                      )}
                    </HStack>

                    <VStack gap={3.5} align="stretch" mb={4}>
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
                            bg={stream.cpu > 80 ? "red.500" : stream.cpu > 50 ? "orange.500" : "blue.500"}
                            borderRadius="full"
                            transition="width 0.4s ease-out"
                          />
                        </Box>
                      </Box>

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
                            w={`${Math.min(stream.mem * 10, 100)}%`}
                            h="full"
                            bg={stream.mem > 80 ? "red.500" : stream.mem > 60 ? "orange.500" : "blue.500"}
                            borderRadius="full"
                            transition="width 0.4s ease-out"
                          />
                        </Box>
                      </Box>
                    </VStack>

                    <HStack justify="space-between" fontSize="2xs" color="gray.500" py={1.5} borderTopWidth="1px" borderBottomWidth="1px" borderColor="gray.100" mb={3}>
                      <Text>Iniciado: <Text as="span" fontWeight="semibold" color="gray.700">{stream.start}</Text></Text>
                      <Text>Tiempo CPU: <Text as="span" fontWeight="semibold" color="gray.700">{stream.time}</Text></Text>
                      <Text>Usuario: <Text as="span" fontWeight="semibold" color="gray.700">{stream.user}</Text></Text>
                    </HStack>

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
  );
};
