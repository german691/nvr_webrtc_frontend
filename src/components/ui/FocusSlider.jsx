import { VStack, Flex, HStack, Text } from "@chakra-ui/react";
import { Flower, Mountain } from "lucide-react";
import { Tooltip } from "./tooltip";

/**
 * FocusSlider component that encapsulates the custom DSLR focus dial styling,
 * the scroll wheel container ref, and photography Macro/Landscape limit indicators.
 */
export const FocusSlider = ({
  focusAbsCtrl,
  focusAutoCtrl,
  focusScrollCallbackRef,
  handleLocalChange,
  debouncedCommitChange,
  handleImmediateCommit,
}) => {
  if (!focusAbsCtrl) return null;

  return (
    <VStack
      ref={focusScrollCallbackRef}
      align="stretch"
      gap={1.5}
      w="100%"
    >
      {/* Encapsulated focus dial scale styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .focus-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 12px;
              border-radius: 4px;
              background: repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.08) 0px, rgba(0, 0, 0, 0.08) 1px, transparent 1px, transparent 6px);
              border: 1px solid rgba(0, 0, 0, 0.12);
              outline: none;
              cursor: pointer;
              transition: all 0.2s;
            }
            .focus-slider:hover {
              background: repeating-linear-gradient(90deg, rgba(37, 99, 235, 0.15) 0px, rgba(37, 99, 235, 0.15) 1px, transparent 1px, transparent 6px);
              border-color: rgba(37, 99, 235, 0.3);
            }
            .focus-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 4px;
              height: 18px;
              border-radius: 1px;
              background: #2563eb;
              box-shadow: 0 0 3px rgba(37, 99, 235, 0.6);
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .focus-slider::-webkit-slider-thumb:hover {
              transform: scaleY(1.2) scaleX(1.2);
              background: #1d4ed8;
            }
            .focus-slider::-moz-range-thumb {
              width: 4px;
              height: 18px;
              border-radius: 1px;
              background: #2563eb;
              border: none;
              box-shadow: 0 0 3px rgba(37, 99, 235, 0.6);
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .focus-slider::-moz-range-thumb:hover {
              transform: scaleY(1.2) scaleX(1.2);
              background: #1d4ed8;
            }
          `,
        }}
      />

      <input
        type="range"
        className="focus-slider"
        min={focusAbsCtrl.min ?? 0}
        max={focusAbsCtrl.max ?? 250}
        step={focusAbsCtrl.step ?? 1}
        value={focusAbsCtrl.value}
        onChange={async (e) => {
          const val = Number(e.target.value);
          if (focusAutoCtrl && Number(focusAutoCtrl.value) === 1) {
            handleLocalChange(focusAutoCtrl.name, 0);
            await handleImmediateCommit(focusAutoCtrl.name, 0);
          }
          handleLocalChange(focusAbsCtrl.name, val);
          debouncedCommitChange(focusAbsCtrl.name, val);
        }}
      />

      {/* Photography indicator footer (Macro Flower & Landscape Mountain) */}
      <Flex justify="space-between" align="center" px={1} mt={0.5}>
        <Tooltip content="Foco Cercano / Macro (Flor)" showArrow>
          <HStack gap={1} color="gray.400">
            <Flower size={12} />
            <Text fontSize="2xs" fontWeight="bold">
              Macro
            </Text>
          </HStack>
        </Tooltip>
        <Tooltip content="Foco Lejano / Infinito (Montaña)" showArrow>
          <HStack gap={1} color="gray.400">
            <Text fontSize="2xs" fontWeight="bold">
              Infinito
            </Text>
            <Mountain size={12} />
          </HStack>
        </Tooltip>
      </Flex>
    </VStack>
  );
};

export default FocusSlider;
