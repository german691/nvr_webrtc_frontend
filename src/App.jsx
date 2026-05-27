import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchCameras } from "./store/slices/cameraSlice";
import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./components/Sidebar";
import VideoWall from "./components/VideoWall";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import VideoWallEditor from "./components/VideoWallEditor";

function App() {
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("nvr_token")
  );
  const [needsPasswordChange, setNeedsPasswordChange] = useState(
    () => localStorage.getItem("nvr_needs_password_change") === "true"
  );
  const [currentView, setCurrentView] = useState("videowall");

  useEffect(() => {
    if (isAuthenticated && !needsPasswordChange) {
      dispatch(fetchCameras());
    }
  }, [dispatch, isAuthenticated, needsPasswordChange]);

  const handleLoginSuccess = (token, username, role, mustChange) => {
    localStorage.setItem("nvr_token", token);
    localStorage.setItem("nvr_role", role);
    if (mustChange) {
      localStorage.setItem("nvr_needs_password_change", "true");
      setNeedsPasswordChange(true);
    } else {
      localStorage.removeItem("nvr_needs_password_change");
      setNeedsPasswordChange(false);
    }
    setIsAuthenticated(true);
  };

  const handlePasswordChanged = (newToken) => {
    localStorage.setItem("nvr_token", newToken);
    localStorage.removeItem("nvr_needs_password_change");
    setNeedsPasswordChange(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (needsPasswordChange) {
    return <ChangePassword onPasswordChanged={handlePasswordChanged} />;
  }

  if (currentView === "layout-editor") {
    return <VideoWallEditor onClose={() => setCurrentView("videowall")} />;
  }

  return (
    <Flex
      h="100vh"
      w="100vw"
      bg="gray.100"
      color="gray.900"
      overflow="hidden"
      p="10px"
      gap="10px"
    >
      <Box
        bg="transparent"
        display="flex"
        flexDirection="column"
        zIndex={10}
        overflow="visible"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Sidebar />
      </Box>
      <Box
        flex="1"
        bg="black"
        position="relative"
        overflow="hidden"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="nvr.border.default"
        shadow="lg"
      >
        <VideoWall onOpenLayoutEditor={() => setCurrentView("layout-editor")} />
      </Box>
    </Flex>
  );
}

export default App;
