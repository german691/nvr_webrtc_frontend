import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Popover,
  Portal,
} from "@chakra-ui/react";
import { LayoutGrid, RotateCcw, Plus } from "lucide-react";
import { Tooltip } from "./ui/tooltip";
import { getLayoutOptions, renderLayoutShape } from "../utils/layoutHelper";
import VideoWallFullscreenButton from "./VideoWallFullscreenButton";

export const VideoWallControls = ({
  count,
  currentLayout,
  onSelectLayout,
  onReset,
  isFullscreen,
  onToggleFullscreen,
  presets,
  onOpenLayoutEditor,
}) => {
  return (
    <Box position="absolute" top={3} right={3} zIndex={50}>
      <HStack gap={2}>
        <Tooltip content="Crear diseño personalizado" showArrow>
          <span style={{ display: "inline-block" }}>
            <IconButton
              size="sm"
              variant="solid"
              borderRadius="full"
              onClick={onOpenLayoutEditor}
              aria-label="Crear diseño personalizado"
              boxShadow="lg"
              borderWidth="1px"
              borderColor="nvr.border.default"
              bg="nvr.bg.card"
              color="nvr.text.secondary"
              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              _hover={{
                bg: "nvr.bg.muted",
                borderColor: "nvr.brand.primary",
                color: "nvr.brand.primaryText",
                transform: "scale(1.05)",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
            >
              <Plus size={16} />
            </IconButton>
          </span>
        </Tooltip>

        <VideoWallFullscreenButton
          isFullscreen={isFullscreen}
          onToggle={onToggleFullscreen}
        />

        <Popover.Root portalled={true} unmountOnExit={true}>
          <Tooltip content="Seleccionar diseño de cuadrícula" showArrow>
            <span style={{ display: "inline-block" }}>
              <Popover.Trigger asChild>
                <IconButton
                  size="sm"
                  variant="solid"
                  borderRadius="full"
                  disabled={count <= 1}
                  aria-label="Seleccionar diseño de cuadrícula"
                  boxShadow="lg"
                  borderWidth="1px"
                  borderColor="nvr.border.default"
                  bg="nvr.bg.card"
                  color="nvr.text.secondary"
                  transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  _hover={{
                    bg: "nvr.bg.muted",
                    borderColor: "nvr.brand.primary",
                    color: "nvr.brand.primaryText",
                    transform: "scale(1.05)",
                  }}
                  _active={{
                    transform: "scale(0.95)",
                  }}
                >
                  <LayoutGrid size={16} />
                </IconButton>
              </Popover.Trigger>
            </span>
          </Tooltip>
          <Portal>
            <Popover.Positioner zIndex={1600}>
              <Popover.Content
                bg="nvr.bg.modal"
                borderColor="nvr.border.default"
                shadow="2xl"
                p={2}
                borderRadius="lg"
                zIndex="popover"
                w="84px"
                onWheel={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <Popover.Arrow />
                <Popover.Body p={1}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="nvr.text.secondary"
                    mb={2}
                    textAlign="center"
                  >
                    Orden
                  </Text>
                  <VStack gap={2} align="center" py={1}>
                    {getLayoutOptions(count, presets).map((opt) => {
                      const isSelected = currentLayout === opt.key;
                      return (
                        <Box
                          key={opt.key}
                          as="button"
                          onClick={() => onSelectLayout(opt.key)}
                          p="4px"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={
                            isSelected
                              ? "nvr.brand.primary"
                              : "nvr.border.default"
                          }
                          bg={
                            isSelected ? "nvr.brand.activeBg" : "nvr.bg.card"
                          }
                          _hover={{
                            borderColor: isSelected
                              ? "nvr.brand.primaryText"
                              : "blue.300",
                            bg: isSelected
                              ? "nvr.brand.activeBg"
                              : "nvr.bg.muted",
                            transform: "translateY(-1px)",
                          }}
                          transition="all 0.15s ease-in-out"
                          boxShadow={
                            isSelected
                              ? "0 2px 8px rgba(59, 130, 246, 0.12)"
                              : "none"
                          }
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {renderLayoutShape(count, opt.key, presets)}
                        </Box>
                      );
                    })}
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>

        <Tooltip content="Restablecer cuadrícula" showArrow>
          <span style={{ display: "inline-block" }}>
            <IconButton
              size="sm"
              variant="solid"
              borderRadius="full"
              onClick={onReset}
              disabled={count <= 1}
              aria-label="Restablecer cuadrícula"
              boxShadow="lg"
              borderWidth="1px"
              borderColor="nvr.border.default"
              bg="nvr.bg.card"
              color="nvr.text.secondary"
              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              _hover={{
                bg: "nvr.bg.muted",
                borderColor: "nvr.brand.primary",
                color: "nvr.brand.primaryText",
                transform: "scale(1.05) rotate(-45deg)",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
            >
              <RotateCcw size={16} />
            </IconButton>
          </span>
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default VideoWallControls;
