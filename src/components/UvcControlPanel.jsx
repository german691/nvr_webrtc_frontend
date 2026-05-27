import { useState, useRef, useEffect } from "react";
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
} from "@chakra-ui/react";
import { cameraApi } from "../api/camera.api";
import { SlidersHorizontal, Minus, Plus } from "lucide-react";
import { Tooltip } from "./ui/tooltip";
import { BeatLoader } from "react-spinners";

export const UvcControlPanel = ({
  cameraDev,
  size = "sm",
  variant = "outline",
  buttonProps = {},
  onOpenChange,
  portalContainer,
  positioning,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hwControls, setHwControls] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);

  const timeoutsRef = useRef({});

  useEffect(() => {
    return () => {
      // Limpiar temporizadores activos al desmontar
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

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

  // identifica controles especiales
  const saturationCtrl = hwControls.find((c) => c.name === "saturation");
  const isGrayscale = saturationCtrl && Number(saturationCtrl.value) === 0;

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

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      portalled={true}
      unmountOnExit={true}
      positioning={positioning}
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
            width="340px"
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Popover.Arrow />
            <Popover.Body p={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={3}>
                Ajustes de Video
              </Text>

              {isLoadingControls ? (
                <Flex
                  justify="center"
                  align="center"
                  py={4}
                  direction="column"
                  gap={3}
                >
                  <BeatLoader size={8} color="#2563eb" />
                  <Text fontSize="sm" color="gray.500">
                    Leyendo microchip...
                  </Text>
                </Flex>
              ) : hwControls.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                  La cámara no expone controles UVC
                </Text>
              ) : (
                <VStack
                  align="stretch"
                  gap={2.5}
                  maxH="380px"
                  overflowY="auto"
                  pr={1.5}
                  css={{
                    "&::-webkit-scrollbar": {
                      width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#CBD5E0",
                      borderRadius: "2px",
                    },
                  }}
                >
                  {saturationCtrl && (
                    <Box
                      bg="nvr.bg.muted"
                      p={2}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="nvr.border.subtle"
                    >
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

                  {(focusAutoCtrl || focusAbsCtrl) && (
                    <Box
                      bg="nvr.bg.muted"
                      p={2.5}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="nvr.border.subtle"
                    >
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.700">
                          Ajuste de Foco
                        </Text>
                      </Flex>

                      <HStack gap={2} mb={focusAbsCtrl ? 3 : 0} width="100%">
                        {focusAutoCtrl && (
                          <Tooltip
                            content="Activar Enfoque Automático"
                            showArrow
                          >
                            <Button
                              size="xs"
                              flex="1"
                              borderRadius="md"
                              colorPalette={
                                Number(focusAutoCtrl.value) === 1
                                  ? "blue"
                                  : "gray"
                              }
                              variant={
                                Number(focusAutoCtrl.value) === 1
                                  ? "solid"
                                  : "outline"
                              }
                              onClick={() => {
                                const newVal =
                                  Number(focusAutoCtrl.value) === 1 ? 0 : 1;
                                handleLocalChange(focusAutoCtrl.name, newVal);
                                handleImmediateCommit(
                                  focusAutoCtrl.name,
                                  newVal,
                                );
                              }}
                            >
                              Automático
                            </Button>
                          </Tooltip>
                        )}
                        {focusAbsCtrl && (
                          <>
                            <Tooltip
                              content="Enfoque Mínimo (Cercano / Macro)"
                              showArrow
                            >
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
                              >
                                <Minus size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              content="Enfoque Máximo (Infinito)"
                              showArrow
                            >
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
                              >
                                <Plus size={14} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </HStack>

                      {focusAbsCtrl && (
                        <VStack align="stretch" gap={1}>
                          <HStack gap={3} width="100%">
                            <input
                              type="range"
                              min={focusAbsCtrl.min ?? 0}
                              max={focusAbsCtrl.max ?? 250}
                              step={focusAbsCtrl.step ?? 1}
                              value={focusAbsCtrl.value}
                              onChange={async (e) => {
                                const val = Number(e.target.value);
                                if (
                                  focusAutoCtrl &&
                                  Number(focusAutoCtrl.value) === 1
                                ) {
                                  handleLocalChange(focusAutoCtrl.name, 0);
                                  await handleImmediateCommit(
                                    focusAutoCtrl.name,
                                    0,
                                  );
                                }
                                handleLocalChange(focusAbsCtrl.name, val);
                                debouncedCommitChange(focusAbsCtrl.name, val);
                              }}
                              style={{
                                flex: 1,
                                accentColor: "#3182ce",
                                height: "6px",
                                borderRadius: "3px",
                                background: "#E2E8F0",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            />
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
                                    await handleImmediateCommit(
                                      focusAutoCtrl.name,
                                      0,
                                    );
                                  }
                                  handleLocalChange(focusAbsCtrl.name, val);
                                  debouncedCommitChange(focusAbsCtrl.name, val);
                                }
                              }}
                              size="xs"
                              w="60px"
                            >
                              <NumberInput.Input
                                bg="nvr.bg.card"
                                borderRadius="md"
                                borderColor="nvr.border.interactive"
                                textAlign="center"
                                onBlur={async () => {
                                  let val = Number(focusAbsCtrl.value);
                                  const minVal = focusAbsCtrl.min ?? 0;
                                  const maxVal = focusAbsCtrl.max ?? 250;
                                  if (isNaN(val))
                                    val = focusAbsCtrl.default ?? minVal;
                                  if (val < minVal) val = minVal;
                                  if (val > maxVal) val = maxVal;

                                  if (
                                    focusAutoCtrl &&
                                    Number(focusAutoCtrl.value) === 1
                                  ) {
                                    handleLocalChange(focusAutoCtrl.name, 0);
                                    await handleImmediateCommit(
                                      focusAutoCtrl.name,
                                      0,
                                    );
                                  }
                                  handleLocalChange(focusAbsCtrl.name, val);
                                  handleImmediateCommit(focusAbsCtrl.name, val);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    let val = Number(focusAbsCtrl.value);
                                    const minVal = focusAbsCtrl.min ?? 0;
                                    const maxVal = focusAbsCtrl.max ?? 250;
                                    if (isNaN(val))
                                      val = focusAbsCtrl.default ?? minVal;
                                    if (val < minVal) val = minVal;
                                    if (val > maxVal) val = maxVal;

                                    if (
                                      focusAutoCtrl &&
                                      Number(focusAutoCtrl.value) === 1
                                    ) {
                                      handleLocalChange(focusAutoCtrl.name, 0);
                                      await handleImmediateCommit(
                                        focusAutoCtrl.name,
                                        0,
                                      );
                                    }
                                    handleLocalChange(focusAbsCtrl.name, val);
                                    handleImmediateCommit(
                                      focusAbsCtrl.name,
                                      val,
                                    );
                                    e.currentTarget.blur();
                                  }
                                }}
                              />
                            </NumberInput.Root>
                          </HStack>
                        </VStack>
                      )}
                    </Box>
                  )}

                  <Separator borderColor="nvr.border.default" />

                  <VStack align="stretch" gap={3}>
                    {hwControls
                      .filter(
                        (ctrl) =>
                          !autoFocusNames.includes(ctrl.name) &&
                          !absFocusNames.includes(ctrl.name),
                      )
                      .map((ctrl) => {
                        const isSaturation = ctrl.name === "saturation";
                        const isDisabled = isSaturation && isGrayscale;

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
                                  cursor: isDisabled
                                    ? "not-allowed"
                                    : "pointer",
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
                                  color={
                                    isDisabled ? "gray.400" : "nvr.text.primary"
                                  }
                                  borderColor="nvr.border.interactive"
                                  textAlign="center"
                                  onBlur={() => {
                                    let val = Number(ctrl.value);
                                    if (isNaN(val))
                                      val = ctrl.default ?? minVal;
                                    if (val < minVal) val = minVal;
                                    if (val > maxVal) val = maxVal;
                                    handleLocalChange(ctrl.name, val);
                                    handleImmediateCommit(ctrl.name, val);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      let val = Number(ctrl.value);
                                      if (isNaN(val))
                                        val = ctrl.default ?? minVal;
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

                  <Button
                    mt={2}
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
                </VStack>
              )}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};
