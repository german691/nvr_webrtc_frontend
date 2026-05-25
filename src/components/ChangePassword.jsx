import { Box, Flex, Text, Button, VStack, Heading, Image } from "@chakra-ui/react";
import { AlertCircle, CheckCircle } from "lucide-react";
import logoImg from "../assets/logof.png";
import ScreenLayout from "./ui/ScreenLayout";
import PasswordInput from "./ui/PasswordInput";
import useChangePassword from "../hooks/useChangePassword";

/**
 * Vista de Cambio de Contraseña de Seguridad.
 * Utiliza primitivas UI y un Hook de negocio de comportamiento aislado.
 */
export const ChangePassword = ({ onPasswordChanged }) => {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    success,
    handleSubmit,
  } = useChangePassword(onPasswordChanged);

  return (
    <ScreenLayout>
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
                <PasswordInput
                  id="new-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  label="Nueva Contraseña"
                  isLoading={isLoading}
                  autoComplete="new-password"
                />

                {/* Campo Confirmar Contraseña */}
                <PasswordInput
                  id="confirm-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  label="Confirmar Contraseña"
                  isLoading={isLoading}
                  autoComplete="new-password"
                />

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
                  Guardar Contraseña
                </Button>
              </VStack>
            </form>
          )}
        </VStack>
      </Box>
    </ScreenLayout>
  );
};

export default ChangePassword;
