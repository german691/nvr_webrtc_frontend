import { useEffect, useRef, useState, useMemo, memo } from "react";
import { Box, HStack, Popover, Text, VStack, Portal, Center } from "@chakra-ui/react";
import {
  Camera,
  ZoomIn,
  ZoomOut,
  Video,
  Square,
  Maximize,
  Minimize,
  Focus,
  Settings,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { toggleStream } from "../store/slices/cameraSlice";
import { StreamSettings } from "./StreamSettings.jsx";
import { UvcControlPanel } from "./UvcControlPanel.jsx";
import PlayerButton from "./ui/PlayerButton";
import { useVideoZoom } from "../hooks/useVideoZoom";
import { useLocalRecorder } from "../hooks/useLocalRecorder";
import { getSortedResolutions, getSortedFps } from "../utils/camera.js";

/**
 * Componente Reproductor WebRTC en tiempo real.
 * Renderiza el stream de video de cámaras WebRTC y proporciona una barra
 * de controles compacta y premium (zoom, paneo, grabaciones, capturas, popovers).
 */
export const WebRTCPlayer = ({ url, camera }) => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Popover open states to manage controls visibility in fullscreen
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState(false);
  const [isUvcSettingsOpen, setIsUvcSettingsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isAnyPopoverOpen = isStreamSettingsOpen || isUvcSettingsOpen;

  // Extraer lógica de zoom/paneo y grabación local de evidencia en hooks especializados
  const {
    scale,
    position,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove: zoomMouseMove,
    handleMouseUp,
  } = useVideoZoom();

  const { isRecording, startRecording, stopRecording } = useLocalRecorder();

  // Stream options sorting and selectors
  const sortedResolutions = useMemo(() => getSortedResolutions(camera?.modes), [camera?.modes]);
  const sortedFps = useMemo(() => getSortedFps(camera?.modes), [camera?.modes]);

  const displayRes = camera?.active_settings?.resolution || "1920x1080";
  const displayFps = camera?.active_settings?.fps || "30";
  const displayBitrate = camera?.active_settings?.bitrate || "2M";

  const handleSetRes = async (newRes) => {
    if (!camera) return;
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
  };

  const handleSetFps = async (newFps) => {
    if (!camera) return;
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
  };

  const handleSetBitrate = async (newBitrate) => {
    if (!camera) return;
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
  };

  // --- WEBRTC CONNECTION LIFECYCLE ---
  useEffect(() => {
    if (!url) return;

    if (url.startsWith("mock://")) {
      return;
    }

    let pc = null;

    const startWebRTC = async () => {
      pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = new MediaStream([event.track]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whepUrl = url.endsWith("/whep") ? url : `${url}/whep`;

      try {
        const response = await fetch(whepUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });

        if (!response.ok)
          throw new Error(`Error HTTP WHEP: ${response.status}`);

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (error) {
        console.error("Fallo conectando al nodo Edge:", error);
      }
    };

    startWebRTC();

    return () => {
      if (pc) pc.close();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [
    url,
    camera?.active_settings?.resolution,
    camera?.active_settings?.fps,
    camera?.active_settings?.bitrate,
  ]);

  // --- FULLSCREEN EVENT LISTENER & AUTO-HIDE CONTROLS ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      if (isFS) {
        setShowControls(true);
        if (controlsTimeoutRef.current)
          clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(
          () => setShowControls(false),
          1000,
        );
      } else {
        setShowControls(true);
        if (controlsTimeoutRef.current)
          clearTimeout(controlsTimeoutRef.current);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Evitar que los controles se oculten cuando hay algún popover abierto en pantalla completa
  useEffect(() => {
    if (isAnyPopoverOpen) {
      const timer = setTimeout(() => {
        setShowControls(true);
      }, 0);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      return () => clearTimeout(timer);
    } else if (isFullscreen) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        1000,
      );
    }
  }, [isAnyPopoverOpen, isFullscreen]);

  // --- SCREENSHOT ---
  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Captura_NVR_${new Date().getTime()}.png`;
    a.click();
  };

  const handleMouseMove = (e) => {
    // 1. Manejo de zoom y arrastre por arrastre de mouse
    zoomMouseMove(e);

    // 2. Temporizador para ocultar controles en pantalla completa
    if (isFullscreen && !isAnyPopoverOpen) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        1000,
      );
    }
  };

  // --- FULLSCREEN ---
  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      bg="black"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => {
        setShowControls(true);
      }}
      onMouseLeave={(e) => {
        handleMouseUp(e);
        if (!isAnyPopoverOpen) {
          setShowControls(false);
        }
      }}
      onWheel={handleWheel}
      onDoubleClick={toggleFullScreen}
      cursor={scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"}
    >
      {url.startsWith("mock://") ? (
        <Center
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="black"
          userSelect="none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="whiteAlpha.300"
            fontFamily="mono"
            letterSpacing="wide"
          >
            {camera?.name || camera?.dev}
          </Text>
        </Center>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#000",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        />
      )}

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
        onMouseEnter={() => {
          if (isFullscreen) {
            setShowControls(true);
            if (controlsTimeoutRef.current)
              clearTimeout(controlsTimeoutRef.current);
          }
        }}
        onMouseLeave={() => {
          if (isFullscreen) {
            controlsTimeoutRef.current = setTimeout(
              () => setShowControls(false),
              1000,
            );
          }
        }}
      >
        {camera && (
          <UvcControlPanel
            cameraDev={camera.dev}
            size="xs"
            variant="ghost"
            buttonProps={{
              _hover: { bg: "blackAlpha.100" }
            }}
            onOpenChange={setIsUvcSettingsOpen}
          />
        )}

        {camera && (
          <Popover.Root
            open={isStreamSettingsOpen}
            onOpenChange={(details) => setIsStreamSettingsOpen(details.open)}
            portalled={true}
            unmountOnExit={false}
          >
            <PlayerButton
              tooltip="Ajustes de Transmisión (Resolución y FPS)"
              ariaLabel="Configuración de transmisión"
            >
              <Popover.Trigger asChild>
                <Settings size={14} />
              </Popover.Trigger>
            </PlayerButton>
            <Portal>
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
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={3} textAlign="left">
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
        )}

        <PlayerButton
          tooltip={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
          ariaLabel="Pantalla Completa"
          onClick={toggleFullScreen}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </PlayerButton>

        <PlayerButton
          tooltip="Tomar Captura de Imagen"
          ariaLabel="Tomar Captura"
          onClick={handleScreenshot}
        >
          <Camera size={14} />
        </PlayerButton>

        <PlayerButton
          tooltip="Restablecer Zoom y Paneo"
          ariaLabel="Restablecer Zoom"
          onClick={handleResetZoom}
          disabled={scale === 1}
        >
          <Focus size={14} />
        </PlayerButton>

        <PlayerButton
          tooltip="Acercar Zoom"
          ariaLabel="Acercar"
          onClick={handleZoomIn}
          disabled={scale >= 4}
        >
          <ZoomIn size={14} />
        </PlayerButton>

        <PlayerButton
          tooltip="Alejar Zoom"
          ariaLabel="Alejar"
          onClick={handleZoomOut}
          disabled={scale <= 1}
        >
          <ZoomOut size={14} />
        </PlayerButton>

        <PlayerButton
          tooltip={isRecording ? "Detener Grabación de Video" : "Grabar Video Local"}
          ariaLabel={isRecording ? "Detener Grabación" : "Grabar"}
          onClick={isRecording ? stopRecording : () => startRecording(videoRef)}
          colorPalette={isRecording ? "red" : "gray"}
          color={isRecording ? "red.600" : "gray.700"}
          boxShadow={isRecording ? "0 0 10px rgba(239, 68, 68, 0.2)" : "none"}
          _hover={
            isRecording
              ? { bg: "red.50", transform: "scale(1.03)" }
              : { bg: "blackAlpha.100", transform: "scale(1.03)" }
          }
        >
          {isRecording ? (
            <Square size={14} fill="currentColor" />
          ) : (
            <Video size={14} />
          )}
        </PlayerButton>
      </HStack>
    </Box>
  );
};

export default memo(WebRTCPlayer, (prevProps, nextProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.camera?.dev === nextProps.camera?.dev &&
    prevProps.camera?.name === nextProps.camera?.name &&
    prevProps.camera?.streaming === nextProps.camera?.streaming &&
    prevProps.camera?.active_settings?.resolution === nextProps.camera?.active_settings?.resolution &&
    prevProps.camera?.active_settings?.fps === nextProps.camera?.active_settings?.fps &&
    prevProps.camera?.active_settings?.bitrate === nextProps.camera?.active_settings?.bitrate
  );
});
