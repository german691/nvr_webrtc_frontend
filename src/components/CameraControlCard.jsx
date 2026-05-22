import { useState, useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Flex,
  IconButton,
  Popover,
  Portal,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { toggleStream } from "../store/slices/cameraSlice";
import { formatDeviceName, BITRATES } from "../utils/camera.js";
import { UvcControlPanel } from "./UvcControlPanel.jsx";
import { StreamSettings } from "./StreamSettings.jsx";
import { Settings } from "lucide-react";

const CameraControlCard = ({ camera }) => {
  const dispatch = useDispatch();

  const sortedResolutions = useMemo(() => {
    const rawResolutions =
      camera.modes && camera.modes.length > 0
        ? camera.modes.map((m) => (typeof m === "object" ? m.resolution : m))
        : ["1920x1080", "1280x720"];

    return [...new Set(rawResolutions)].sort((a, b) => {
      const [wA, hA] = a.trim().split("x").map(Number);
      const [wB, hB] = b.trim().split("x").map(Number);
      return wA - wB || hA - hB;
    });
  }, [camera.modes]);

  const sortedFps = useMemo(() => {
    let rawFps = [];
    if (camera.modes && camera.modes.length > 0) {
      camera.modes.forEach((m) => {
        if (typeof m === "object" && m.fps) {
          if (Array.isArray(m.fps)) {
            rawFps.push(...m.fps);
          } else {
            rawFps.push(m.fps);
          }
        }
      });
    }

    if (rawFps.length === 0) {
      rawFps = [30, 24, 60];
    }

    return [...new Set(rawFps.map(String))].sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [camera.modes]);

  const initialRes = sortedResolutions.includes("1920x1080")
    ? "1920x1080"
    : sortedResolutions[0];

  const initialFps = sortedFps.includes("30") ? "30" : sortedFps[0];

  const [res, setRes] = useState(initialRes);
  const [fps, setFps] = useState(initialFps);
  const [bitrate, setBitrate] = useState(BITRATES[1].value);
  const [isToggling, setIsToggling] = useState(false);

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
          })
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
          })
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
          })
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
        await dispatch(toggleStream({ dev: camera.dev, action: "stop" })).unwrap();
      } else {
        await dispatch(
          toggleStream({
            dev: camera.dev,
            resolution: displayRes,
            fps: displayFps,
            bitrate: displayBitrate,
            cleanBitrate: displayBitrate,
            action: "start",
          })
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
      borderColor={camera.streaming ? "green.500" : "gray.200"}
      borderRadius="2xl"
      p={3}
      bg="white"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      boxShadow={camera.streaming ? "0 0 16px rgba(34, 197, 94, 0.2)" : "none"}
      _hover={{
        borderColor: camera.streaming ? "green.600" : "gray.300",
        boxShadow: camera.streaming
          ? "0 0 20px rgba(34, 197, 94, 0.25)"
          : "0 4px 12px rgba(0, 0, 0, 0.03)",
        transform: "translateY(-1px)",
      }}
    >
      <HStack justify="space-between" mb={3.5}>
        <Text fontWeight="bold" fontSize="sm" color="gray.800" truncate>
          {formatDeviceName(camera.dev)}
        </Text>
        <Badge
          colorPalette={camera.streaming ? "green" : "gray"}
          variant="subtle"
          fontSize="2xs"
          px={2}
          py={0.5}
          borderRadius="full"
        >
          {camera.streaming ? "TRANSMITIENDO" : "EN ESPERA"}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={3}>
        <Flex gap={2} align="center">
          <Button
            flex="1"
            variant={camera.streaming ? "solid" : "subtle"}
            size="sm"
            colorPalette={camera.streaming ? "green" : "blue"}
            onClick={handleToggle}
            borderRadius="xl"
            fontWeight="semibold"
            transition="all 0.2s"
            _hover={{ opacity: 0.9 }}
            loading={isToggling}
            loadingText={camera.streaming ? "Apagando..." : "Conectando..."}
          >
            {camera.streaming ? "Apagar" : "Visualizar"}
          </Button>

          <Popover.Root portalled={true} unmountOnExit={false}>
            <Popover.Trigger asChild>
              <IconButton
                size="sm"
                variant="outline"
                colorPalette="gray"
                borderColor="gray.200"
                borderRadius="xl"
                aria-label="Configuración de transmisión"
                title="Configuración de transmisión"
                transition="all 0.2s"
                _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                disabled={isToggling}
              >
                <Settings size={16} />
              </IconButton>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner zIndex={1600}>
                <Popover.Content
                  bg="white"
                  borderColor="gray.200"
                  shadow="lg"
                  p={4}
                  borderRadius="xl"
                  zIndex="popover"
                >
                  <Popover.Arrow />
                  <Popover.Body p={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.700"
                      mb={3}
                    >
                      Ajustes de Transmisión
                    </Text>
                    <VStack align="stretch" gap={3}>
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

          <UvcControlPanel cameraDev={camera.dev} buttonProps={{ disabled: isToggling }} />
        </Flex>
      </VStack>
    </Box>
  );
};

export default CameraControlCard;
