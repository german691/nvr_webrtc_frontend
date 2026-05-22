import { useState } from "react";
import {
  Box,
  Flex,
  Spinner,
  Input,
  Switch,
  Text,
  VStack,
  HStack,
  Button,
  Separator,
  IconButton,
  Popover,
} from "@chakra-ui/react";
import { cameraApi } from "../api/camera.api";
import { SlidersHorizontal } from "lucide-react";

export const UvcControlPanel = ({ cameraDev }) => {
  const [hwControls, setHwControls] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleReset = async () => {
    for (const ctrl of hwControls) {
      if (ctrl.default !== undefined && ctrl.value !== ctrl.default) {
        handleLocalChange(ctrl.name, ctrl.default);
        await handleCommitChange(ctrl.name, ctrl.default);
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
      await handleCommitChange(focusAutoCtrl.name, 0);
    }
    handleLocalChange(focusAbsCtrl.name, targetValue);
    handleCommitChange(focusAbsCtrl.name, targetValue);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange} portalled={true} unmountOnExit={false}>
      <Popover.Trigger asChild>
        <IconButton
          size="sm"
          variant="outline"
          colorPalette="gray"
          aria-label="Ajustes de video"
          title="Ajustes de video"
        >
          <SlidersHorizontal size={16} />
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg="white"
          borderColor="gray.200"
          shadow="md"
          p={4}
          borderRadius="md"
          zIndex="popover"
          width="320px"
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
              <VStack align="stretch" gap={3}>
                {/* Sección Especial: Modo Blanco y Negro */}
                {saturationCtrl && (
                  <Box
                    bg="gray.50"
                    p={2}
                    borderRadius="sm"
                    borderWidth="1px"
                    borderColor="gray.200"
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
                          handleCommitChange("saturation", newValue);
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
                {(focusAutoCtrl || focusAbsCtrl) && (
                  <Box
                    bg="gray.50"
                    p={2}
                    borderRadius="sm"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={2}>
                      Ajuste de Foco
                    </Text>
                    <HStack gap={2}>
                      {focusAutoCtrl && (
                        <Button
                          size="xs"
                          flex="1"
                          colorPalette={
                            Number(focusAutoCtrl.value) === 1 ? "blue" : "gray"
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
                            handleCommitChange(focusAutoCtrl.name, newVal);
                          }}
                        >
                          Automático
                        </Button>
                      )}
                      {focusAbsCtrl && (
                        <>
                          <Button
                            size="xs"
                            flex="1"
                            variant="outline"
                            colorPalette="gray"
                            onClick={() => {
                              const minVal = focusAbsCtrl.min ?? 0;
                              setAbsoluteFocus(minVal);
                            }}
                          >
                            Mínimo
                          </Button>
                          <Button
                            size="xs"
                            flex="1"
                            variant="outline"
                            colorPalette="gray"
                            onClick={() => {
                              const maxVal = focusAbsCtrl.max ?? 250;
                              setAbsoluteFocus(maxVal);
                            }}
                          >
                            Máximo
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Box>
                )}

                <Separator borderColor="gray.200" />

                {/* Lista de Controles Numéricos Genéricos */}
                <VStack align="stretch" gap={2}>
                  {hwControls
                    .filter(
                      (ctrl) =>
                        !autoFocusNames.includes(ctrl.name) &&
                        !absFocusNames.includes(ctrl.name),
                    )
                    .map((ctrl) => {
                      const isSaturation = ctrl.name === "saturation";
                      const isDisabled = isSaturation && isGrayscale;

                      return (
                        <Flex
                          key={ctrl.name}
                          justify="space-between"
                          align="center"
                        >
                          <Text
                            fontSize="xs"
                            color={isDisabled ? "gray.400" : "gray.600"}
                            textTransform="capitalize"
                            fontWeight="medium"
                          >
                            {ctrl.name.replace(/_/g, " ")}
                          </Text>
                          <Input
                            type="number"
                            size="xs"
                            w="70px"
                            bg="white"
                            color={isDisabled ? "gray.400" : "gray.800"}
                            borderColor="gray.300"
                            textAlign="center"
                            value={ctrl.value}
                            disabled={isDisabled}
                            onChange={(e) =>
                              handleLocalChange(ctrl.name, e.target.value)
                            }
                            onBlur={() =>
                              handleCommitChange(ctrl.name, ctrl.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleCommitChange(ctrl.name, ctrl.value);
                            }}
                          />
                        </Flex>
                      );
                    })}
                </VStack>

                <Button
                  mt={2}
                  size="xs"
                  width="100%"
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
    </Popover.Root>
  );
};
