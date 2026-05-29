import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Switch,
  Text,
  VStack,
  HStack,
  Button,
  Separator,
  IconButton,
  Popover,
  Portal,
  NumberInput,
  Group,
} from "@chakra-ui/react";
import { cameraApi } from "../api/camera.api";
import { SlidersHorizontal, Flower, Mountain, X } from "lucide-react";
import { Tooltip } from "./ui/tooltip";
import { BeatLoader } from "react-spinners";
import FocusSlider from "./ui/FocusSlider.jsx";

export const UvcControlPanel = ({
  cameraDev,
  size = "sm",
  variant = "outline",
  buttonProps = {},
  onOpenChange,
  portalContainer,
  positioning,
  isInline = false,
  cameraNumber,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hwControls, setHwControls] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);

  const timeoutsRef = useRef({});

  const handleLocalChange = (controlName, newValue) => {
    setHwControls((prev) =>
      prev.map((c) => (c.name === controlName ? { ...c, value: newValue } : c)),
    );
  };

  const handleCommitChange = async (controlName, newValue) => {
    const numericValue = Number(newValue);
    if (isNaN(numericValue)) return;

    try {
      await cameraApi.setControl({
        dev: cameraDev,
        controlName,
        value: numericValue,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const debouncedCommitChange = (controlName, newValue) => {
    if (timeoutsRef.current[controlName]) {
      clearTimeout(timeoutsRef.current[controlName]);
    }

    timeoutsRef.current[controlName] = setTimeout(() => {
      handleCommitChange(controlName, newValue);
      delete timeoutsRef.current[controlName];
    }, 300);
  };

  const handleImmediateCommit = async (controlName, newValue) => {
    if (timeoutsRef.current[controlName]) {
      clearTimeout(timeoutsRef.current[controlName]);
      delete timeoutsRef.current[controlName];
    }
    await handleCommitChange(controlName, newValue);
  };

  const handleReset = async () => {
    for (const ctrl of hwControls) {
      if (ctrl.default !== undefined && ctrl.value !== ctrl.default) {
        handleLocalChange(ctrl.name, ctrl.default);
        await handleImmediateCommit(ctrl.name, ctrl.default);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Limpiar temporizadores activos al desmontar
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (isInline && hwControls.length === 0) {
      const loadControls = async () => {
        setIsLoadingControls(true);
        try {
          const response = await cameraApi.getControls(cameraDev);
          if (response.status === "success" && response.controls) {
            setHwControls(response.controls);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingControls(false);
        }
      };
      loadControls();
    }
  }, [isInline, cameraDev, hwControls.length]);

  // identifica controles especiales
  const saturationCtrl = hwControls.find((c) => c.name === "saturation");
  const isGrayscale = saturationCtrl && Number(saturationCtrl.value) === 0;

  // posibles nombres de balance de blancos automático y manual según V4L2
  const autoWhiteBalanceNames = [
    "white_balance_temperature_auto",
    "white_balance_automatic",
    "white_balance_auto",
    "auto_white_balance",
  ];
  const wbTempCtrlNames = [
    "white_balance_temperature",
    "white_balance_temperature_absolute",
  ];

  const wbAutoCtrl = hwControls.find((c) =>
    autoWhiteBalanceNames.includes(c.name),
  );

  // posibles nombres de foco según V4L2
  const autoFocusNames = [
    "focus_auto",
    "focus_automatic_continuous",
    "auto_focus",
  ];
  const absFocusNames = ["focus_absolute", "focus"];

  const focusAutoCtrl = hwControls.find((c) => autoFocusNames.includes(c.name));
  const focusAbsCtrl = hwControls.find((c) => absFocusNames.includes(c.name));

  const setAbsoluteFocus = async (targetValue) => {
    if (!focusAbsCtrl) return;

    if (focusAutoCtrl && Number(focusAutoCtrl.value) === 1) {
      handleLocalChange(focusAutoCtrl.name, 0);
      await handleImmediateCommit(focusAutoCtrl.name, 0);
    }
    handleLocalChange(focusAbsCtrl.name, targetValue);
    await handleImmediateCommit(focusAbsCtrl.name, targetValue);
  };

  const wheelHandlerRef = useRef(null);

  const focusScrollCallbackRef = useCallback(
    (node) => {
      // Limpia el escuchador anterior si está activo
      if (wheelHandlerRef.current && wheelHandlerRef.current.node) {
        const { node: prevNode, handler: prevHandler } =
          wheelHandlerRef.current;
        prevNode.removeEventListener("wheel", prevHandler);
        wheelHandlerRef.current = null;
      }

      // Registra el escuchador en el nuevo nodo montado instantáneamente
      if (node) {
        const handleWheel = (e) => {
          const autoFocusNames = [
            "focus_auto",
            "focus_automatic_continuous",
            "auto_focus",
          ];
          const absFocusNames = ["focus_absolute", "focus"];
          const focusAutoCtrl = hwControls.find((ctrl) =>
            autoFocusNames.includes(ctrl.name),
          );
          const focusAbsCtrl = hwControls.find((ctrl) =>
            absFocusNames.includes(ctrl.name),
          );

          if (!focusAbsCtrl) return;

          // Evita hacer scroll sobre el contenido o popover del componente
          e.preventDefault();
          e.stopPropagation();

          const step = focusAbsCtrl.step ?? 1;
          const minVal = focusAbsCtrl.min ?? 0;
          const maxVal = focusAbsCtrl.max ?? 250;
          const range = maxVal - minVal;
          const deltaMult = Math.max(1, Math.round(range / 50));
          const delta = e.deltaY < 0 ? step * deltaMult : -step * deltaMult;
          let newVal = Number(focusAbsCtrl.value) + delta;
          if (newVal < minVal) newVal = minVal;
          if (newVal > maxVal) newVal = maxVal;

          if (focusAutoCtrl && Number(focusAutoCtrl.value) === 1) {
            handleLocalChange(focusAutoCtrl.name, 0);
            handleImmediateCommit(focusAutoCtrl.name, 0);
          }
          handleLocalChange(focusAbsCtrl.name, newVal);
          debouncedCommitChange(focusAbsCtrl.name, newVal);
        };

        node.addEventListener("wheel", handleWheel, { passive: false });
        wheelHandlerRef.current = { node, handler: handleWheel };
      }
    },
    [hwControls, debouncedCommitChange, handleImmediateCommit],
  );

  const renderControlsBody = () => {
    if (isLoadingControls) {
      return (
        <Flex justify="center" align="center" py={8} direction="column" gap={3}>
          <BeatLoader size={8} color="#2563eb" />
          <Text fontSize="xs" color="gray.500">
            Leyendo microchip...
          </Text>
        </Flex>
      );
    }

    if (hwControls.length === 0) {
      return (
        <Flex justify="center" align="center" py={8}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            La cámara no expone controles UVC
          </Text>
        </Flex>
      );
    }

    return (
      <Flex direction="column" overflow="hidden" maxH="380px">
        <Button
          mb={2}
          size="xs"
          width="100%"
          borderRadius="lg"
          colorPalette="gray"
          variant="outline"
          onClick={handleReset}
          _hover={{ bg: "gray.100" }}
        >
          Restablecer valores por defecto
        </Button>

        <VStack
          align="stretch"
          gap={2}
          overflowY="auto"
          pr={1}
          css={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0, 0, 0, 0.15)",
              borderRadius: "2px",
            },
          }}
        >
          <Separator borderColor="nvr.border.default" />

          {saturationCtrl && (
            <Box>
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" fontWeight="bold" color="gray.700">
                  Modo Blanco y Negro
                </Text>
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={isGrayscale}
                  onCheckedChange={(e) => {
                    const checked = e.checked;
                    const newValue = checked
                      ? 0
                      : (saturationCtrl.default ?? 128);
                    handleLocalChange("saturation", newValue);
                    handleImmediateCommit("saturation", newValue);
                  }}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>
            </Box>
          )}

          {wbAutoCtrl && (
            <>
              <Separator borderColor="nvr.border.default" />
              <Box>
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">
                    Balance de Blancos Automático
                  </Text>
                  <Switch.Root
                    size="sm"
                    colorPalette="blue"
                    checked={Number(wbAutoCtrl.value) === 1}
                    onCheckedChange={(e) => {
                      const checked = e.checked;
                      const newValue = checked ? 1 : 0;
                      handleLocalChange(wbAutoCtrl.name, newValue);
                      handleImmediateCommit(wbAutoCtrl.name, newValue);
                    }}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Flex>
              </Box>
            </>
          )}

          <Separator borderColor="nvr.border.default" />

          {(focusAutoCtrl || focusAbsCtrl) && (
            <VStack align="stretch" gap={2.5} w="100%">
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" fontWeight="bold" color="gray.700">
                  Ajuste de Foco
                </Text>
              </Flex>

              <HStack gap={1.5} width="100%" justify="space-between" mb={1.5}>
                {focusAbsCtrl && (
                  <>
                    <Tooltip content="Enfoque Mínimo (Macro)" showArrow>
                      <IconButton
                        size="xs"
                        variant="outline"
                        borderRadius="md"
                        colorPalette="gray"
                        aria-label="Foco Mínimo"
                        onClick={() => {
                          const minVal = focusAbsCtrl.min ?? 0;
                          setAbsoluteFocus(minVal);
                        }}
                        h="32px"
                        w="32px"
                      >
                        <Flower size={14} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip content="Enfoque Máximo (Infinito)" showArrow>
                      <IconButton
                        size="xs"
                        variant="outline"
                        borderRadius="md"
                        colorPalette="gray"
                        aria-label="Foco Máximo"
                        onClick={() => {
                          const maxVal = focusAbsCtrl.max ?? 250;
                          setAbsoluteFocus(maxVal);
                        }}
                        h="32px"
                        w="32px"
                      >
                        <Mountain size={14} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {focusAutoCtrl && (
                  <Group attached flexGrow="1">
                    <Button
                      size="xs"
                      variant={
                        Number(focusAutoCtrl.value) === 0 ? "subtle" : "outline"
                      }
                      colorPalette={
                        Number(focusAutoCtrl.value) === 0 ? "blue" : "gray"
                      }
                      borderRadius="md"
                      onClick={() => {
                        handleLocalChange(focusAutoCtrl.name, 0);
                        handleImmediateCommit(focusAutoCtrl.name, 0);
                      }}
                      fontSize="2xs"
                      fontWeight="bold"
                      flexGrow="1"
                      h="32px"
                    >
                      Fijo
                    </Button>
                    <Button
                      size="xs"
                      variant={
                        Number(focusAutoCtrl.value) === 1 ? "subtle" : "outline"
                      }
                      colorPalette={
                        Number(focusAutoCtrl.value) === 1 ? "blue" : "gray"
                      }
                      borderRadius="md"
                      onClick={() => {
                        handleLocalChange(focusAutoCtrl.name, 1);
                        handleImmediateCommit(focusAutoCtrl.name, 1);
                      }}
                      fontSize="2xs"
                      fontWeight="bold"
                      flexGrow="1"
                      h="32px"
                    >
                      Auto
                    </Button>
                  </Group>
                )}

                {focusAbsCtrl && (
                  <NumberInput.Root
                    min={focusAbsCtrl.min ?? 0}
                    max={focusAbsCtrl.max ?? 250}
                    step={focusAbsCtrl.step ?? 1}
                    value={String(focusAbsCtrl.value)}
                    onValueChange={async (details) => {
                      const val = details.valueAsNumber;
                      if (!isNaN(val)) {
                        if (
                          focusAutoCtrl &&
                          Number(focusAutoCtrl.value) === 1
                        ) {
                          handleLocalChange(focusAutoCtrl.name, 0);
                          await handleImmediateCommit(focusAutoCtrl.name, 0);
                        }
                        handleLocalChange(focusAbsCtrl.name, val);
                        debouncedCommitChange(focusAbsCtrl.name, val);
                      }
                    }}
                    size="sm"
                  >
                    <NumberInput.Input
                      bg="nvr.bg.card"
                      borderRadius="md"
                      borderColor="nvr.border.interactive"
                      textAlign="center"
                      fontSize="2xs"
                      w="60px"
                      p={1}
                      h="32px"
                      onBlur={async () => {
                        let val = Number(focusAbsCtrl.value);
                        const minVal = focusAbsCtrl.min ?? 0;
                        const maxVal = focusAbsCtrl.max ?? 250;
                        if (isNaN(val)) val = focusAbsCtrl.default ?? minVal;
                        if (val < minVal) val = minVal;
                        if (val > maxVal) val = maxVal;

                        if (
                          focusAutoCtrl &&
                          Number(focusAutoCtrl.value) === 1
                        ) {
                          handleLocalChange(focusAutoCtrl.name, 0);
                          await handleImmediateCommit(focusAutoCtrl.name, 0);
                        }
                        handleLocalChange(focusAbsCtrl.name, val);
                        handleImmediateCommit(focusAbsCtrl.name, val);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          let val = Number(focusAbsCtrl.value);
                          const minVal = focusAbsCtrl.min ?? 0;
                          const maxVal = focusAbsCtrl.max ?? 250;
                          if (isNaN(val)) val = focusAbsCtrl.default ?? minVal;
                          if (val < minVal) val = minVal;
                          if (val > maxVal) val = maxVal;

                          if (
                            focusAutoCtrl &&
                            Number(focusAutoCtrl.value) === 1
                          ) {
                            handleLocalChange(focusAutoCtrl.name, 0);
                            await handleImmediateCommit(focusAutoCtrl.name, 0);
                          }
                          handleLocalChange(focusAbsCtrl.name, val);
                          handleImmediateCommit(focusAbsCtrl.name, val);
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </NumberInput.Root>
                )}
              </HStack>

              {focusAbsCtrl && (
                <FocusSlider
                  focusAbsCtrl={focusAbsCtrl}
                  focusAutoCtrl={focusAutoCtrl}
                  focusScrollCallbackRef={focusScrollCallbackRef}
                  handleLocalChange={handleLocalChange}
                  debouncedCommitChange={debouncedCommitChange}
                  handleImmediateCommit={handleImmediateCommit}
                />
              )}
            </VStack>
          )}

          <Separator borderColor="nvr.border.default" />

          <VStack align="stretch" gap={3}>
            {hwControls
              .filter(
                (ctrl) =>
                  !autoFocusNames.includes(ctrl.name) &&
                  !absFocusNames.includes(ctrl.name) &&
                  !autoWhiteBalanceNames.includes(ctrl.name),
              )
              .map((ctrl) => {
                const isSaturation = ctrl.name === "saturation";
                const isWbTemp = wbTempCtrlNames.includes(ctrl.name);
                const isDisabled =
                  (isSaturation && isGrayscale) ||
                  (isWbTemp && wbAutoCtrl && Number(wbAutoCtrl.value) === 1);

                const minVal = ctrl.min ?? 0;
                const maxVal = ctrl.max ?? 255;
                const stepVal = ctrl.step ?? 1;

                return (
                  <VStack key={ctrl.name} align="stretch" gap={1}>
                    <Flex justify="space-between" align="center">
                      <Text
                        fontSize="xs"
                        color={isDisabled ? "gray.400" : "gray.600"}
                        textTransform="capitalize"
                        fontWeight="bold"
                      >
                        {ctrl.name.replace(/_/g, " ")}
                      </Text>
                      <Text fontSize="2xs" color="gray.400">
                        Rango: {minVal} - {maxVal}
                      </Text>
                    </Flex>
                    <HStack gap={3} width="100%">
                      <input
                        type="range"
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={ctrl.value}
                        disabled={isDisabled}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleLocalChange(ctrl.name, val);
                          debouncedCommitChange(ctrl.name, val);
                        }}
                        style={{
                          flex: 1,
                          accentColor: "#3182ce",
                          height: "6px",
                          borderRadius: "3px",
                          background: "#E2E8F0",
                          outline: "none",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      />
                      <NumberInput.Root
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={String(ctrl.value)}
                        disabled={isDisabled}
                        onValueChange={(details) => {
                          const val = details.valueAsNumber;
                          if (!isNaN(val)) {
                            handleLocalChange(ctrl.name, val);
                            debouncedCommitChange(ctrl.name, val);
                          }
                        }}
                        size="xs"
                        w="60px"
                      >
                        <NumberInput.Input
                          bg="nvr.bg.card"
                          borderRadius="md"
                          color={isDisabled ? "gray.400" : "nvr.text.primary"}
                          borderColor="nvr.border.interactive"
                          textAlign="center"
                          onBlur={() => {
                            let val = Number(ctrl.value);
                            if (isNaN(val)) val = ctrl.default ?? minVal;
                            if (val < minVal) val = minVal;
                            if (val > maxVal) val = maxVal;
                            handleLocalChange(ctrl.name, val);
                            handleImmediateCommit(ctrl.name, val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              let val = Number(ctrl.value);
                              if (isNaN(val)) val = ctrl.default ?? minVal;
                              if (val < minVal) val = minVal;
                              if (val > maxVal) val = maxVal;
                              handleLocalChange(ctrl.name, val);
                              handleImmediateCommit(ctrl.name, val);
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </NumberInput.Root>
                    </HStack>
                  </VStack>
                );
              })}
          </VStack>
        </VStack>
      </Flex>
    );
  };

  if (isInline) {
    const videowallEl =
      typeof document !== "undefined"
        ? document.getElementById("nvr-videowall")
        : null;
    const portalTarget =
      portalContainer?.current ||
      videowallEl ||
      (typeof document !== "undefined" ? document.body : null);

    if (!portalTarget) return null;

    return (
      <Portal container={{ current: portalTarget }}>
        <Box
          position="absolute"
          bottom="24px"
          right="24px"
          w="300px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          p={3}
          borderRadius="xl"
          shadow="2xl"
          zIndex={2000}
          display="flex"
          flexDirection="column"
          textAlign="left"
          color="gray.800"
          transition="all 0.3s ease"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <Flex justify="space-between" align="center" mb={3} w="full">
            <Text fontSize="xs" fontWeight="bold" color="gray.700">
              Ajustes de Video cámara {cameraNumber ? `(${cameraNumber})` : ""}
            </Text>
            <IconButton
              size="2xs"
              variant="ghost"
              color="gray.600"
              _hover={{ bg: "blackAlpha.100", color: "gray.800" }}
              aria-label="Cerrar"
              onClick={() => onOpenChange(false)}
            >
              <X size={14} />
            </IconButton>
          </Flex>

          {renderControlsBody()}
        </Box>
      </Portal>
    );
  }

  const handleOpenChange = async (details) => {
    if (details.open) {
      setIsOpen(true);
      if (onOpenChange) {
        onOpenChange(true);
      }
      if (hwControls.length === 0) {
        setIsLoadingControls(true);
        try {
          const response = await cameraApi.getControls(cameraDev);
          if (response.status === "success" && response.controls) {
            setHwControls(response.controls);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingControls(false);
        }
      }
    } else {
      setIsOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      portalled={true}
      unmountOnExit={true}
      positioning={positioning || { placement: "bottom", gutter: 8 }}
    >
      <Tooltip
        content={
          isLoadingControls
            ? "Leyendo microchip de cámara..."
            : "Ajustes de video"
        }
        showArrow
      >
        <span style={{ display: "inline-block" }}>
          <Popover.Trigger asChild>
            <IconButton
              size={size}
              variant={variant}
              colorPalette="gray"
              borderColor={
                variant === "outline" ? "nvr.border.default" : undefined
              }
              aria-label="Ajustes de video"
              loading={isLoadingControls}
              spinner={
                <BeatLoader size={size === "xs" ? 4 : 6} color="#4b5563" />
              }
              transition="all 0.2s"
              _hover={
                variant === "ghost"
                  ? { bg: "blackAlpha.100" }
                  : {
                      bg: "nvr.bg.muted",
                      borderColor: "nvr.border.interactive",
                    }
              }
              {...buttonProps}
            >
              <SlidersHorizontal size={size === "xs" ? 14 : 16} />
            </IconButton>
          </Popover.Trigger>
        </span>
      </Tooltip>
      <Portal container={portalContainer}>
        <Popover.Positioner zIndex={1600}>
          <Popover.Content
            bg="nvr.bg.modal"
            borderColor="nvr.border.default"
            shadow="lg"
            p={3}
            borderRadius="lg"
            zIndex="popover"
            width="300px"
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Popover.Arrow />
            <Popover.Body p={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={3}>
                Ajustes de Video cámara{" "}
                {cameraNumber ? `(${cameraNumber})` : ""}
              </Text>

              {renderControlsBody()}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};
