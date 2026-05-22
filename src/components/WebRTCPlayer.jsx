import { useEffect, useRef, useState, useMemo } from "react";
import { Box, HStack, IconButton, Popover, Text, VStack, Portal } from "@chakra-ui/react";
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

const WebRTCPlayer = ({ url, camera }) => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const controlsTimeoutRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });

  // Popover open states to manage controls visibility in fullscreen
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState(false);
  const [isUvcSettingsOpen, setIsUvcSettingsOpen] = useState(false);

  const isAnyPopoverOpen = isStreamSettingsOpen || isUvcSettingsOpen;

  // Stream options sorting and selectors
  const sortedResolutions = useMemo(() => {
    if (!camera?.modes) return ["1920x1080", "1280x720"];
    const rawResolutions = camera.modes.map((m) =>
      typeof m === "object" ? m.resolution : m
    );
    return [...new Set(rawResolutions)].sort((a, b) => {
      const [wA, hA] = a.trim().split("x").map(Number);
      const [wB, hB] = b.trim().split("x").map(Number);
      return wA - wB || hA - hB;
    });
  }, [camera?.modes]);

  const sortedFps = useMemo(() => {
    if (!camera?.modes) return ["30", "24", "60"];
    let rawFps = [];
    camera.modes.forEach((m) => {
      if (typeof m === "object" && m.fps) {
        if (Array.isArray(m.fps)) {
          rawFps.push(...m.fps);
        } else {
          rawFps.push(m.fps);
        }
      }
    });
    if (rawFps.length === 0) {
      rawFps = [30, 24, 60];
    }
    return [...new Set(rawFps.map(String))].sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [camera?.modes]);

  const displayRes = camera?.active_settings?.resolution || "1920x1080";
  const displayFps = camera?.active_settings?.fps || "30";
  const displayBitrate = camera?.active_settings?.bitrate || "2M";

  const handleSetRes = (newRes) => {
    if (!camera) return;
    dispatch(
      toggleStream({
        dev: camera.dev,
        resolution: newRes,
        fps: displayFps,
        bitrate: displayBitrate,
        cleanBitrate: displayBitrate,
        action: "start",
      })
    );
  };

  const handleSetFps = (newFps) => {
    if (!camera) return;
    dispatch(
      toggleStream({
        dev: camera.dev,
        resolution: displayRes,
        fps: newFps,
        bitrate: displayBitrate,
        cleanBitrate: displayBitrate,
        action: "start",
      })
    );
  };

  const handleSetBitrate = (newBitrate) => {
    if (!camera) return;
    dispatch(
      toggleStream({
        dev: camera.dev,
        resolution: displayRes,
        fps: displayFps,
        bitrate: newBitrate,
        cleanBitrate: newBitrate,
        action: "start",
      })
    );
  };

  // --- WEBRTC ---
  useEffect(() => {
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
    };
  }, [url]);

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
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else if (isFullscreen) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        1000,
      );
    }
  }, [isAnyPopoverOpen, isFullscreen]);

  // --- RECORDING ---
  const handleStartRecording = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    const stream = videoRef.current.srcObject;
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `Evidencia_NVR_${new Date().getTime()}.webm`,
          types: [
            {
              description: "Video H.264 (WebM)",
              accept: { "video/webm": [".webm"] },
            },
          ],
        });

        const writableStream = await fileHandle.createWritable();
        fileStreamRef.current = writableStream;

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && fileStreamRef.current) {
            await fileStreamRef.current.write(e.data);
          }
        };

        recorder.onstop = async () => {
          if (fileStreamRef.current) {
            await fileStreamRef.current.close();
            fileStreamRef.current = null;
          }
        };

        recorder.start(1000);
        setIsRecording(true);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn(
          "No se pudo usar acceso directo a disco. Pasando a Plan B (RAM)...",
        );
      }
    }

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = `Evidencia_NVR_${new Date().getTime()}.webm`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
      chunksRef.current = [];
    };

    recorder.start(1000);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

  // --- ZOOM & PAN ---
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.2;
    setScale((prev) => {
      const delta = e.deltaY < 0 ? zoomSensitivity : -zoomSensitivity;
      const newScale = Math.min(Math.max(prev + delta, 1), 4);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    // 1. Lógica de paneo
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }

    // 2. Lógica de auto-ocultado de controles en FullScreen
    if (isFullscreen && !isAnyPopoverOpen) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(
        () => setShowControls(false),
        1000,
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={toggleFullScreen}
      cursor={scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"}
    >
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

      <HStack
        position="absolute"
        bottom={3}
        right={3}
        bg="whiteAlpha.800"
        backdropFilter="blur(8px)"
        p={1.5}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.350"
        shadow="md"
        gap={1.5}
        zIndex={10}
        opacity={showControls ? 1 : 0}
        pointerEvents={showControls ? "auto" : "none"}
        transition="opacity 0.3s ease-in-out"
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          // Mantener visible si el usuario tiene el mouse sobre la barra
          if (isFullscreen) {
            setShowControls(true);
            if (controlsTimeoutRef.current)
              clearTimeout(controlsTimeoutRef.current);
          }
        }}
        onMouseLeave={() => {
          // Reanudar el temporizador si el usuario saca el mouse de la barra
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
            borderRadius="lg"
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
            <Popover.Trigger asChild>
              <IconButton
                size="xs"
                variant="ghost"
                borderRadius="lg"
                colorPalette="gray"
                aria-label="Configuración de transmisión"
                title="Configuración de transmisión"
                transition="all 0.2s"
                _hover={{ bg: "blackAlpha.100" }}
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
                  p={3}
                  borderRadius="xl"
                  zIndex="popover"
                  width="280px"
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
                        disabled={false}
                      />
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        )}

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          colorPalette="gray"
          aria-label="Pantalla Completa"
          title="Pantalla Completa"
          onClick={toggleFullScreen}
          transition="all 0.2s"
          _hover={{ bg: "blackAlpha.100" }}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </IconButton>

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          colorPalette="gray"
          aria-label="Tomar Captura"
          title="Tomar Captura"
          onClick={handleScreenshot}
          transition="all 0.2s"
          _hover={{ bg: "blackAlpha.100" }}
        >
          <Camera size={16} />
        </IconButton>

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          colorPalette="gray"
          aria-label="Restablecer Zoom"
          title="Restablecer Zoom"
          onClick={handleResetZoom}
          disabled={scale === 1}
          transition="all 0.2s"
          _hover={{ bg: "blackAlpha.100" }}
        >
          <Focus size={16} />
        </IconButton>

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          colorPalette="gray"
          aria-label="Acercar"
          title="Acercar"
          onClick={handleZoomIn}
          disabled={scale >= 4}
          transition="all 0.2s"
          _hover={{ bg: "blackAlpha.100" }}
        >
          <ZoomIn size={16} />
        </IconButton>

        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          colorPalette="gray"
          aria-label="Alejar"
          title="Alejar"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          transition="all 0.2s"
          _hover={{ bg: "blackAlpha.100" }}
        >
          <ZoomOut size={16} />
        </IconButton>

        <IconButton
          size="xs"
          borderRadius="lg"
          colorPalette={isRecording ? "red" : "blue"}
          aria-label={isRecording ? "Detener Grabación" : "Grabar"}
          title={isRecording ? "Detener Grabación" : "Grabar"}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          transition="all 0.2s"
          boxShadow={isRecording ? "0 0 10px rgba(239, 68, 68, 0.5)" : "none"}
          _hover={{ opacity: 0.9 }}
        >
          {isRecording ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Video size={16} />
          )}
        </IconButton>
      </HStack>
    </Box>
  );
};

export default WebRTCPlayer;
