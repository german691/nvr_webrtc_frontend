import { useState, useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Flex,
  IconButton,
  Popover,
  Portal,
  Input,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleStream,
  fetchCamerasForNode,
  togglePtzOverlay,
} from "../store/slices/cameraSlice";
import {
  formatDeviceName,
  BITRATES,
  getSortedResolutions,
  getSortedFps,
} from "../utils/camera.js";
import { UvcControlPanel } from "./UvcControlPanel.jsx";
import { StreamSettings } from "./StreamSettings.jsx";
import { Settings, ChevronDown, ChevronUp, Gamepad2, Pencil, Check, X } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { Tooltip } from "./ui/tooltip";
import { PtzJoystick } from "./PtzJoystick.jsx";
import { cameraApi } from "../api/camera.api.js";

const CameraControlCard = ({ camera }) => {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.cameras.list);
  const realCameras = useMemo(() => {
    return list
      .filter((c) => !c.loading && !c.offline)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
  }, [list]);
  const cameraIndex = useMemo(() => realCameras.findIndex((c) => c.dev === camera.dev), [realCameras, camera.dev]);
  const cameraNumber = cameraIndex !== -1 ? cameraIndex + 1 : null;
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isOfflineCardCollapsed, setIsOfflineCardCollapsed] = useState(false);

  // Estados para renombrado y rotulado persistente
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleStartRename = () => {
    // Extraer el nombre limpio omitiendo el sufijo de IP o etiqueta del nodo en paréntesis
    const cleanName = camera.name ? camera.name.replace(/ \(([^)]+)\)$/, "") : "";
    setTempName(cleanName);
    setIsEditingName(true);
  };

  const handleSaveRename = async () => {
    if (!tempName.trim()) return;
    setIsSavingName(true);
    try {
      const nodeIp = camera.dev.includes(":") ? camera.dev.split(":")[0] : null;
      if (!nodeIp || !camera.persistent_path) {
        throw new Error("Falta la dirección IP del nodo o la ruta de hardware de la cámara.");
      }

      await cameraApi.saveCameraLabel({
        nodeIp,
        persistentPath: camera.persistent_path,
        customName: tempName.trim(),
      });

      // Recargar la lista de cámaras del nodo para aplicar el nombre inyectado al instante
      dispatch(fetchCamerasForNode(nodeIp));
      setIsEditingName(false);
    } catch (error) {
      console.error("Fallo al actualizar el rótulo de la cámara:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const sortedResolutions = useMemo(
    () => getSortedResolutions(camera.modes || []),
    [camera.modes],
  );
  const sortedFps = useMemo(
    () => getSortedFps(camera.modes || []),
    [camera.modes],
  );

  const initialRes = sortedResolutions.includes("1920x1080")
    ? "1920x1080"
    : sortedResolutions[0];

  const initialFps = sortedFps.includes("30") ? "30" : sortedFps[0];

  const [res, setRes] = useState(initialRes);
  const [fps, setFps] = useState(initialFps);
  const [bitrate, setBitrate] = useState(BITRATES[1].value);
  const [isToggling, setIsToggling] = useState(false);

  if (camera.loading) {
    return (
      <Box
        borderWidth="1px"
        borderColor="nvr.border.default"
        borderRadius="xl"
        p={4}
        bg="nvr.bg.card"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={3}
        position="relative"
        overflow="hidden"
        className="pulse-skeleton"
        minH="90px"
        textAlign="center"
      >
        <BeatLoader size={6} color="#2563eb" />
        <Text
          fontWeight="semibold"
          fontSize="xs"
          color="nvr.text.secondary"
          whiteSpace="normal"
          wordBreak="break-word"
        >
          {camera.name}
        </Text>
      </Box>
    );
  }

  if (camera.offline) {
    const failedIp = camera.dev.replace("offline:", "");

    const handleReconnect = () => {
      setIsReconnecting(true);
      dispatch(fetchCamerasForNode(failedIp)).finally(() => {
        setIsReconnecting(false);
      });
    };

    return (
      <Box
        borderWidth="1px"
        borderColor="red.500"
        borderRadius="xl"
        p={3.5}
        bg="nvr.bg.card"
        display="flex"
        flexDirection="column"
        gap={isOfflineCardCollapsed ? 1 : 2.5}
        position="relative"
        transition="all 0.3s ease"
        _hover={{ borderColor: "red.400" }}
      >
        <HStack justify="space-between" align="start" mb={0.5}>
          <VStack align="start" gap={0} flex="1">
            <Text
              fontWeight="bold"
              fontSize="sm"
              color="red.600"
              whiteSpace="normal"
              wordBreak="break-word"
            >
              {camera.name}
            </Text>
          </VStack>
          <HStack gap={1.5} align="center">
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="gray"
              onClick={() => setIsOfflineCardCollapsed(!isOfflineCardCollapsed)}
              aria-label={isOfflineCardCollapsed ? "Expandir" : "Colapsar"}
            >
              {isOfflineCardCollapsed ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronUp size={14} />
              )}
            </IconButton>
          </HStack>
        </HStack>
        {!isOfflineCardCollapsed && (
          <>
            <Text fontSize="2xs" color="nvr.text.secondary" lineHeight="tall">
              No se pudo establecer conexión SSH con este nodo. Verifique si el
              equipo está encendido y conectada a la red local.
            </Text>
            {camera.error && (
              <Text
                fontSize="2xs"
                color="red.600"
                fontFamily="mono"
                bg="red.50"
                p={1.5}
                borderRadius="md"
                overflowX="auto"
                maxH="60px"
                whiteSpace="pre-wrap"
              >
                {camera.error}
              </Text>
            )}
            <Button
              size="xs"
              colorPalette="red"
              variant="outline"
              mt={1}
              onClick={handleReconnect}
              loading={isReconnecting}
              spinner={<BeatLoader size={6} color="#dc2626" />}
              w="full"
              fontWeight="semibold"
              fontSize="2xs"
            >
              Reconectar Nodo
            </Button>
          </>
        )}
      </Box>
    );
  }

  const displayRes =
    camera.streaming && camera.active_settings?.resolution
      ? camera.active_settings.resolution
      : res;
  const displayFps =
    camera.streaming && camera.active_settings?.fps
      ? camera.active_settings.fps
      : fps;
  const displayBitrate =
    camera.streaming && camera.active_settings?.bitrate
      ? camera.active_settings.bitrate
      : bitrate;

  const handleSetRes = async (newRes) => {
    setRes(newRes);
    if (camera.streaming) {
      setIsToggling(true);
      try {
        await dispatch(
          toggleStream({
            dev: camera.dev,
            resolution: newRes,
            fps: displayFps,
            bitrate: displayBitrate,
            cleanBitrate: displayBitrate,
            action: "start",
          }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to set resolution:", error);
      } finally {
        setIsToggling(false);
      }
    }
  };

  const handleSetFps = async (newFps) => {
    setFps(newFps);
    if (camera.streaming) {
      setIsToggling(true);
      try {
        await dispatch(
          toggleStream({
            dev: camera.dev,
            resolution: displayRes,
            fps: newFps,
            bitrate: displayBitrate,
            cleanBitrate: displayBitrate,
            action: "start",
          }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to set FPS:", error);
      } finally {
        setIsToggling(false);
      }
    }
  };

  const handleSetBitrate = async (newBitrate) => {
    setBitrate(newBitrate);
    if (camera.streaming) {
      setIsToggling(true);
      try {
        await dispatch(
          toggleStream({
            dev: camera.dev,
            resolution: displayRes,
            fps: displayFps,
            bitrate: newBitrate,
            cleanBitrate: newBitrate,
            action: "start",
          }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to set bitrate:", error);
      } finally {
        setIsToggling(false);
      }
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (camera.streaming) {
        await dispatch(
          toggleStream({ dev: camera.dev, action: "stop" }),
        ).unwrap();
      } else {
        await dispatch(
          toggleStream({
            dev: camera.dev,
            resolution: displayRes,
            fps: displayFps,
            bitrate: displayBitrate,
            cleanBitrate: displayBitrate,
            action: "start",
          }),
        ).unwrap();
      }
    } catch (error) {
      console.error("Failed to toggle stream:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="nvr.border.default"
      borderRadius="xl"
      p={2}
      bg="nvr.bg.card"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "nvr.border.interactive",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditingName ? (
        <HStack w="full" gap={1.5} mb={2}>
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            size="xs"
            fontSize="xs"
            h="24px"
            bg="white"
            borderRadius="md"
            borderColor="nvr.border.default"
            px={2}
            autoFocus
            disabled={isSavingName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") setIsEditingName(false);
            }}
          />
          <IconButton
            size="2xs"
            h="24px"
            w="24px"
            variant="solid"
            colorPalette="blue"
            aria-label="Confirmar nombre"
            onClick={handleSaveRename}
            loading={isSavingName}
          >
            <Check size={12} />
          </IconButton>
          <IconButton
            size="2xs"
            h="24px"
            w="24px"
            variant="outline"
            colorPalette="gray"
            aria-label="Cancelar"
            onClick={() => setIsEditingName(false)}
            disabled={isSavingName}
          >
            <X size={12} />
          </IconButton>
        </HStack>
      ) : (
        <HStack justify="space-between" mb={2} align="center" width="full" gap={2}>
          <Text
            fontWeight="bold"
            fontSize="sm"
            color="nvr.text.primary"
            whiteSpace="normal"
            wordBreak="break-word"
            lineHeight="shorter"
            flex="1"
          >
            {cameraNumber ? `#${cameraNumber} - ` : ""}{camera.name || formatDeviceName(camera.dev)}
          </Text>
          {camera.persistent_path && isHovered && (
            <Tooltip content="Renombrar cámara" showArrow>
              <IconButton
                size="2xs"
                h="18px"
                w="18px"
                variant="ghost"
                color="nvr.text.secondary"
                _hover={{ color: "blue.600", bg: "blackAlpha.100" }}
                aria-label="Renombrar cámara"
                onClick={handleStartRename}
              >
                <Pencil size={10} />
              </IconButton>
            </Tooltip>
          )}
        </HStack>
      )}

      <VStack align="stretch" gap={2}>
        <Flex gap={2} align="center">
          <Button
            flex="1"
            variant="subtle"
            size="xs"
            borderWidth="1px"
            borderColor={camera.streaming ? "red.subtle" : "nvr.border.default"}
            colorPalette={camera.streaming ? "red" : "gray"}
            onClick={handleToggle}
            fontWeight="bold"
            transition="all 0.2s"
            _hover={{ transform: "scale(1.01)" }}
            loading={isToggling}
            spinner={
              <BeatLoader
                size={6}
                color={camera.streaming ? "#dc2626" : "#4b5563"}
              />
            }
          >
            {camera.streaming ? "Transmitiendo" : "En espera"}
          </Button>

          <Popover.Root portalled={true} unmountOnExit={false} positioning={{ placement: "right-start", gutter: 8 }}>
            <Tooltip content="Ajustes de transmisión" showArrow>
              <span style={{ display: "inline-block" }}>
                <Popover.Trigger asChild>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorPalette="gray"
                    borderColor="nvr.border.default"
                    aria-label="Ajustes de transmisión"
                    transition="all 0.2s"
                    _hover={{
                      bg: "nvr.bg.muted",
                      borderColor: "nvr.border.interactive",
                    }}
                    disabled={isToggling}
                  >
                    <Settings size={14} />
                  </IconButton>
                </Popover.Trigger>
              </span>
            </Tooltip>
            <Portal>
              <Popover.Positioner zIndex={1600}>
                <Popover.Content
                  bg="nvr.bg.modal"
                  borderColor="nvr.border.default"
                  shadow="lg"
                  p={3}
                  borderRadius="lg"
                  zIndex="popover"
                >
                  <Popover.Arrow />
                  <Popover.Body p={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="nvr.text.secondary"
                      mb={2}
                    >
                      Ajustes de transmisión
                    </Text>
                    <VStack align="stretch" gap={2}>
                      <StreamSettings
                        resolutions={sortedResolutions}
                        fpsOptions={sortedFps}
                        displayRes={displayRes}
                        displayFps={displayFps}
                        displayBitrate={displayBitrate}
                        setRes={handleSetRes}
                        setFps={handleSetFps}
                        setBitrate={handleSetBitrate}
                        disabled={isToggling}
                      />
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>

          <UvcControlPanel
            cameraDev={camera.dev}
            size="xs"
            buttonProps={{ disabled: isToggling }}
            positioning={{ placement: "right-start", gutter: 8 }}
          />

          <Popover.Root portalled={true} unmountOnExit={true}>
            <Tooltip content="Controles PTZ" showArrow>
              <span style={{ display: "inline-block" }}>
                <Popover.Trigger asChild>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorPalette="gray"
                    borderColor="nvr.border.default"
                    aria-label="Controles PTZ"
                    transition="all 0.2s"
                    _hover={{
                      bg: "nvr.bg.muted",
                      borderColor: "nvr.border.interactive",
                    }}
                    disabled={isToggling || !camera.streaming}
                  >
                    <Gamepad2 size={14} />
                  </IconButton>
                </Popover.Trigger>
              </span>
            </Tooltip>
            <Portal>
              <Popover.Positioner zIndex={1600}>
                <Popover.Content
                  bg="white"
                  borderColor="gray.200"
                  shadow="lg"
                  p={3}
                  borderRadius="lg"
                  zIndex="popover"
                  width="190px"
                  onWheel={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  <Popover.Arrow />
                  <Popover.Body p={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.700"
                      mb={2.5}
                      textAlign="center"
                    >
                      Control PTZ UVC
                    </Text>
                    <PtzJoystick
                      cameraDev={camera.dev}
                      onDetach={() => {
                        dispatch(togglePtzOverlay(camera.dev));
                        // Disparamos evento Escape para cerrar el popover
                        const escapeEvent = new KeyboardEvent("keydown", {
                          key: "Escape",
                        });
                        document.dispatchEvent(escapeEvent);
                      }}
                    />
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Flex>
      </VStack>
    </Box>
  );
};

export default CameraControlCard;
