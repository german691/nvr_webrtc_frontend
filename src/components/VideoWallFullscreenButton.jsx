import { IconButton } from "@chakra-ui/react";
import { Maximize, Minimize } from "lucide-react";
import { Tooltip } from "./ui/tooltip";

export const VideoWallFullscreenButton = ({ isFullscreen, onToggle }) => {
  return (
    <Tooltip content={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"} showArrow>
      <span style={{ display: "inline-block" }}>
        <IconButton
          size="sm"
          variant="solid"
          borderRadius="full"
          onClick={onToggle}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          boxShadow="lg"
          borderWidth="1px"
          borderColor="nvr.border.default"
          bg="nvr.bg.card"
          color="nvr.text.secondary"
          transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          _hover={{
            bg: "nvr.bg.muted",
            borderColor: "nvr.brand.primary",
            color: "nvr.brand.primaryText",
            transform: "scale(1.05)",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default VideoWallFullscreenButton;
