import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCameras } from "./store/slices/cameraSlice";
import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./components/Sidebar";
import VideoWall from "./components/VideoWall";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCameras());
  }, [dispatch]);

  return (
    <Flex h="100vh" w="100vw" bg="gray.50" color="gray.900" overflow="hidden">
      <Box
        w="fit"
        bg="white"
        borderRightWidth="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        zIndex={10}
      >
        <Box flex="1" overflowY="auto">
          <Sidebar />
        </Box>
      </Box>
      <Box flex="1" bg="gray.100" position="relative" overflow="hidden">
        <VideoWall />
      </Box>
    </Flex>
  );
}

export default App;
