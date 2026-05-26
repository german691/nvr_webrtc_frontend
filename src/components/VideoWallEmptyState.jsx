import { Center, Box, HStack, Text } from "@chakra-ui/react";
import { DottedBackground } from "./ui/DottedBackground";
import { GlassCircle } from "./ui/GlassCircle";

export const VideoWallEmptyState = ({ title, icon: Icon }) => {
  return (
    <Center
      h="100%"
      w="100%"
      bg="nvr.bg.app"
      position="relative"
      overflow="hidden"
    >
      <GlassCircle
        top="15%"
        left="20%"
        size="400px"
        color="rgba(59, 130, 246, 0.08)"
        blur="60px"
      />

      <DottedBackground />

      <Box
        px={6}
        py={2.5}
        borderRadius="full"
        bg="nvr.glass.emptyBg"
        backdropFilter="blur(100px)"
        boxShadow="nvr.glass"
        border="1px solid"
        borderColor="nvr.glass.emptyBorder"
        whiteSpace="nowrap"
        zIndex={10}
        animation="modal-content-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      >
        <HStack gap={3} align="center">
          {Icon && (
            <Box
              color="nvr.brand.primaryText"
              display="flex"
              alignItems="center"
            >
              <Icon size={16} strokeWidth={2.5} />
            </Box>
          )}
          <Text
            fontSize="10px"
            color="nvr.text.secondary"
            letterSpacing="widest"
            textTransform="uppercase"
            fontWeight="semibold"
          >
            {title}
          </Text>
        </HStack>
      </Box>
    </Center>
  );
};

export default VideoWallEmptyState;
