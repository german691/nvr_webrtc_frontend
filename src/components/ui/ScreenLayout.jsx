import { Box, Flex, Text } from "@chakra-ui/react";
import { DottedBackground } from "./DottedBackground";
import { GlassCircle } from "./GlassCircle";

/**
 * Layout contenedor de pantalla completa de alta fidelidad.
 * Proporciona el fondo pastel, los círculos glassmórficos animados,
 * la malla de puntos de precisión y el pie de página unificado.
 * 
 * @param {React.ReactNode} children - Contenido principal centrado de la pantalla.
 * @param {string} [footerText="UCAMI 2026 • Area de Tecnología"] - Leyenda de derechos en el footer.
 */
export const ScreenLayout = ({ children, footerText = "UCAMI 2026 • Area de Tecnología" }) => {
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
      <GlassCircle
        top="5%"
        left="10%"
        size="450px"
        color="rgba(6, 182, 212, 0.08)"
        blur="60px"
        className="float-slow-bg"
      />
      <GlassCircle
        bottom="8%"
        right="8%"
        size="500px"
        color="rgba(59, 130, 246, 0.08)"
        blur="70px"
        className="float-reverse-bg"
      />

      {/* 2. Fondo de Puntilleado de Alta Precisión overlay */}
      <DottedBackground />

      {/* 3. Contenido principal centrado */}
      {children}

      {/* 4. Footer */}
      {footerText && (
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
            {footerText}
          </Text>
        </Box>
      )}
    </Flex>
  );
};

export default ScreenLayout;
