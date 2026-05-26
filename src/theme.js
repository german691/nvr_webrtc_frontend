import { defineConfig } from "@chakra-ui/react";

/**
 * Configuración del Sistema de Diseño Global para el proyecto NVR.
 * Concentra todos los colores semánticos, fondos de contenedores,
 * bordes y sombras para evitar definiciones duplicadas a nivel de componente.
 */
export const themeConfig = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        nvr: {
          bg: {
            app: { value: "#f8fafc" }, // Fondo slate.50 principal de la aplicación
            sidebar: { value: "{colors.white}" }, // Fondo de la barra lateral
            modal: { value: "{colors.white}" }, // Fondo de ventanas emergentes
            card: { value: "{colors.white}" }, // Fondo de tarjetas de control
            muted: { value: "{colors.gray.50}" }, // Fondo neutral claro/silenciado
            headerBg: { value: "{colors.gray.50}" }, // Fondo de encabezados de modal o sección
            console: { value: "{colors.gray.950}" }, // Fondo oscuro para la consola de depuración
          },
          border: {
            default: { value: "{colors.gray.200}" }, // Borde estándar de separadores
            subtle: { value: "{colors.gray.100}" }, // Borde muy tenue
            interactive: { value: "{colors.gray.300}" }, // Borde de inputs y selectores activos
          },
          text: {
            primary: { value: "{colors.gray.900}" }, // Texto primario de alta visibilidad
            secondary: { value: "{colors.gray.600}" }, // Texto descriptivo o secundario
            console: { value: "{colors.emerald.400}" }, // Texto verde terminal
          },
          brand: {
            primary: { value: "{colors.blue.500}" }, // Azul marca activo (ej. badges de cámara)
            primaryText: { value: "{colors.blue.600}" }, // Azul marca acentuado para iconos y texto activo
            activeBg: { value: "{colors.blue.50}" }, // Fondo claro para elementos seleccionados/activos
            activeHoverBg: { value: "{colors.blue.100}" }, // Fondo hover sobre elementos seleccionados/activos
            activeHoverBorder: { value: "{colors.blue.600}" }, // Borde hover sobre elementos seleccionados/activos
            danger: { value: "{colors.red.600}" }, // Color rojo para acciones destructivas o errores
            dangerBg: { value: "{colors.red.50}" }, // Fondo claro para errores o alertas rojas
            dangerIcon: { value: "{colors.red.500}" }, // Color de icono de alerta rojo
            success: { value: "{colors.emerald.600}" }, // Color verde para estados correctos o exitosos
            successBg: { value: "{colors.emerald.50}" }, // Fondo claro para estados exitosos
            successBorder: { value: "{colors.emerald.200}" }, // Borde claro para estados exitosos
            dangerBorder: { value: "{colors.red.200}" }, // Borde claro para errores/alertas
          },
          glass: {
            emptyBg: { value: "rgba(255, 255, 255, 0.4)" }, // Fondo translúcido de celdas vacías
            emptyBorder: { value: "rgba(255, 255, 255, 0.5)" }, // Borde translúcido de celdas vacías
          }
        }
      },
      shadows: {
        nvr: {
          glass: { value: "0 8px 32px 0 rgba(31, 38, 135, 0.08)" } // Sombra suave para efectos de cristal
        }
      }
    }
  }
});

export default themeConfig;
