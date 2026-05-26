import { useState, useRef, useMemo, useEffect } from "react";
import { Box, VStack, HStack, Text } from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import { MonitorPlay, GripVertical } from "lucide-react";
import WebRTCPlayer from "./WebRTCPlayer";
import {
  getGridDimensions,
  getDefaultRatios,
  getGridAreaProps,
  getGridTemplateStyles,
} from "../utils/layoutHelper";
import { useCameraDragAndDrop } from "../hooks/useCameraDragAndDrop";
import { useGridResizing } from "../hooks/useGridResizing";
import { fetchLayouts } from "../store/slices/layoutsSlice";
import VideoWallEmptyState from "./VideoWallEmptyState";
import VideoWallDividers from "./VideoWallDividers";
import VideoWallControls from "./VideoWallControls";

export const VideoWall = ({ onOpenLayoutEditor }) => {
  const { list } = useSelector((state) => state.cameras);
  const { presets } = useSelector((state) => state.layouts);
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  const [layoutSelections, setLayoutSelections] = useState({
    1: 1,
    2: 1,
    3: 1,
    4: 3,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    dispatch(fetchLayouts());
  }, [dispatch]);

  const stableActiveCameras = useMemo(() => {
    const active = list.filter((cam) => cam.streaming && cam.webrtc_url);
    return [...active].sort((a, b) => a.dev.localeCompare(b.dev));
  }, [list]);
  const count = stableActiveCameras.length;
  const currentLayout = layoutSelections[count] || 1;

  const { cols, rows } = getGridDimensions(count, currentLayout, presets);

  const boundGetDefaultRatios = useMemo(() => {
    return (num, lay) => getDefaultRatios(num, lay, presets);
  }, [presets]);

  const {
    orderedCameras,
    draggedIndex,
    draggableCameraId,
    setDraggableCameraId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useCameraDragAndDrop(stableActiveCameras);

  const {
    colRatio,
    colRatio2,
    rowRatio,
    rowRatio2,
    resizingColIdx,
    resizingRowIdx,
    setResizingColIdx,
    setResizingRowIdx,
    handleReset,
  } = useGridResizing(
    count,
    currentLayout,
    cols,
    rows,
    boundGetDefaultRatios,
    containerRef,
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (orderedCameras.length === 0) {
    return (
      <VideoWallEmptyState
        title="Selecciona al menos una cámara"
        icon={MonitorPlay}
      />
    );
  }

  return (
    <Box
      id="nvr-videowall"
      ref={containerRef}
      h="100%"
      w="100%"
      bg="black"
      position="relative"
      overflow="hidden"
      userSelect={
        resizingColIdx !== null || resizingRowIdx !== null ? "none" : "auto"
      }
      {...getGridTemplateStyles(
        count,
        cols,
        rows,
        colRatio,
        colRatio2,
        rowRatio,
        rowRatio2,
      )}
    >
      {stableActiveCameras.map((cam) => {
        let visualIdx = orderedCameras.findIndex((c) => c.dev === cam.dev);
        if (visualIdx === -1) visualIdx = 0;

        const areaProps = getGridAreaProps(
          visualIdx,
          count,
          currentLayout,
          presets,
        );

        const gridColumnStr = areaProps.gridColumn || "1";
        const colParts = gridColumnStr.split("/");
        const colStart = parseInt(colParts[0], 10) || 1;
        let colSpan = 1;
        if (colParts[1] && colParts[1].includes("span")) {
          colSpan = parseInt(colParts[1].replace("span", ""), 10) || 1;
        }
        const colEnd = colStart + colSpan - 1;

        const gridRowStr = areaProps.gridRow || "1";
        const rowParts = gridRowStr.split("/");
        const rowStart = parseInt(rowParts[0], 10) || 1;
        let rowSpan = 1;
        if (rowParts[1] && rowParts[1].includes("span")) {
          rowSpan = parseInt(rowParts[1].replace("span", ""), 10) || 1;
        }
        const rowEnd = rowStart + rowSpan - 1;

        const showRightHandle =
          (colEnd === 1 && cols > 1) || (colEnd === 2 && cols > 2);
        const rightHandleIdx = colEnd;

        const showBottomHandle =
          (rowEnd === 1 && rows > 1) || (rowEnd === 2 && rows > 2);
        const bottomHandleIdx = rowEnd;

        return (
          <Box
            key={cam.dev}
            order={visualIdx}
            position="relative"
            borderWidth="1px"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderRadius="none"
            overflow="hidden"
            bg="black"
            transition="border-color 0.2s ease, opacity 0.2s ease"
            _hover={{
              borderColor: "blue.500",
            }}
            draggable={draggableCameraId === cam.dev}
            onDragStart={(e) => handleDragStart(e, visualIdx)}
            onDragOver={(e) => handleDragOver(e, visualIdx)}
            onDragEnd={handleDragEnd}
            opacity={draggedIndex === visualIdx ? 0.4 : 1}
            {...areaProps}
          >
            <WebRTCPlayer url={cam.webrtc_url} camera={cam} />

            <Box
              position="absolute"
              top={3}
              left={3}
              bg="blackAlpha.700"
              backdropFilter="blur(8px)"
              px={3}
              py={1.5}
              borderRadius="lg"
              zIndex={5}
              opacity={1}
              transition="all 0.2s ease-in-out"
              _hover={{ transform: "scale(1.02)" }}
              cursor="grab"
              _active={{ cursor: "grabbing" }}
              onMouseEnter={() => setDraggableCameraId(cam.dev)}
              onMouseLeave={() => setDraggableCameraId(null)}
            >
              <HStack gap={2}>
                <GripVertical size={14} color="#A0AEC0" />
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    {cam.name || cam.dev}
                  </Text>
                  {cam.active_settings && (
                    <Text
                      fontSize="2xs"
                      color="gray.300"
                      textTransform="uppercase"
                      fontWeight="medium"
                    >
                      {cam.active_settings.resolution} @{" "}
                      {cam.active_settings.fps}FPS |{" "}
                      {cam.active_settings.bitrate}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>

            {showRightHandle && (
              <Box
                position="absolute"
                right={0}
                top={0}
                bottom={0}
                w="6px"
                cursor="col-resize"
                zIndex={15}
                bg="transparent"
                _hover={{ bg: "blue.500", opacity: 0.4 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResizingColIdx(rightHandleIdx);
                }}
              />
            )}

            {showBottomHandle && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="6px"
                cursor="row-resize"
                zIndex={15}
                bg="transparent"
                _hover={{ bg: "blue.500", opacity: 0.4 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResizingRowIdx(bottomHandleIdx);
                }}
              />
            )}
          </Box>
        );
      })}

      <VideoWallDividers
        cols={cols}
        rows={rows}
        colRatio={colRatio}
        colRatio2={colRatio2}
        rowRatio={rowRatio}
        rowRatio2={rowRatio2}
        setResizingColIdx={setResizingColIdx}
        setResizingRowIdx={setResizingRowIdx}
      />

      <VideoWallControls
        count={count}
        currentLayout={currentLayout}
        onSelectLayout={(key) => {
          setLayoutSelections((prev) => ({
            ...prev,
            [count]: key,
          }));
        }}
        onReset={handleReset}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        presets={presets}
        onOpenLayoutEditor={onOpenLayoutEditor}
      />
    </Box>
  );
};

export default VideoWall;
