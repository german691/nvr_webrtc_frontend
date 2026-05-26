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
import { User, AlertCircle } from "lucide-react";
import { cameraApi } from "../api/camera.api";
import logoImg from "../assets/logof.png";
import ScreenLayout from "./ui/ScreenLayout";
import PasswordInput from "./ui/PasswordInput";

/**
 * Vista de Inicio de Sesión de la aplicación.
 * Compone la presentación usando ScreenLayout y PasswordInput.
 */
export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        onLoginSuccess(
          response.token,
          response.username,
          response.role,
          response.needsPasswordChange,
        );
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
    <ScreenLayout>
      {/* Contenedor principal de Login con estética premium frosted-glass claro */}
      <Box
        position="relative"
        zIndex={10}
        w="100%"
        maxW="440px"
        bg="nvr.glass.emptyBg"
        backdropFilter="blur(30px) saturate(190%)"
        border="1px solid"
        borderColor="nvr.glass.emptyBorder"
        borderRadius="3xl"
        p={{ base: 6, md: 10 }}
        boxShadow="0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)"
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
                  <Heading size="xl" color="nvr.text.primary" letterSpacing="wider">
                    UCAMI
                  </Heading>
                }
              />
            </Box>
            <VStack spaceY={1} align="center">
              <Heading
                size="md"
                color="nvr.text.primary"
                fontWeight="semibold"
                letterSpacing="tight"
                id="login-title"
              >
                Control de Cámaras de Odontología
              </Heading>
              <Text fontSize="xs" color="nvr.text.secondary" textAlign="center">
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
                  color="nvr.text.primary"
                  mb={2}
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  Usuario
                </Text>
                <Flex position="relative" align="center">
                  <Box position="absolute" left={4} color="nvr.text.secondary" zIndex={2}>
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
                    bg="nvr.bg.card"
                    border="1px solid"
                    borderColor="nvr.border.interactive"
                    borderRadius="xl"
                    color="nvr.text.primary"
                    fontSize="sm"
                    _placeholder={{ color: "gray.400" }}
                    _hover={{ borderColor: "rgba(15, 23, 42, 0.2)" }}
                    _focus={{
                      borderColor: "nvr.brand.primary",
                      bg: "nvr.bg.card",
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
              <PasswordInput
                id="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                label="Contraseña"
                isLoading={isLoading}
                autoComplete="current-password"
              />

              {/* Mensaje de Error */}
              {error && (
                <Flex
                  align="start"
                  p={4}
                  bg="nvr.brand.dangerBg"
                  border="1px solid"
                  borderColor="nvr.brand.dangerBorder"
                  borderRadius="xl"
                  gap={3}
                  animation="modal-content-scale-in 0.3s ease-out forwards"
                >
                  <Box color="nvr.brand.dangerIcon" mt={0.5}>
                    <AlertCircle size={16} />
                  </Box>
                  <Text
                    fontSize="xs"
                    color="nvr.brand.danger"
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
                bg="nvr.brand.primaryText"
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
    </ScreenLayout>
  );
};

export default Login;
