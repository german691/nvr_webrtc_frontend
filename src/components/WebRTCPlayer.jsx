import { useEffect, useRef, useState, useMemo, memo } from "react";
import {
  Box,
  Text,
  Center,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleStream,
  setPtzOverlay,
  setActiveUvcSettingsDev,
} from "../store/slices/cameraSlice";
import { useVideoZoom } from "../hooks/useVideoZoom";
import { useLocalRecorder } from "../hooks/useLocalRecorder";
import { getSortedResolutions, getSortedFps } from "../utils/camera.js";
import { PtzJoystick } from "./PtzJoystick.jsx";
import CompactPlayerControls from "./CompactPlayerControls.jsx";
import { UvcControlPanel } from "./UvcControlPanel.jsx";

/**
 * Componente Reproductor WebRTC en tiempo real.
 * Renderiza el stream de video de cámaras WebRTC y proporciona una barra
 * de controles compacta y premium (zoom, paneo, grabaciones, capturas, popovers).
 */
export const WebRTCPlayer = ({ url, camera }) => {
  const dispatch = useDispatch();
  const activePtzOverlays = useSelector(
    (state) => state.cameras.activePtzOverlays,
  );
  const list = useSelector((state) => state.cameras.list);
  const connectionMode = useSelector((state) => state.cameras.connectionMode);
  const realCameras = useMemo(() => {
    return list
      .filter((c) => c.dev && !c.dev.startsWith("loading:") && !c.dev.startsWith("offline:"))
      .sort((a, b) => {
        const ipCompare = (a.nodeIp || "").localeCompare(b.nodeIp || "");
        if (ipCompare !== 0) return ipCompare;
        return (a.dev || "").localeCompare(b.dev || "");
      });
  }, [list]);
  const cameraIndex = useMemo(() => realCameras.findIndex((c) => c.dev === camera?.dev), [realCameras, camera?.dev]);
  const cameraNumber = cameraIndex !== -1 ? cameraIndex + 1 : null;

  const isPtzOverlayOpen = !!(camera?.dev && activePtzOverlays[camera.dev]);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const wasVideowallFullscreenRef = useRef(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Popover open states to manage controls visibility in fullscreen
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState(false);
  const activeUvcSettingsDev = useSelector(
    (state) => state.cameras.activeUvcSettingsDev,
  );
  const isUvcSettingsOpen = activeUvcSettingsDev === camera?.dev;
  const setIsUvcSettingsOpen = (isOpen) => {
    dispatch(setActiveUvcSettingsDev(isOpen ? camera?.dev : null));
  };
  const [isOrientationOpen, setIsOrientationOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isAnyPopoverOpen = isStreamSettingsOpen || isUvcSettingsOpen || isOrientationOpen;

  // Estados locales para rotación y espejado digital instantáneo
  const [rotate, setRotate] = useState(() => Number(localStorage.getItem(`nvr_rotate_${camera?.dev}`)) || 0);
  const [flipH, setFlipH] = useState(() => localStorage.getItem(`nvr_flipH_${camera?.dev}`) === "true");
  const [flipY, setFlipY] = useState(() => localStorage.getItem(`nvr_flipY_${camera?.dev}`) === "true");
  const [prevDev, setPrevDev] = useState(camera?.dev);

  if (camera?.dev !== prevDev) {
    setPrevDev(camera?.dev);
    setRotate(Number(localStorage.getItem(`nvr_rotate_${camera?.dev}`)) || 0);
    setFlipH(localStorage.getItem(`nvr_flipH_${camera?.dev}`) === "true");
    setFlipY(localStorage.getItem(`nvr_flipY_${camera?.dev}`) === "true");
  }

  const handleSetRotate = (deg) => {
    setRotate(deg);
    if (camera?.dev) {
      localStorage.setItem(`nvr_rotate_${camera.dev}`, deg);
    }
  };

  const handleSetFlipH = (val) => {
    setFlipH(val);
    if (camera?.dev) {
      localStorage.setItem(`nvr_flipH_${camera.dev}`, val ? "true" : "false");
    }
  };

  const handleSetFlipY = (val) => {
    setFlipY(val);
    if (camera?.dev) {
      localStorage.setItem(`nvr_flipY_${camera.dev}`, val ? "true" : "false");
    }
  };

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
  const sortedResolutions = useMemo(
    () => getSortedResolutions(camera?.modes),
    [camera?.modes],
  );
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
        }),
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
        }),
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
        }),
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
      // Inyectar STUN público de Google para travesía NAT remota
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = new MediaStream([event.track]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Si el acceso remoto está activo, traducimos la llamada WHEP a través de Nginx
      let finalUrl = url;
      if (connectionMode === "remote") {
        try {
          const urlObj = new URL(url);
          const ip = urlObj.hostname;
          const path = urlObj.pathname.startsWith("/")
            ? urlObj.pathname.substring(1)
            : urlObj.pathname;
          finalUrl = `${window.location.origin}/whep/${ip}/${path}`;
        } catch (e) {
          console.warn(
            "Fallo al traducir la URL de señalización a remota:",
            e,
          );
        }
      }

      const whepUrl = finalUrl.endsWith("/whep") ? finalUrl : `${finalUrl}/whep`;

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
        console.error("Fallo conectando a la fuente:", error);
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
    connectionMode,
    camera?.active_settings?.resolution,
    camera?.active_settings?.fps,
    camera?.active_settings?.bitrate,
  ]);

  // --- FULLSCREEN EVENT LISTENER & AUTO-HIDE CONTROLS ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = document.fullscreenElement === containerRef.current;
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
    const isRotated90or270 = rotate === 90 || rotate === 270;
    canvas.width = isRotated90or270 ? video.videoHeight : video.videoWidth;
    canvas.height = isRotated90or270 ? video.videoWidth : video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Desplazar origen al centro
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotar e invertir
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipY ? -1 : 1);

    // Dibujar de vuelta centrado
    ctx.drawImage(
      video,
      -video.videoWidth / 2,
      -video.videoHeight / 2,
      video.videoWidth,
      video.videoHeight
    );

    const dataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Captura_NVR_${camera?.name || camera?.dev || "cam"}_${new Date().getTime()}.png`;
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
    const videowall = document.getElementById("nvr-videowall");
    const isThisElementFullscreen =
      document.fullscreenElement === containerRef.current;

    if (!isThisElementFullscreen) {
      // Registrar si el videowall estaba en pantalla completa justo antes de maximizar esta cámara
      if (
        document.fullscreenElement &&
        videowall &&
        document.fullscreenElement === videowall
      ) {
        wasVideowallFullscreenRef.current = true;
      } else {
        wasVideowallFullscreenRef.current = false;
      }

      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (wasVideowallFullscreenRef.current && videowall) {
        // Primero, salimos de pantalla completa en la cámara para limpiar sus estilos CSS nativos :fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        // Solicitamos pantalla completa en el videowall en el siguiente tick del event loop (80ms)
        setTimeout(() => {
          videowall.requestFullscreen().catch((err) => {
            console.error(
              "Error al restaurar pantalla completa del videowall:",
              err,
            );
          });
        }, 80);
        wasVideowallFullscreenRef.current = false;
      } else {
        // Salir de pantalla completa por completo
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
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
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <Center
            w="100%"
            h="100%"
            bg="black"
            userSelect="none"
            style={{
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
            }}
          >
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="whiteAlpha.300"
              fontFamily="mono"
              letterSpacing="wide"
            >
              {cameraNumber ? `#${cameraNumber} - ` : ""}{camera?.name || camera?.dev}
            </Text>
          </Center>
        </Box>
      ) : (
        <Box
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
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
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
            }}
          />
        </Box>
      )}

      {isPtzOverlayOpen && camera && (
        <PtzJoystick
          cameraDev={camera.dev}
          isFloating={true}
          onClose={() =>
            dispatch(setPtzOverlay({ dev: camera.dev, open: false }))
          }
        />
      )}

      {isUvcSettingsOpen && camera && (
        <UvcControlPanel
          cameraDev={camera.dev}
          isInline={true}
          onOpenChange={setIsUvcSettingsOpen}
          portalContainer={isFullscreen ? containerRef : undefined}
          cameraNumber={cameraNumber}
        />
      )}

      <CompactPlayerControls
        camera={camera}
        isFullscreen={isFullscreen}
        containerRef={containerRef}
        videoRef={videoRef}
        isToggling={isToggling}
        isStreamSettingsOpen={isStreamSettingsOpen}
        setIsStreamSettingsOpen={setIsStreamSettingsOpen}
        isUvcSettingsOpen={isUvcSettingsOpen}
        setIsUvcSettingsOpen={setIsUvcSettingsOpen}
        isOrientationOpen={isOrientationOpen}
        setIsOrientationOpen={setIsOrientationOpen}
        isPtzOverlayOpen={isPtzOverlayOpen}
        handleScreenshot={handleScreenshot}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        scale={scale}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetZoom={handleResetZoom}
        toggleFullScreen={toggleFullScreen}
        sortedResolutions={sortedResolutions}
        sortedFps={sortedFps}
        displayRes={displayRes}
        displayFps={displayFps}
        displayBitrate={displayBitrate}
        handleSetRes={handleSetRes}
        handleSetFps={handleSetFps}
        handleSetBitrate={handleSetBitrate}
        showControls={showControls}
        rotate={rotate}
        flipH={flipH}
        flipY={flipY}
        handleSetRotate={handleSetRotate}
        handleSetFlipH={handleSetFlipH}
        handleSetFlipY={handleSetFlipY}
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
      />
    </Box>
  );
};

export default memo(WebRTCPlayer, (prevProps, nextProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.camera?.dev === nextProps.camera?.dev &&
    prevProps.camera?.name === nextProps.camera?.name &&
    prevProps.camera?.streaming === nextProps.camera?.streaming &&
    prevProps.camera?.active_settings?.resolution ===
      nextProps.camera?.active_settings?.resolution &&
    prevProps.camera?.active_settings?.fps ===
      nextProps.camera?.active_settings?.fps &&
    prevProps.camera?.active_settings?.bitrate ===
      nextProps.camera?.active_settings?.bitrate
  );
});
