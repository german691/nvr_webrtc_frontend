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
import { Activity, RefreshCw, Terminal, Trash2 } from "lucide-react";
import { useFfmpegDebug } from "../hooks/useFfmpegDebug";
import FfmpegStreamCard from "./ui/FfmpegStreamCard";

/**
 * Modal de visualización y orquestación para procesos FFmpeg remotos.
 * Permite monitorear CPU, Memoria, URL RTSP y comandos activos en el host de borde.
 */
export const FfmpegDebugModal = ({ isOpen, onClose, isClosing }) => {
  const {
    debugStreams,
    isDebuggingLoading,
    debugError,
    expandedCmds,
    copiedPid,
    killingPids,
    fetchFfmpegDebug,
    handleKillProcess,
    handleKillAll,
    toggleCmd,
    handleCopy,
  } = useFfmpegDebug(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <Portal>
      {/* CAPA DE FONDO OSCURA CON BLUR */}
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

      {/* CONTENEDOR CENTRADO DEL MODAL */}
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
          bg="nvr.bg.modal"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="nvr.border.default"
          shadow="2xl"
          pointerEvents="auto"
          display="flex"
          flexDirection="column"
          maxH="85vh"
          overflow="hidden"
          className={isClosing ? "animate-modal-out" : "animate-modal-in"}
          transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        >
          {/* CABECERA DEL MODAL */}
          <Flex
            p={3}
            borderBottomWidth="1px"
            borderColor="nvr.border.subtle"
            justify="space-between"
            align="center"
            bg="nvr.bg.headerBg"
          >
            <HStack gap={3}>
              <Center
                p={2}
                borderRadius="xl"
                bg="nvr.brand.activeBg"
                color="nvr.brand.primaryText"
              >
                <Activity size={20} />
              </Center>
              <VStack align="stretch" gap={0}>
                <HStack gap={2}>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color="nvr.text.primary"
                  >
                    Depuración de Flujos FFmpeg
                  </Text>
                  {!isDebuggingLoading &&
                    !debugError &&
                    debugStreams.length > 0 && (
                      <Badge
                        colorPalette="blue"
                        variant="subtle"
                        borderRadius="full"
                      >
                        {debugStreams.length} ACTIVO
                        {debugStreams.length > 1 ? "S" : ""}
                      </Badge>
                    )}
                </HStack>
                <Text fontSize="2xs" color="nvr.text.secondary">
                  Métricas de rendimiento y consumo del hardware de captura
                </Text>
              </VStack>
            </HStack>
            <HStack gap={2}>
              {!isDebuggingLoading &&
                !debugError &&
                debugStreams.length > 0 && (
                  <Button
                    size="xs"
                    variant="subtle"
                    colorPalette="red"
                    onClick={handleKillAll}
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
              >
                <RefreshCw
                  size={16}
                  className={isDebuggingLoading ? "spin-animation" : ""}
                />
              </IconButton>
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </HStack>
          </Flex>

          {/* CUERPO CENTRAL SCROLLABLE */}
          <Box flex="1" overflowY="auto" p={3} bg="nvr.bg.muted">
            {/* CARGANDO */}
            {isDebuggingLoading && (
              <Center py={16} flexDirection="column" gap={4}>
                <BeatLoader size={12} color="#2563eb" />
                <Text fontSize="sm" color="nvr.text.secondary">
                  Analizando procesos en el host remoto...
                </Text>
              </Center>
            )}

            {/* ERROR */}
            {!isDebuggingLoading && debugError && (
              <Center py={12} flexDirection="column" gap={3} px={4}>
                <Text
                  color="nvr.brand.danger"
                  fontWeight="medium"
                  fontSize="sm"
                  textAlign="center"
                >
                  {debugError}
                </Text>
                <Button
                  size="sm"
                  variant="subtle"
                  colorPalette="blue"
                  onClick={fetchFfmpegDebug}
                >
                  Reintentar Consulta
                </Button>
              </Center>
            )}

            {/* VACÍO (SIN PROCESOS ACTIVOS) */}
            {!isDebuggingLoading &&
              !debugError &&
              debugStreams.length === 0 && (
                <Center py={16} flexDirection="column" gap={4} px={6}>
                  <Center
                    p={4}
                    borderRadius="full"
                    bg="nvr.bg.muted"
                    color="nvr.text.secondary"
                  >
                    <Terminal size={32} />
                  </Center>
                  <VStack gap={1} align="center">
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="nvr.text.primary"
                    >
                      No hay transmisiones FFmpeg activas
                    </Text>
                    <Text
                      fontSize="xs"
                      color="nvr.text.secondary"
                      textAlign="center"
                      maxW="sm"
                    >
                      Todos los canales de hardware de captura se encuentran
                      liberados. Los flujos se inician de forma dinámica al
                      activar la visualización de una cámara.
                    </Text>
                  </VStack>
                </Center>
              )}

            {/* LISTADO DE PROCESOS */}
            {!isDebuggingLoading && !debugError && debugStreams.length > 0 && (
              <VStack gap={4} align="stretch">
                {debugStreams.map((stream) => (
                  <FfmpegStreamCard
                    key={stream.pid}
                    stream={stream}
                    isExpanded={expandedCmds.has(stream.pid)}
                    onToggleExpand={() => toggleCmd(stream.pid)}
                    isCopied={copiedPid === stream.pid}
                    onCopy={() => handleCopy(stream.rtspUrl, stream.pid)}
                    isKilling={killingPids.has(stream.pid)}
                    onKill={() => handleKillProcess(stream.pid)}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      </Center>
    </Portal>
  );
};

export default FfmpegDebugModal;
