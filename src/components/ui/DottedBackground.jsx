import { Box } from "@chakra-ui/react";

/**
 * Componente que renderiza una malla de puntilleado de alta precisión absoluta.
 * Ideal para overlays y fondos de contenedores de marca o modales.
 * 
 * @param {number} [opacity=0.24] - Opacidad de los puntos grises (de 0 a 1).
 * @param {string} [size="20px"] - Espaciado/tamaño de repetición del patrón.
 * @param {number} [zIndex=2] - Nivel de apilamiento en el eje Z.
 */
export const DottedBackground = ({ opacity = 0.24, size = "20px", zIndex = 2, ...props }) => {
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundImage={`radial-gradient(rgba(100, 116, 139, ${opacity}) 1.5px, transparent 1.5px)`}
      backgroundSize={`${size} ${size}`}
      pointerEvents="none"
      zIndex={zIndex}
      {...props}
    />
  );
};

export default DottedBackground;
