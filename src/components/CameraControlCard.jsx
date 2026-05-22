import { useState, useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Flex,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { toggleStream } from "../store/slices/cameraSlice";
import { formatDeviceName, BITRATES } from "../utils/camera.js";
import { UvcControlPanel } from "./UvcControlPanel.jsx";
import { StreamSettings } from "./StreamSettings.jsx";

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

  const handleToggle = () => {
    if (camera.streaming) {
      dispatch(toggleStream({ dev: camera.dev, action: "stop" }));
    } else {
      dispatch(
        toggleStream({
          dev: camera.dev,
          resolution: displayRes,
          fps: displayFps,
          bitrate: displayBitrate,
          cleanBitrate: displayBitrate,
          action: "start",
        }),
      );
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={camera.streaming ? "green.500" : "gray.200"}
      borderRadius="md"
      p={3}
      bg="white"
      transition="all 0.2s"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" fontSize="sm" truncate>
          {formatDeviceName(camera.dev)}
        </Text>
        <Badge
          colorPalette={camera.streaming ? "red" : "gray"}
          variant="subtle"
          fontSize="2xs"
        >
          {camera.streaming ? "TRANSMITIENDO" : "EN ESPERA"}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={3}>
        <StreamSettings
          resolutions={sortedResolutions}
          fpsOptions={sortedFps}
          displayRes={displayRes}
          displayFps={displayFps}
          displayBitrate={displayBitrate}
          setRes={setRes}
          setFps={setFps}
          setBitrate={setBitrate}
          disabled={camera.streaming}
        />

        <Flex gap={2} flexDir="column">
          <Button
            variant="subtle"
            size="sm"
            colorPalette={camera.streaming ? "green" : "blue"}
            onClick={handleToggle}
          >
            {camera.streaming ? "Detener Stream" : "Visualizar"}
          </Button>

          <UvcControlPanel cameraDev={camera.dev} />
        </Flex>
      </VStack>
    </Box>
  );
};

export default CameraControlCard;
