import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchCameras } from "./store/slices/cameraSlice";
import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./components/Sidebar";
import VideoWall from "./components/VideoWall";
import Login from "./components/Login";

function App() {
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("nvr_token")
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCameras());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Flex
      h="100vh"
      w="100vw"
      bgGradient="to-br, gray.50, gray.150"
      color="gray.900"
      overflow="hidden"
      p={2.5}
      gap={2.5}
    >
      <Box
        bg="white"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        zIndex={10}
        overflow="hidden"
        shadow="xs"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Box flex="1" overflow="hidden" display="flex" flexDirection="column">
          <Sidebar />
        </Box>
      </Box>
      <Box
        flex="1"
        bg="gray.100"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="gray.200"
        position="relative"
        overflow="hidden"
        shadow="xs"
      >
        <VideoWall />
      </Box>
    </Flex>
  );
}

export default App;
