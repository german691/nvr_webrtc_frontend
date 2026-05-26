import { Box } from "@chakra-ui/react";

export const VideoWallDividers = ({
  cols,
  rows,
  colRatio,
  colRatio2,
  rowRatio,
  rowRatio2,
  setResizingColIdx,
  setResizingRowIdx,
}) => {
  return (
    <>
      {(cols === 2 || cols === 3) && (
        <Box
          position="absolute"
          left={`${colRatio}%`}
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          cursor="col-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingColIdx(1);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
          }}
          transition="all 0.2s"
        />
      )}

      {cols === 3 && (
        <Box
          position="absolute"
          left={`${colRatio2}%`}
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          cursor="col-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingColIdx(2);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
          }}
          transition="all 0.2s"
        />
      )}

      {(rows === 2 || rows === 3) && (
        <Box
          position="absolute"
          top={`${rowRatio}%`}
          left={0}
          right={0}
          h="8px"
          mt="-4px"
          cursor="row-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingRowIdx(1);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
          }}
          transition="all 0.2s"
        />
      )}

      {rows === 3 && (
        <Box
          position="absolute"
          top={`${rowRatio2}%`}
          left={0}
          right={0}
          h="8px"
          mt="-4px"
          cursor="row-resize"
          zIndex={20}
          bg="rgba(255, 255, 255, 0.01)"
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingRowIdx(2);
          }}
          _hover={{
            bg: "blue.500",
            opacity: 0.5,
          }}
          transition="all 0.2s"
        />
      )}
    </>
  );
};

export default VideoWallDividers;
