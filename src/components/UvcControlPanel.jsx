import { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Spinner,
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
import { SlidersHorizontal } from "lucide-react";

export const UvcControlPanel = ({
  cameraDev,
  size = "sm",
  variant = "outline",
  borderRadius = "xl",
  buttonProps = {},
  onOpenChange,
}) => {
  const [hwControls, setHwControls] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const timeoutsRef = useRef({});

  useEffect(() => {
    return () => {
      // Limpiar temporizadores activos al desmontar
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const fetchHardwareControls = async () => {
    if (hwControls.length === 0) {
      setIsLoadingControls(true);
      try {
        const response = await cameraApi.getControls(cameraDev);
        if (response.status === "success") {
          setHwControls(response.controls);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingControls(false);
      }
    }
  };

  const handleOpenChange = (details) => {
    setIsOpen(details.open);
    if (details.open) {
      fetchHardwareControls();
    }
    if (onOpenChange) {
      onOpenChange(details.open);
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

  // 1. Identificamos controles especiales
  const saturationCtrl = hwControls.find((c) => c.name === "saturation");
  const isGrayscale = saturationCtrl && Number(saturationCtrl.value) === 0;

  // Arrays de posibles nombres para el foco según el driver V4L2
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

    // Si el auto-foco está encendido, hay que apagarlo primero
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
      unmountOnExit={false}
    >
      <Popover.Trigger asChild>
        <IconButton
          size={size}
          variant={variant}
          borderRadius={borderRadius}
          colorPalette="gray"
          borderColor={variant === "outline" ? "gray.200" : undefined}
          aria-label="Ajustes de video"
          title="Ajustes de video"
          transition="all 0.2s"
          _hover={
            variant === "ghost"
              ? { bg: "blackAlpha.100" }
              : { bg: "gray.50", borderColor: "gray.300" }
          }
          {...buttonProps}
        >
          <SlidersHorizontal size={16} />
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
            width="340px"
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
                  <Spinner size="md" colorPalette="blue" />
                  <Text fontSize="sm" color="gray.500">
                    Leyendo microchip...
                  </Text>
                </Flex>
              ) : hwControls.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                  La cámara no expone controles UVC
                </Text>
              ) : (
                <VStack align="stretch" gap={2.5}>
                  {/* Sección Especial: Modo Blanco y Negro */}
                  {saturationCtrl && (
                    <Box
                      bg="gray.50"
                      p={2}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.150"
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

                  {/* Sección Especial: Ajuste de Foco */}
                  {
                    (focusAutoCtrl || focusAbsCtrl) && (
                      <Box
                        bg="gray.50"
                        p={2.5}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.150"
                      >
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="gray.700"
                          >
                            Ajuste de Foco
                          </Text>
                          {focusAbsCtrl && (
                            <Text fontSize="2xs" color="gray.400">
                              Valor: {focusAbsCtrl.value}
                            </Text>
                          )}
                        </Flex>

                        <HStack gap={2} mb={focusAbsCtrl ? 3 : 0}>
                          {focusAutoCtrl && (
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
                          )}
                          {focusAbsCtrl && (
                            <>
                              <Button
                                size="xs"
                                flex="0.5"
                                variant="outline"
                                borderRadius="md"
                                colorPalette="gray"
                                onClick={() => {
                                  const minVal = focusAbsCtrl.min ?? 0;
                                  setAbsoluteFocus(minVal);
                                }}
                              >
                                Mín
                              </Button>
                              <Button
                                size="xs"
                                flex="0.5"
                                variant="outline"
                                borderRadius="md"
                                colorPalette="gray"
                                onClick={() => {
                                  const maxVal = focusAbsCtrl.max ?? 250;
                                  setAbsoluteFocus(maxVal);
                                }}
                              >
                                Máx
                              </Button>
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
                                    debouncedCommitChange(
                                      focusAbsCtrl.name,
                                      val,
                                    );
                                  }
                                }}
                                size="xs"
                                w="60px"
                              >
                                <NumberInput.Input
                                  bg="white"
                                  borderRadius="md"
                                  borderColor="gray.300"
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
                                    handleImmediateCommit(
                                      focusAbsCtrl.name,
                                      val,
                                    );
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
                                        handleLocalChange(
                                          focusAutoCtrl.name,
                                          0,
                                        );
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
                            {focusAutoCtrl &&
                              Number(focusAutoCtrl.value) === 1 && (
                                <Text
                                  fontSize="2xs"
                                  color="gray.500"
                                  fontStyle="italic"
                                >
                                  El auto-foco está activo. Mueve el control
                                  para pasar a manual.
                                </Text>
                              )}
                          </VStack>
                        )}
                      </Box>
                    ) /* Fin Ajuste de Foco */
                  }

                  <Separator borderColor="gray.200" />

                  {/* Lista de Controles Numéricos Genéricos */}
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
                                  bg="white"
                                  borderRadius="md"
                                  color={isDisabled ? "gray.400" : "gray.800"}
                                  borderColor="gray.300"
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
