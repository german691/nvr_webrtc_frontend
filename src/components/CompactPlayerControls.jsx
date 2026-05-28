import {
  HStack,
  VStack,
  Flex,
  Text,
  IconButton,
  Popover,
  Portal,
  Button,
} from "@chakra-ui/react";
import {
  Camera,
  ZoomIn,
  Video,
  Square,
  Maximize,
  Minimize,
  Focus,
  Settings,
  Gamepad2,
  Minus,
  Plus,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { togglePtzOverlay } from "../store/slices/cameraSlice";
import PlayerButton from "./ui/PlayerButton";
import { StreamSettings } from "./StreamSettings.jsx";
import { UvcControlPanel } from "./UvcControlPanel.jsx";

/**
 * Componente que compacta los 9 controles del reproductor WebRTC
 * agrupándolos en 6 botones altamente interactivos.
 */
export const CompactPlayerControls = ({
  camera,
  isFullscreen,
  containerRef,
  videoRef,
  isToggling,
  isStreamSettingsOpen,
  setIsStreamSettingsOpen,
  setIsUvcSettingsOpen,
  isOrientationOpen,
  setIsOrientationOpen,
  isPtzOverlayOpen,
  handleScreenshot,
  isRecording,
  startRecording,
  stopRecording,
  scale,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  toggleFullScreen,
  sortedResolutions,
  sortedFps,
  displayRes,
  displayFps,
  displayBitrate,
  handleSetRes,
  handleSetFps,
  handleSetBitrate,
  showControls,
  rotate,
  flipH,
  flipY,
  handleSetRotate,
  handleSetFlipH,
  handleSetFlipY,
  onMouseEnter,
  onMouseLeave,
}) => {
  const dispatch = useDispatch();

  return (
    <HStack
      position="absolute"
      bottom={3}
      right={3}
      bg="rgba(255, 255, 255, 0.85)"
      backdropFilter="blur(8px)"
      p="4px 6px"
      borderRadius="xl"
      shadow="md"
      gap={1}
      zIndex={10}
      opacity={showControls ? 1 : 0}
      pointerEvents={showControls ? "auto" : "none"}
      transition="opacity 0.3s ease-in-out"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 1. CONTROL PTZ */}
      {camera && (
        <PlayerButton
          tooltip={isPtzOverlayOpen ? "Ocultar control PTZ" : "Ver control PTZ"}
          ariaLabel="Joystick PTZ"
          onClick={() => dispatch(togglePtzOverlay(camera.dev))}
          color={isPtzOverlayOpen ? "blue.600" : "gray.700"}
          bg={isPtzOverlayOpen ? "rgba(37, 99, 235, 0.1)" : "transparent"}
          _hover={{ bg: "blackAlpha.100" }}
        >
          <Gamepad2 size={14} />
        </PlayerButton>
      )}

      {/* 2. AJUSTES DE VIDEO (UVC) */}
      {camera && (
        <UvcControlPanel
          key={`uvc-${camera.dev}-${isFullscreen}`}
          cameraDev={camera.dev}
          size="xs"
          variant="ghost"
          buttonProps={{
            _hover: { bg: "blackAlpha.100" },
          }}
          onOpenChange={setIsUvcSettingsOpen}
          portalContainer={isFullscreen ? containerRef : undefined}
        />
      )}

      {/* 3. AJUSTES DE TRANSMISIÓN */}
      {camera && (
        <Popover.Root
          key={`stream-settings-${isFullscreen}`}
          open={isStreamSettingsOpen}
          onOpenChange={(details) => setIsStreamSettingsOpen(details.open)}
          portalled={true}
          unmountOnExit={false}
        >
          <PlayerButton
            tooltip="Ajustes de transmisión"
            ariaLabel="Ajustes de transmisión"
            color="gray.700"
          >
            <Popover.Trigger asChild>
              <Settings size={14} />
            </Popover.Trigger>
          </PlayerButton>
          <Portal container={isFullscreen ? containerRef : undefined}>
            <Popover.Positioner zIndex={1600}>
              <Popover.Content
                bg="white"
                borderColor="gray.200"
                shadow="lg"
                p={3}
                borderRadius="xl"
                zIndex="popover"
                width="280px"
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
                    mb={3}
                    textAlign="left"
                  >
                    Ajustes
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
      )}

      {/* 4. CONTROLES DE ZOOM AGRUPADOS */}
      <Popover.Root portalled={true} unmountOnExit={true}>
        <PlayerButton
          tooltip="Controles de Zoom"
          ariaLabel="Controles de Zoom"
          color={scale > 1 ? "blue.600" : "gray.700"}
          bg={scale > 1 ? "rgba(37, 99, 235, 0.08)" : "transparent"}
        >
          <Popover.Trigger asChild>
            <ZoomIn size={14} />
          </Popover.Trigger>
        </PlayerButton>
        <Portal container={isFullscreen ? containerRef : undefined}>
          <Popover.Positioner zIndex={1600}>
            <Popover.Content
              bg="white"
              borderColor="gray.200"
              shadow="lg"
              p={1}
              borderRadius="xl"
              zIndex="popover"
              w="160px"
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <Popover.Arrow />
              <Popover.Body p={0}>
                <Flex align="center" justify="space-between" gap={1}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    disabled={scale <= 1}
                    onClick={handleZoomOut}
                    aria-label="Alejar zoom"
                    colorPalette="gray"
                  >
                    <Minus size={13} />
                  </IconButton>
                  <Text
                    fontSize="2xs"
                    fontWeight="extrabold"
                    color="gray.600"
                    minW="42px"
                    textAlign="center"
                  >
                    {Math.round(scale * 100)}%
                  </Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    disabled={scale >= 4}
                    onClick={handleZoomIn}
                    aria-label="Acercar zoom"
                    colorPalette="gray"
                  >
                    <Plus size={13} />
                  </IconButton>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    disabled={scale === 1}
                    onClick={handleResetZoom}
                    aria-label="Restablecer zoom"
                    colorPalette="gray"
                  >
                    <Focus size={13} />
                  </IconButton>
                </Flex>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      {/* 4b. ROTACIÓN Y ESPEJO DIGITAL (ORIENTACIÓN) */}
      {camera && (
        <Popover.Root
          key={`orientation-settings-${isFullscreen}`}
          open={isOrientationOpen}
          onOpenChange={(details) => setIsOrientationOpen(details.open)}
          portalled={true}
          unmountOnExit={false}
        >
          <PlayerButton
            tooltip="Rotación y Espejo"
            ariaLabel="Rotación y Espejo"
            color={(rotate !== 0 || flipH || flipY) ? "blue.600" : "gray.700"}
            bg={(rotate !== 0 || flipH || flipY) ? "rgba(37, 99, 235, 0.08)" : "transparent"}
          >
            <Popover.Trigger asChild>
              <RotateCw size={14} />
            </Popover.Trigger>
          </PlayerButton>
          <Portal container={isFullscreen ? containerRef : undefined}>
            <Popover.Positioner zIndex={1600}>
              <Popover.Content
                bg="white"
                borderColor="gray.200"
                shadow="lg"
                p={3}
                borderRadius="xl"
                zIndex="popover"
                w="210px"
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
                    mb={3}
                    textAlign="left"
                  >
                    Orientación Digital
                  </Text>
                  
                  <VStack gap={3} align="stretch">
                    {/* Rotación */}
                    <VStack align="stretch" gap={1.5}>
                      <Text fontSize="2xs" fontWeight="semibold" color="gray.500" textAlign="left">
                        Rotación
                      </Text>
                      <HStack gap={1} width="100%">
                        {[0, 90, 180, 270].map((deg) => (
                          <Button
                            key={deg}
                            size="xs"
                            flex={1}
                            variant={rotate === deg ? "solid" : "outline"}
                            colorPalette={rotate === deg ? "blue" : "gray"}
                            onClick={() => handleSetRotate(deg)}
                            fontSize="3xs"
                            p={0}
                            h="24px"
                          >
                            {deg}°
                          </Button>
                        ))}
                      </HStack>
                    </VStack>

                    {/* Volteo / Mirror */}
                    <VStack align="stretch" gap={1.5}>
                      <Text fontSize="2xs" fontWeight="semibold" color="gray.500" textAlign="left">
                        Espejo (Mirror)
                      </Text>
                      <HStack gap={2}>
                        <Button
                          size="xs"
                          flex={1}
                          variant={flipH ? "solid" : "outline"}
                          colorPalette={flipH ? "blue" : "gray"}
                          onClick={() => handleSetFlipH(!flipH)}
                          h="24px"
                          px={1.5}
                        >
                          <HStack gap={1} justify="center">
                            <FlipHorizontal size={11} />
                            <Text fontSize="3xs">H-Flip</Text>
                          </HStack>
                        </Button>
                        <Button
                          size="xs"
                          flex={1}
                          variant={flipY ? "solid" : "outline"}
                          colorPalette={flipY ? "blue" : "gray"}
                          onClick={() => handleSetFlipY(!flipY)}
                          h="24px"
                          px={1.5}
                        >
                          <HStack gap={1} justify="center">
                            <FlipVertical size={11} />
                            <Text fontSize="3xs">V-Flip</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>

                    {/* Restablecer */}
                    {(rotate !== 0 || flipH || flipY) && (
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => {
                          handleSetRotate(0);
                          handleSetFlipH(false);
                          handleSetFlipY(false);
                        }}
                        fontSize="2xs"
                        fontWeight="semibold"
                        h="24px"
                        mt={1}
                      >
                        Restablecer
                      </Button>
                    )}
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      )}

      {/* 5. CAPTURA Y GRABACIÓN AGRUPADAS */}
      {camera && (
        <Popover.Root portalled={true} unmountOnExit={true}>
          <PlayerButton
            tooltip="Capturas y Grabación"
            ariaLabel="Capturas y Grabación"
            color={isRecording ? "red.600" : "gray.700"}
            bg={isRecording ? "rgba(239, 68, 68, 0.1)" : "transparent"}
          >
            <Popover.Trigger asChild>
              {isRecording ? (
                <Square size={14} fill="currentColor" />
              ) : (
                <Camera size={14} />
              )}
            </Popover.Trigger>
          </PlayerButton>
          <Portal container={isFullscreen ? containerRef : undefined}>
            <Popover.Positioner zIndex={1600}>
              <Popover.Content
                bg="white"
                borderColor="gray.200"
                shadow="lg"
                p={1.5}
                borderRadius="xl"
                zIndex="popover"
                w="120px"
                onWheel={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <Popover.Arrow />
                <Popover.Body p={0}>
                  <VStack gap={1} align="stretch">
                    <Button
                      size="xs"
                      variant="ghost"
                      justifyContent="start"
                      gap={2.5}
                      onClick={handleScreenshot}
                      colorPalette="gray"
                      fontWeight="medium"
                    >
                      <Camera size={13} />
                      <Text fontSize="2xs">Foto</Text>
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      justifyContent="start"
                      gap={2.5}
                      colorPalette={isRecording ? "red" : "gray"}
                      onClick={
                        isRecording
                          ? stopRecording
                          : () => startRecording(videoRef)
                      }
                      color={isRecording ? "red.600" : "gray.700"}
                      fontWeight="medium"
                    >
                      {isRecording ? (
                        <Square size={13} fill="currentColor" />
                      ) : (
                        <Video size={13} />
                      )}
                      <Text fontSize="2xs">
                        {isRecording ? "Detener" : "Grabar"}
                      </Text>
                    </Button>
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      )}

      {/* 6. PANTALLA COMPLETA */}
      <PlayerButton
        tooltip={
          isFullscreen ? "Salir de Pantalla completa" : "Pantalla completa"
        }
        ariaLabel="Pantalla completa"
        onClick={toggleFullScreen}
        color="gray.700"
      >
        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
      </PlayerButton>
    </HStack>
  );
};

export default CompactPlayerControls;
