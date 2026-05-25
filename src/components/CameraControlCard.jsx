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
import { formatDeviceName, BITRATES, getSortedResolutions, getSortedFps } from "../utils/camera.js";
import { UvcControlPanel } from "./UvcControlPanel.jsx";
import { StreamSettings } from "./StreamSettings.jsx";
import { Settings } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { Tooltip } from "./ui/tooltip";

const CameraControlCard = ({ camera }) => {
  const dispatch = useDispatch();

  const sortedResolutions = useMemo(() => getSortedResolutions(camera.modes), [camera.modes]);
  const sortedFps = useMemo(() => getSortedFps(camera.modes), [camera.modes]);

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
      borderColor="gray.200"
      borderRadius="xl"
      p={2}
      bg="white"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "gray.300",
      }}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize="sm" color="gray.800" truncate>
          {formatDeviceName(camera.dev)}
        </Text>
        <Badge
          colorPalette={camera.streaming ? "red" : "gray"}
          variant="subtle"
          fontSize="2xs"
          px={2}
          py={0.5}
          borderRadius="full"
        >
          {camera.streaming ? "TRANSMITIENDO" : "EN ESPERA"}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={2}>
        <Flex gap={2} align="center">
          <Button
            flex="1"
            variant={camera.streaming ? "subtle" : "solid"}
            size="sm"
            colorPalette={camera.streaming ? "gray" : "blue"}
            onClick={handleToggle}
            fontWeight="semibold"
            transition="all 0.2s"
            _hover={{ transform: "scale(1.01)" }}
            loading={isToggling}
            spinner={<BeatLoader size={8} color={camera.streaming ? "#4b5563" : "white"} />}
          >
            {camera.streaming ? "Detener" : "Visualizar"}
          </Button>

          <Popover.Root portalled={true} unmountOnExit={false}>
            <Tooltip
              content="Configuración de transmisión"
              showArrow
            >
              <span style={{ display: "inline-block" }}>
                <Popover.Trigger asChild>
                  <IconButton
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    borderColor="gray.200"
                    aria-label="Configuración de transmisión"
                    transition="all 0.2s"
                    _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                    disabled={isToggling}
                  >
                    <Settings size={16} />
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
                >
                  <Popover.Arrow />
                  <Popover.Body p={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.700"
                      mb={2}
                    >
                      Ajustes de Transmisión
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

          <UvcControlPanel cameraDev={camera.dev} buttonProps={{ disabled: isToggling }} />
        </Flex>
      </VStack>
    </Box>
  );
};

export default CameraControlCard;
