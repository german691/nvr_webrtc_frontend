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
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { cameraApi } from "../api/camera.api";
import logoImg from "../assets/logof.png";

export const ChangePassword = ({ onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Por favor, complete ambos campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await cameraApi.changePassword(newPassword);
      if (response && response.status === "success" && response.token) {
        setSuccess(true);
        // Esperar un breve instante para mostrar la animación de éxito antes de transicionar
        setTimeout(() => {
          onPasswordChanged(response.token);
        }, 1200);
      } else {
        setError(response.message || "Error al actualizar la contraseña.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err.response?.data?.message ||
          "Ocurrió un error al intentar cambiar la contraseña.",
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
      {/* Círculos dinámicos con gradientes pastel para el efecto Glassmorphism */}
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

      {/* Fondo de Puntilleado de Alta Precisión overlay */}
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

      {/* Contenedor principal de Cambio de Contraseña */}
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
        id="change-password-panel"
      >
        <VStack spaceY={6} align="stretch">
          {/* Logo y Encabezado */}
          <VStack spaceY={3} align="center" mb={1}>
            <Box p={1} display="flex" alignItems="center" justifyContent="center">
              <Image
                src={logoImg}
                alt="UCAMI Logo"
                maxH="80px"
                objectFit="contain"
                fallback={
                  <Heading size="xl" color="gray.800" letterSpacing="wider">
                    UCAMI
                  </Heading>
                }
              />
            </Box>
            <VStack spaceY={1.5} align="center">
              <Heading
                size="md"
                color="gray.800"
                fontWeight="semibold"
                letterSpacing="tight"
                textAlign="center"
              >
                Actualización de Seguridad
              </Heading>
              <Text fontSize="xs" color="gray.500" textAlign="center" px={2}>
                Por política de seguridad de la UCAMI, es obligatorio cambiar la contraseña por defecto en su primer inicio de sesión.
              </Text>
            </VStack>
          </VStack>

          {success ? (
            <Flex
              flexDirection="column"
              align="center"
              justify="center"
              py={6}
              gap={4}
            >
              <Box color="emerald.500" bg="emerald.50" p={4} borderRadius="full">
                <CheckCircle size={48} />
              </Box>
              <VStack spaceY={1} align="center">
                <Text fontSize="md" fontWeight="bold" color="emerald.700">
                  ¡Contraseña Actualizada!
                </Text>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Redireccionando al panel de control...
                </Text>
              </VStack>
            </Flex>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit}>
              <VStack spaceY={5} align="stretch">
                {/* Campo Nueva Contraseña */}
                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="cyan.650"
                    mb={2}
                    letterSpacing="wider"
                    textTransform="uppercase"
                  >
                    Nueva Contraseña
                  </Text>
                  <Flex position="relative" align="center">
                    <Box position="absolute" left={4} color="gray.400" zIndex={2}>
                      <Lock size={18} />
                    </Box>
                    <Input
                      id="new-password-input"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
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
                        borderColor: "cyan.500",
                        bg: "white",
                        outline: "none",
                        boxShadow: "0 0 0 1px rgba(6, 182, 212, 0.25)",
                      }}
                      transition="all 0.2s"
                      disabled={isLoading}
                      autoComplete="new-password"
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

                {/* Campo Confirmar Contraseña */}
                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="cyan.650"
                    mb={2}
                    letterSpacing="wider"
                    textTransform="uppercase"
                  >
                    Confirmar Contraseña
                  </Text>
                  <Flex position="relative" align="center">
                    <Box position="absolute" left={4} color="gray.400" zIndex={2}>
                      <Lock size={18} />
                    </Box>
                    <Input
                      id="confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita la nueva contraseña"
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
                        borderColor: "cyan.500",
                        bg: "white",
                        outline: "none",
                        boxShadow: "0 0 0 1px rgba(6, 182, 212, 0.25)",
                      }}
                      transition="all 0.2s"
                      disabled={isLoading}
                      autoComplete="new-password"
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <Text fontSize="xs" color="red.700" fontWeight="medium">
                      {error}
                    </Text>
                  </Flex>
                )}

                {/* Botón de Enviar */}
                <Button
                  id="change-password-submit-btn"
                  type="submit"
                  loading={isLoading}
                  loadingText="Actualizando..."
                  h="50px"
                  bgGradient="to-r, cyan.500, blue.600"
                  color="white"
                  borderRadius="xl"
                  fontSize="sm"
                  fontWeight="semibold"
                  _hover={{
                    bgGradient: "to-r, cyan.400, blue.500",
                    shadow: "0 10px 20px rgba(6, 182, 212, 0.25)",
                    transform: "translateY(-1px)",
                  }}
                  _active={{
                    transform: "translateY(1px)",
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  mt={2}
                >
                  Guardar Contraseña
                </Button>
              </VStack>
            </form>
          )}
        </VStack>
      </Box>

      {/* Footer */}
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

export default ChangePassword;
