import { useState } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";
import { Lock, Eye, EyeOff } from "lucide-react";

/**
 * Componente de entrada de contraseña reutilizable con alternancia de visibilidad.
 * 
 * @param {string} id - Identificador único del input para tests y accesibilidad.
 * @param {string} value - Valor controlado del input.
 * @param {function} onChange - Callback activado al modificar el texto.
 * @param {string} [placeholder="Nueva contraseña"] - Texto marcador en el campo.
 * @param {string} [label] - Texto superior del campo de entrada.
 * @param {boolean} [isLoading=false] - Deshabilita el input si está cargando.
 * @param {string} [autoComplete="new-password"] - Sugerencia de autocompletado del navegador.
 */
export const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = "Nueva contraseña",
  label,
  isLoading = false,
  autoComplete = "new-password",
}) => {
  const [show, setShow] = useState(false);

  return (
    <Box>
      {label && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.700"
          mb={2}
          letterSpacing="wider"
          textTransform="uppercase"
        >
          {label}
        </Text>
      )}
      <Flex position="relative" align="center">
        <Box position="absolute" left={4} color="gray.400" zIndex={2}>
          <Lock size={18} />
        </Box>
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
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
          autoComplete={autoComplete}
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
          onClick={() => setShow(!show)}
          tabIndex="-1"
          disabled={isLoading}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </Flex>
    </Box>
  );
};

export default PasswordInput;
