import { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Button,
  IconButton,
  Text,
} from "@chakra-ui/react";
import {
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";
import { cameraApi } from "../api/camera.api";
import { BeatLoader } from "react-spinners";

export const PtzJoystick = ({
  cameraDev,
  onDetach,
  onClose,
  isFloating = false,
}) => {
  const [pan, setPan] = useState({
    min: -36000,
    max: 36000,
    val: 0,
    step: 3600,
  });
  const [tilt, setTilt] = useState({
    min: -36000,
    max: 36000,
    val: 0,
    step: 3600,
  });
  const [zoom, setZoom] = useState({ min: 100, max: 500, val: 100, step: 10 });
  const [isLoading, setIsLoading] = useState(true);

  const baseRef = useRef(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isSteering, setIsSteering] = useState(false);
  const steeringRef = useRef({ dx: 0, dy: 0, active: false });
  const intervalRef = useRef(null);

  // Cargar valores iniciales del hardware UVC
  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await cameraApi.getControls(cameraDev);
        if (res.status === "success" && active) {
          const panCtrl = res.controls.find((c) => c.name === "pan_absolute");
          const tiltCtrl = res.controls.find((c) => c.name === "tilt_absolute");
          const zoomCtrl = res.controls.find((c) => c.name === "zoom_absolute");

          if (panCtrl) {
            setPan({
              min: panCtrl.min ?? -36000,
              max: panCtrl.max ?? 36000,
              val: panCtrl.value ?? 0,
              step: panCtrl.step ?? 3600,
            });
          }
          if (tiltCtrl) {
            setTilt({
              min: tiltCtrl.min ?? -36000,
              max: tiltCtrl.max ?? 36000,
              val: tiltCtrl.value ?? 0,
              step: tiltCtrl.step ?? 3600,
            });
          }
          if (zoomCtrl) {
            setZoom({
              min: zoomCtrl.min ?? 100,
              max: zoomCtrl.max ?? 500,
              val: zoomCtrl.value ?? 100,
              step: zoomCtrl.step ?? 10,
            });
          }
        }
      } catch (err) {
        console.error("Error cargando controles PTZ:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, [cameraDev]);

  // Manejador del Drag & Paneo Analógico
  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    steeringRef.current.active = true;
    setIsSteering(true);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!steeringRef.current.active || !baseRef.current) return;
    const baseRect = baseRef.current.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = isFloating ? 16 : 30; // Radio de holgura visual adaptado

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    steeringRef.current.dx = dx;
    steeringRef.current.dy = dy;
  };

  const handlePointerUp = () => {
    steeringRef.current.active = false;
    setIsSteering(false);
    setKnobPos({ x: 0, y: 0 });
    steeringRef.current.dx = 0;
    steeringRef.current.dy = 0;

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };

  // Intervalo repetitivo para no saturar con llamadas HTTP y permitir paneo fluido
  useEffect(() => {
    if (isSteering) {
      intervalRef.current = setInterval(async () => {
        const { dx, dy } = steeringRef.current;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6) return; // Zona muerta más pequeña para modo compacto

        let changed = false;
        let nextPan = pan.val;
        let nextTilt = tilt.val;

        // Paneo Horizontal
        if (dx < -8) {
          nextPan = Math.max(pan.min, nextPan - pan.step);
          changed = true;
        } else if (dx > 8) {
          nextPan = Math.min(pan.max, nextPan + pan.step);
          changed = true;
        }

        // Paneo Vertical
        if (dy < -8) {
          nextTilt = Math.min(tilt.max, nextTilt + tilt.step);
          changed = true;
        } else if (dy > 8) {
          nextTilt = Math.max(tilt.min, nextTilt - tilt.step);
          changed = true;
        }

        if (changed) {
          setPan((p) => ({ ...p, val: nextPan }));
          setTilt((t) => ({ ...t, val: nextTilt }));

          try {
            await cameraApi.setControl({
              dev: cameraDev,
              controlName: "pan_absolute",
              value: nextPan,
            });
            await cameraApi.setControl({
              dev: cameraDev,
              controlName: "tilt_absolute",
              value: nextTilt,
            });
          } catch (err) {
            console.error("Error al mover PTZ:", err);
          }
        }
      }, 220);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSteering, pan, tilt, cameraDev]);

  // Controles de zoom
  const adjustZoom = async (zoomDir) => {
    let nextZoom = zoom.val;
    if (zoomDir === "in") {
      nextZoom = Math.min(zoom.max, nextZoom + zoom.step * 2);
    } else {
      nextZoom = Math.max(zoom.min, nextZoom - zoom.step * 2);
    }

    setZoom((z) => ({ ...z, val: nextZoom }));
    try {
      await cameraApi.setControl({
        dev: cameraDev,
        controlName: "zoom_absolute",
        value: nextZoom,
      });
    } catch (err) {
      console.error("Error al ajustar Zoom UVC:", err);
    }
  };

  // Botón de centrado
  const handleReset = async () => {
    setPan((p) => ({ ...p, val: 0 }));
    setTilt((t) => ({ ...t, val: 0 }));
    setZoom((z) => ({ ...z, val: 100 }));

    try {
      await cameraApi.setControl({
        dev: cameraDev,
        controlName: "pan_absolute",
        value: 0,
      });
      await cameraApi.setControl({
        dev: cameraDev,
        controlName: "tilt_absolute",
        value: 0,
      });
      await cameraApi.setControl({
        dev: cameraDev,
        controlName: "zoom_absolute",
        value: 100,
      });
    } catch (err) {
      console.error("Error al restablecer valores PTZ:", err);
    }
  };

  const containerStyles = isFloating
    ? {
        position: "absolute",
        bottom: "12px",
        left: "12px",
        zIndex: 100,
        bg: "rgba(255, 255, 255, 0.25)", // Alta translucidez frosted glass para transparencia premium
        backdropFilter: "blur(10px)",
        borderWidth: "1px",
        borderColor: "rgba(255, 255, 255, 0.25)",
        borderRadius: "xl", // Un poco menos de redondeo (de 2xl a xl)
        p: 2,
        w: "88px", // Extremadamente compacto para ocupar el mínimo espacio
        shadow: "2xl",
        borderStyle: "solid",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }
    : {
        bg: "white",
        p: 2.5,
        w: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      };

  if (isLoading) {
    return (
      <Box
        {...containerStyles}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH={isFloating ? "90px" : "180px"}
      >
        <BeatLoader size={isFloating ? 4 : 6} color="#2563eb" />
        <Text fontSize="2xs" color="gray.500" mt={2} fontWeight="bold">
          PTZ...
        </Text>
      </Box>
    );
  }

  const baseSize = isFloating ? "64px" : "110px";
  const stickSize = isFloating ? "22px" : "44px";
  const centerDotSize = isFloating ? "6px" : "14px";
  const iconSize = isFloating ? 6 : 10;

  return (
    <Box {...containerStyles}>
      {/* Botón de cierre absoluto y flotante en la esquina */}
      {isFloating && (
        <IconButton
          size="2xs"
          variant="ghost"
          colorPalette="gray"
          onClick={onClose}
          aria-label="Cerrar joystick"
          borderRadius="full"
          position="absolute"
          top={1}
          right={1}
          h="14px"
          w="14px"
          minW="auto"
          bg="rgba(0, 0, 0, 0.04)"
          _hover={{ bg: "rgba(0, 0, 0, 0.12)" }}
        >
          <X size={8} />
        </IconButton>
      )}

      {/* Anillo y Stick de Dirección PTZ */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        w={baseSize}
        h={baseSize}
        bg={
          isFloating ? "rgba(240, 240, 240, 0.25)" : "rgba(240, 240, 240, 0.5)"
        }
        borderRadius="full"
        borderWidth="1.5px"
        borderColor={
          isFloating ? "rgba(200, 200, 200, 0.25)" : "rgba(200, 200, 200, 0.4)"
        }
        mb={isFloating ? 1.5 : 3}
        shadow={isFloating ? "none" : "inner"}
        ref={baseRef}
        mt={isFloating ? 2 : 0}
      >
        {/* Indicadores visuales */}
        <Box position="absolute" top={1} color="gray.400">
          <MoveUp size={iconSize} />
        </Box>
        <Box position="absolute" bottom={1} color="gray.400">
          <MoveDown size={iconSize} />
        </Box>
        <Box position="absolute" left={1} color="gray.400">
          <MoveLeft size={iconSize} />
        </Box>
        <Box position="absolute" right={1} color="gray.400">
          <MoveRight size={iconSize} />
        </Box>

        {/* Joystick Stick Knob */}
        <Box
          w={stickSize}
          h={stickSize}
          bgGradient={
            isFloating
              ? "to-b, rgba(255, 255, 255, 0.85), rgba(240, 240, 240, 0.65)"
              : "to-b, white, gray.100"
          }
          borderRadius="full"
          borderWidth="1px"
          borderColor={isFloating ? "rgba(200, 200, 200, 0.4)" : "gray.350"}
          boxShadow={
            isFloating
              ? "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.8)"
              : "0 3px 6px rgba(0,0,0,0.15), inset 0 1.5px 1.5px white"
          }
          cursor={isSteering ? "grabbing" : "grab"}
          onPointerDown={handlePointerDown}
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            transition: isSteering
              ? "none"
              : "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={5}
        >
          {/* Centro del stick */}
          <Box
            w={centerDotSize}
            h={centerDotSize}
            bg="blue.500"
            borderRadius="full"
            shadow="inner"
          />
        </Box>
      </Box>

      {/* Botones auxiliares: Zoom y Centrado */}
      <VStack gap={1.5} width="100%">
        <HStack justify="center" gap={1} width="100%">
          <IconButton
            size="2xs"
            variant="outline"
            borderColor="rgba(0, 0, 0, 0.08)"
            colorPalette="gray"
            color="gray.600"
            _hover={{
              bg: "rgba(0, 0, 0, 0.05)",
              borderColor: "rgba(0,0,0,0.12)",
            }}
            onClick={() => adjustZoom("out")}
            title="Alejar zoom"
            aria-label="Zoom Out"
            borderRadius="md"
            h={isFloating ? "18px" : "24px"}
            w={isFloating ? "18px" : "24px"}
            minW="auto"
            bg="whiteAlpha.600"
          >
            <ZoomOut size={isFloating ? 9 : 13} />
          </IconButton>

          {isFloating ? (
            <IconButton
              size="2xs"
              variant="outline"
              borderColor="rgba(0, 0, 0, 0.08)"
              colorPalette="gray"
              color="gray.700"
              _hover={{
                bg: "rgba(0, 0, 0, 0.05)",
                borderColor: "rgba(0,0,0,0.12)",
              }}
              onClick={handleReset}
              title="Centrar"
              aria-label="Centrar"
              borderRadius="md"
              h="18px"
              w="18px"
              minW="auto"
              bg="whiteAlpha.600"
            >
              <RefreshCw size={9} />
            </IconButton>
          ) : (
            <Button
              size="2xs"
              variant="surface"
              colorPalette="gray"
              color="gray.700"
              _hover={{ bg: "gray.150" }}
              onClick={handleReset}
              title="Centrar"
              fontWeight="bold"
              fontSize="2xs"
              borderRadius="md"
              h="24px"
              px={2.5}
              leftIcon={<RefreshCw size={10} />}
            >
              Centrar
            </Button>
          )}

          <IconButton
            size="2xs"
            variant="outline"
            borderColor="rgba(0, 0, 0, 0.08)"
            colorPalette="gray"
            color="gray.600"
            _hover={{
              bg: "rgba(0, 0, 0, 0.05)",
              borderColor: "rgba(0,0,0,0.12)",
            }}
            onClick={() => adjustZoom("in")}
            title="Acercar zoom"
            aria-label="Zoom In"
            borderRadius="md"
            h={isFloating ? "18px" : "24px"}
            w={isFloating ? "18px" : "24px"}
            minW="auto"
            bg="whiteAlpha.600"
          >
            <ZoomIn size={isFloating ? 9 : 13} />
          </IconButton>
        </HStack>

        {/* Botón de desanclar si está acoplado */}
        {!isFloating && onDetach && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="blue"
            color="blue.600"
            fontSize="2xs"
            fontWeight="bold"
            mt={1}
            onClick={onDetach}
            w="100%"
            borderRadius="md"
            gap={1.5}
          >
            <ExternalLink size={10} />
            Desacoplar Control
          </Button>
        )}
      </VStack>
    </Box>
  );
};
