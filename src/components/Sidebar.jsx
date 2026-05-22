import { useState } from "react";
import {
  VStack,
  Text,
  Center,
  Spinner,
  Box,
  Flex,
  IconButton,
  Heading,
  Image,
  HStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import CameraControlCard from "./CameraControlCard";
import logoImg from "../assets/logoh.png";
import { Tooltip } from "./ui/tooltip";
import { formatDeviceName } from "../utils/camera.js";

const Sidebar = () => {
  const { list, isLoading, error } = useSelector((state) => state.cameras);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <Center p={8} flexDirection="column" gap={4}>
        <Spinner color="blue.500" size="xl" />
        <Text color="gray.600" fontSize="sm">
          Consultando hardware en nodos Edge...
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={8}>
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      </Center>
    );
  }

  if (!list || list.length === 0) {
    return (
      <Center p={8}>
        <Text color="gray.500" fontSize="sm" textAlign="center">
          No se detectaron cámaras conectadas a los servidores.
        </Text>
      </Center>
    );
  }

  return (
    <Box
      w={isCollapsed ? "60px" : "350px"}
      transition="width 0.2s"
      h="100vh"
      bg="gray.100"
      borderRight="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {isCollapsed && (
        <Flex flexDir="column" align="center" gap={4} py={4} h="100%">
          <IconButton
            aria-label="Expandir barra lateral"
            size="sm"
            variant="ghost"
            color="gray.600"
            _hover={{ bg: "gray.200", color: "gray.900" }}
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight size={20} />
          </IconButton>

          <VStack gap={4} w="full" align="center" mt={2} overflowY="auto" flex="1" px={2}>
            {list.map((cam) => {
              const isStreaming = cam.streaming;
              const titleText = `${formatDeviceName(cam.dev)} - ${
                isStreaming ? "Transmitiendo" : "En Espera"
              }`;
              return (
                <Tooltip key={cam.dev} content={titleText} positioning={{ placement: "right" }} showArrow>
                  <Box
                    position="relative"
                    p={2.5}
                    borderRadius="full"
                    bg={isStreaming ? "green.50" : "gray.50"}
                    borderWidth="2px"
                    borderColor={isStreaming ? "green.500" : "gray.300"}
                    color={isStreaming ? "green.600" : "gray.500"}
                    cursor="pointer"
                    onClick={() => setIsCollapsed(false)}
                    transition="all 0.2s"
                    _hover={{
                      transform: "scale(1.1)",
                      borderColor: isStreaming ? "green.600" : "gray.400",
                      bg: isStreaming ? "green.100" : "gray.100",
                    }}
                  >
                    <Video size={18} />
                    {isStreaming && (
                      <Box
                        position="absolute"
                        top="0"
                        right="0"
                        w="2.5"
                        h="2.5"
                        bg="red.500"
                        borderRadius="full"
                        borderWidth="1.5px"
                        borderColor="white"
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </VStack>
        </Flex>
      )}

      {!isCollapsed && (
        <>
          <Flex
            flexShrink={0}
            p={4}
            borderBottomWidth="1px"
            borderColor="gray.200"
            bg="gray.50"
            justifyContent="space-between"
            alignItems="center"
            w="full"
            zIndex={10}
            shadow="sm"
          >
            <HStack gap={3}>
              <Image
                src={logoImg}
                alt="Logo"
                boxSize="32px"
                objectFit="contain"
              />
              <Heading size="md" color="black" letterSpacing="tight">
                UCAMI Odontología
              </Heading>
            </HStack>
            <IconButton
              aria-label="Colapsar barra lateral"
              size="sm"
              variant="ghost"
              color="gray.600"
              _hover={{ bg: "gray.200", color: "gray.900" }}
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft size={20} />
            </IconButton>
          </Flex>

          <Box flex="1" overflowY="auto">
            <VStack p={4} gap={4} align="stretch">
              {list.map((cam) => (
                <CameraControlCard key={cam.dev} camera={cam} />
              ))}
            </VStack>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Sidebar;
