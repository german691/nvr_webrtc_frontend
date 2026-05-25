import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  Heading,
  Image,
} from "@chakra-ui/react";
import { Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cameraApi } from "../api/camera.api";
import logoImg from "../assets/logof.png";

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cameraApi.login(username, password);
      if (response && response.status === "success" && response.token) {
        onLoginSuccess(response.token, response.username, response.role, response.needsPasswordChange);
      } else {
        setError(response.message || "Error al iniciar sesión.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Credenciales incorrectas o error de conexión con el servidor NVR.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      position="relative"
      h="100vh"
      w="100vw"
      bg="#f8fafc"
      align="center"
      justify="center"
      overflow="hidden"
      p={4}
    >
      {/* 1. Círculos dinámicos con gradientes pastel para el efecto Glassmorphism */}
      <Box
        position="absolute"
        top="5%"
        left="10%"
        w="450px"
        h="450px"
        bgGradient="radial(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0) 70%)"
        borderRadius="full"
        filter="blur(60px)"
        className="float-slow-bg"
        pointerEvents="none"
        zIndex={1}
      />
      <Box
        position="absolute"
        bottom="8%"
        right="8%"
        w="500px"
        h="500px"
        bgGradient="radial(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%)"
        borderRadius="full"
        filter="blur(70px)"
        className="float-reverse-bg"
        pointerEvents="none"
        zIndex={1}
      />

      {/* 2. Fondo de Puntilleado de Alta Precisión (Dot Grid Background) overlay de los círculos */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundImage="radial-gradient(rgba(100, 116, 139, 0.24) 1.5px, transparent 1.5px)"
        backgroundSize="20px 20px"
        pointerEvents="none"
        zIndex={2}
      />

      {/* Contenedor principal de Login con estética premium frosted-glass claro */}
      <Box
        position="relative"
        zIndex={10}
        w="100%"
        maxW="440px"
        bg="rgba(255, 255, 255, 0.65)"
        backdropFilter="blur(30px) saturate(190%)"
        border="1px solid rgba(255, 255, 255, 0.7)"
        borderRadius="3xl"
        p={{ base: 6, md: 10 }}
        boxShadow="0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)"
        animation="modal-content-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        id="login-panel"
      >
        <VStack spaceY={6} align="stretch">
          {/* Logo y Encabezado */}
          <VStack spaceY={3} align="center" mb={2}>
            <Box
              p={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={logoImg}
                alt="UCAMI Logo"
                maxH="100px"
                objectFit="contain"
                fallback={
                  <Heading size="xl" color="gray.800" letterSpacing="wider">
                    UCAMI
                  </Heading>
                }
              />
            </Box>
            <VStack spaceY={1} align="center">
              <Heading
                size="md"
                color="gray.800"
                fontWeight="semibold"
                letterSpacing="tight"
                id="login-title"
              >
                Control de Cámaras de Odontología
              </Heading>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Odontología • Acceso Tecnológico Restringido
              </Text>
            </VStack>
          </VStack>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <VStack spaceY={5} align="stretch">
              {/* Campo Usuario */}
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="gray.700"
                  mb={2}
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  Usuario
                </Text>
                <Flex position="relative" align="center">
                  <Box position="absolute" left={4} color="gray.400" zIndex={2}>
                    <User size={18} />
                  </Box>
                  <Input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    pl={12}
                    pr={4}
                    h="50px"
                    bg="rgba(255, 255, 255, 0.8)"
                    border="1px solid rgba(15, 23, 42, 0.12)"
                    borderRadius="xl"
                    color="gray.800"
                    fontSize="sm"
                    _placeholder={{ color: "gray.400" }}
                    _hover={{ borderColor: "rgba(15, 23, 42, 0.2)" }}
                    _focus={{
                      borderColor: "blue.500",
                      bg: "white",
                      outline: "none",
                      boxShadow: "0 0 0 1px rgba(37, 99, 235, 0.25)",
                    }}
                    transition="all 0.2s"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </Flex>
              </Box>

              {/* Campo Contraseña */}
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="gray.700"
                  mb={2}
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  Contraseña
                </Text>
                <Flex position="relative" align="center">
                  <Box position="absolute" left={4} color="gray.400" zIndex={2}>
                    <Lock size={18} />
                  </Box>
                  <Input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    pl={12}
                    pr={12}
                    h="50px"
                    bg="rgba(255, 255, 255, 0.8)"
                    border="1px solid rgba(15, 23, 42, 0.12)"
                    borderRadius="xl"
                    color="gray.800"
                    fontSize="sm"
                    _placeholder={{ color: "gray.400" }}
                    _hover={{ borderColor: "rgba(15, 23, 42, 0.2)" }}
                    _focus={{
                      borderColor: "blue.500",
                      bg: "white",
                      outline: "none",
                      boxShadow: "0 0 0 1px rgba(37, 99, 235, 0.25)",
                    }}
                    transition="all 0.2s"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    position="absolute"
                    right={2}
                    variant="ghost"
                    h="36px"
                    w="36px"
                    minW="36px"
                    p={0}
                    color="gray.400"
                    _hover={{ color: "gray.800", bg: "rgba(0, 0, 0, 0.03)" }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </Flex>
              </Box>

              {/* Mensaje de Error */}
              {error && (
                <Flex
                  align="start"
                  p={4}
                  bg="red.50"
                  border="1px solid rgba(239, 68, 68, 0.15)"
                  borderRadius="xl"
                  gap={3}
                  animation="modal-content-scale-in 0.3s ease-out forwards"
                >
                  <Box color="red.500" mt={0.5}>
                    <AlertCircle size={16} />
                  </Box>
                  <Text
                    fontSize="xs"
                    color="red.700"
                    fontWeight="medium"
                    id="login-error-msg"
                  >
                    {error}
                  </Text>
                </Flex>
              )}

              {/* Botón de Envío */}
              <Button
                id="login-submit-btn"
                type="submit"
                loading={isLoading}
                loadingText="Autenticando..."
                h="50px"
                bg="blue.600"
                color="white"
                borderRadius="xl"
                fontSize="sm"
                fontWeight="semibold"
                _hover={{
                  bg: "blue.700",
                  shadow: "0 10px 20px rgba(37, 99, 235, 0.2)",
                  transform: "translateY(-1px)",
                }}
                _active={{
                  transform: "translateY(1px)",
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                mt={2}
              >
                Iniciar Sesión
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>

      {/* Footer del Login */}
      <Box
        position="absolute"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={10}
        px={6}
        py={2}
        borderRadius="full"
        bg="rgba(255, 255, 255, 0.65)"
        backdropFilter="blur(100px)"
        boxShadow="0 10px 30px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 1)"
        border="1px solid rgba(255, 255, 255, 0.7)"
        whiteSpace="nowrap"
      >
        <Text
          fontSize="10px"
          color="gray.500"
          letterSpacing="widest"
          textTransform="uppercase"
          fontWeight="medium"
        >
          UCAMI 2026 • Area de Tecnología
        </Text>
      </Box>
    </Flex>
  );
};

export default Login;
