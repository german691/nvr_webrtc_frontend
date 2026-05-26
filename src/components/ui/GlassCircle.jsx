import { Box } from "@chakra-ui/react";

/**
 * Componente que renderiza un círculo difuminado con gradiente radial decorativo.
 * Diseñado para crear efectos de Glassmorphism fluidos y modernos.
 * 
 * @param {string} [color="rgba(59, 130, 246, 0.08)"] - Color HSL/RGBA central del círculo.
 * @param {string} [size="500px"] - Ancho y alto físico del círculo.
 * @param {string} [blur="70px"] - Grado de desenfoque aplicado al círculo.
 * @param {string} [className="float-slow-bg"] - Clase CSS para animaciones de flotado sutiles.
 * @param {number} [zIndex=1] - Apilamiento Z.
 */
export const GlassCircle = ({
  color = "rgba(59, 130, 246, 0.08)",
  size = "500px",
  blur = "70px",
  className = "float-slow-bg",
  zIndex = 1,
  ...props
}) => {
  return (
    <Box
      position="absolute"
      w={size}
      h={size}
      bgGradient={`radial(circle, ${color} 0%, rgba(0, 0, 0, 0) 70%)`}
      borderRadius="full"
      filter={`blur(${blur})`}
      pointerEvents="none"
      zIndex={zIndex}
      className={className}
      {...props}
    />
  );
};

export default GlassCircle;
