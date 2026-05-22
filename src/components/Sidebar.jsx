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
import { ChevronLeft, ChevronRight } from "lucide-react";
import CameraControlCard from "./CameraControlCard";
import logoImg from "../assets/logoh.png";

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
        <Flex p={3} justify="center">
          <IconButton
            aria-label="Expandir barra lateral"
            size="sm"
            variant="ghost"
            color="gray.600"
            _hover={{ bg: "gray.100", color: "gray.900" }}
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight size={20} />
          </IconButton>
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
