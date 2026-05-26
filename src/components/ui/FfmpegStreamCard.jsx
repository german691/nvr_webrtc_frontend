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
} from "@chakra-ui/react";
import {
  Cpu,
  Activity,
  Check,
  Copy,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * Componente puro de presentación para renderizar una tarjeta de proceso FFmpeg.
 * 
 * @param {object} stream - Datos del proceso.
 * @param {boolean} isExpanded - Si el comando FFmpeg completo está desplegado.
 * @param {function} onToggleExpand - Callback para expandir/colapsar.
 * @param {boolean} isCopied - Si la URL RTSP fue copiada.
 * @param {function} onCopy - Callback para copiar al portapapeles.
 * @param {boolean} isKilling - Si el proceso está siendo detenido.
 * @param {function} onKill - Callback para matar el proceso.
 */
export const FfmpegStreamCard = ({
  stream,
  isExpanded,
  onToggleExpand,
  isCopied,
  onCopy,
  isKilling,
  onKill,
}) => {
  return (
    <Box
      borderWidth="1px"
      borderColor="nvr.border.default"
      borderRadius="lg"
      p={3}
      bg="nvr.bg.card"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: "md", borderColor: "nvr.border.interactive" }}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <HStack gap={2}>
          <Box className="pulse-blue-dot" />
          <Text fontWeight="bold" fontSize="sm" color="nvr.text.primary" fontFamily="mono">
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
            aria-label="Detener transmisión"
            onClick={onKill}
            disabled={isKilling}
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
              <Cpu size={12} color="nvr.text.secondary" />
              <Text fontSize="2xs" fontWeight="bold" color="nvr.text.secondary">CONSUMO DE CPU</Text>
            </HStack>
            <Text fontSize="2xs" fontWeight="extrabold" color="nvr.text.primary">
              {stream.cpu}%
            </Text>
          </Flex>
          <Box w="full" h="2" bg="nvr.bg.muted" borderRadius="full" overflow="hidden">
            <Box
              w={`${Math.min(stream.cpu, 100)}%`}
              h="full"
              bg={stream.cpu > 80 ? "nvr.brand.danger" : stream.cpu > 50 ? "orange.500" : "nvr.brand.primary"}
              borderRadius="full"
              transition="width 0.4s ease-out"
            />
          </Box>
        </Box>

        <Box>
          <Flex justify="space-between" mb={1} align="center">
            <HStack gap={1}>
              <Activity size={12} color="nvr.text.secondary" />
              <Text fontSize="2xs" fontWeight="bold" color="nvr.text.secondary">CONSUMO DE MEMORIA</Text>
            </HStack>
            <Text fontSize="2xs" fontWeight="extrabold" color="nvr.text.primary">
              {stream.mem}% ({(stream.rss / 1024).toFixed(1)} MB)
            </Text>
          </Flex>
          <Box w="full" h="2" bg="nvr.bg.muted" borderRadius="full" overflow="hidden">
            <Box
              w={`${Math.min(stream.mem * 10, 100)}%`}
              h="full"
              bg={stream.mem > 80 ? "nvr.brand.danger" : stream.mem > 60 ? "orange.500" : "nvr.brand.primary"}
              borderRadius="full"
              transition="width 0.4s ease-out"
            />
          </Box>
        </Box>
      </VStack>

      <HStack justify="space-between" fontSize="2xs" color="nvr.text.secondary" py={1.5} borderTopWidth="1px" borderBottomWidth="1px" borderColor="nvr.border.subtle" mb={3}>
        <Text>Iniciado: <Text as="span" fontWeight="semibold" color="nvr.text.primary">{stream.start}</Text></Text>
        <Text>Tiempo CPU: <Text as="span" fontWeight="semibold" color="nvr.text.primary">{stream.time}</Text></Text>
        <Text>Usuario: <Text as="span" fontWeight="semibold" color="nvr.text.primary">{stream.user}</Text></Text>
      </HStack>

      {stream.rtspUrl !== "N/A" && (
        <Box p={2} bg="nvr.bg.muted" borderRadius="lg" borderWidth="1px" borderColor="nvr.border.default" mb={2}>
          <Flex align="center" justify="space-between" gap={2}>
            <VStack align="stretch" gap={0.5} overflow="hidden" flex="1">
              <Text fontSize="3xs" fontWeight="bold" color="nvr.text.secondary" letterSpacing="wider">URL DE SALIDA RTSP</Text>
              <Text fontSize="2xs" fontFamily="mono" color="nvr.text.secondary" truncate>
                {stream.rtspUrl}
              </Text>
            </VStack>
            <Button
              size="xs"
              variant="subtle"
              colorPalette={isCopied ? "green" : "blue"}
              onClick={onCopy}
              gap={1}
              flexShrink={0}
            >
              {isCopied ? <Check size={12} /> : <Copy size={12} />}
              <Text fontSize="2xs" fontWeight="semibold">
                {isCopied ? "Copiado" : "Copiar"}
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
          onClick={onToggleExpand}
          justifyContent="space-between"
          w="full"
          px={0}
          py={1}
          _hover={{ bg: "transparent" }}
        >
          <Text fontSize="2xs" fontWeight="semibold" color="nvr.text.secondary">Comando FFmpeg completo</Text>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Button>
        {isExpanded && (
          <Box
            mt={1.5}
            p={2.5}
            bg="nvr.bg.console"
            color="nvr.text.console"
            fontFamily="mono"
            fontSize="3xs"
            borderRadius="xl"
            overflowX="auto"
            whiteSpace="pre-wrap"
            wordBreak="break-all"
            borderWidth="1px"
            borderColor="gray.800"
            maxH="150px"
            overflowY="auto"
            shadow="inner"
          >
            {stream.command}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FfmpegStreamCard;
