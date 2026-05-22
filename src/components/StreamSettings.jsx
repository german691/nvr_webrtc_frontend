import { useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { BITRATES } from "../utils/camera.js";

export const StreamSettings = ({
  resolutions,
  fpsOptions,
  displayRes,
  displayFps,
  displayBitrate,
  setRes,
  setFps,
  setBitrate,
  disabled,
}) => {
  // Los arreglos ya vienen formateados del componente superior, por lo que el map es lineal.
  const resCollection = useMemo(
    () =>
      createListCollection({
        items: resolutions.map((r) => ({ label: r, value: r })),
      }),
    [resolutions],
  );

  const fpsCollection = useMemo(
    () =>
      createListCollection({
        items: fpsOptions.map((f) => ({ label: f, value: f })),
      }),
    [fpsOptions],
  );

  const bitrateCollection = useMemo(
    () =>
      createListCollection({
        items: BITRATES,
      }),
    [],
  );

  return (
    <>
      <Flex gap={2}>
        <Box flex="2">
          <Text fontSize="xs" color="gray.600" mb={1}>
            Resolución
          </Text>
          <Select.Root
            size="sm"
            collection={resCollection}
            value={[displayRes]}
            onValueChange={(e) => setRes(e.value[0])}
            disabled={disabled}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="white"
                borderColor="gray.300"
                _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content
                bg="white"
                borderColor="gray.200"
                shadow="sm"
                zIndex="popover"
              >
                {resCollection.items.map((item) => (
                  <Select.Item
                    item={item}
                    key={item.value}
                    _hover={{ bg: "gray.100" }}
                  >
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>

        <Box flex="1">
          <Text fontSize="xs" color="gray.600" mb={1}>
            FPS
          </Text>
          <Select.Root
            size="sm"
            collection={fpsCollection}
            value={[displayFps]}
            onValueChange={(e) => setFps(e.value[0])}
            disabled={disabled}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="white"
                borderColor="gray.300"
                _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content
                bg="white"
                borderColor="gray.200"
                shadow="sm"
                zIndex="popover"
              >
                {fpsCollection.items.map((item) => (
                  <Select.Item
                    item={item}
                    key={item.value}
                    _hover={{ bg: "gray.100" }}
                  >
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>
      </Flex>

      <Box>
        <Text fontSize="xs" color="gray.600" mb={1}>
          Compresión de Red
        </Text>
        <Select.Root
          size="sm"
          collection={bitrateCollection}
          value={[displayBitrate]}
          onValueChange={(e) => setBitrate(e.value[0])}
          disabled={disabled}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger
              bg="white"
              borderColor="gray.300"
              _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
            >
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content
              bg="white"
              borderColor="gray.200"
              shadow="sm"
              zIndex="popover"
            >
              {bitrateCollection.items.map((item) => (
                <Select.Item
                  item={item}
                  key={item.value}
                  _hover={{ bg: "gray.100" }}
                >
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Box>
    </>
  );
};
