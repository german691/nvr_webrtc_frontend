import { IconButton } from "@chakra-ui/react";
import { Tooltip } from "./tooltip";

/**
 * Un botón de control unificado y estilizado para la barra de control del reproductor.
 * Envuelve el IconButton con un Tooltip de Chakra UI pre-configurado.
 * 
 * @param {string} tooltip - Texto de ayuda a mostrar en el tooltip.
 * @param {string} ariaLabel - Etiqueta de accesibilidad del botón.
 * @param {function} onClick - Callback al presionar el botón.
 * @param {boolean} [disabled=false] - Inhabilita el botón.
 * @param {string} [colorPalette="gray"] - Paleta de colores para el botón de Chakra UI.
 * @param {React.ReactNode} children - El icono (ej. Lucide Icon) del botón.
 */
export const PlayerButton = ({
  tooltip,
  ariaLabel,
  onClick,
  disabled = false,
  colorPalette = "gray",
  children,
  ...props
}) => {
  return (
    <Tooltip content={tooltip} showArrow>
      <IconButton
        size="xs"
        variant="ghost"
        borderRadius="lg"
        colorPalette={colorPalette}
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        transition="all 0.2s"
        _hover={{ bg: "blackAlpha.100" }}
        {...props}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
};

export default PlayerButton;
