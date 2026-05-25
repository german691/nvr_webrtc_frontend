import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  Heading,
  HStack,
  Badge,
  Spinner,
  IconButton,
  NativeSelect,
  Center,
} from "@chakra-ui/react";
import {
  User,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Key,
  Edit,
  X,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import { cameraApi } from "../api/camera.api";

export const UserManagementModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cameraApi.getUsers();
      if (data.status === "success") {
        setUsers(data.users || []);
      } else {
        setError("No se pudo obtener la lista de usuarios.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Error al intentar comunicarse con el servidor.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("viewer");
    setShowPassword(false);
    setIsCreating(false);
    setEditingUser(null);
    setResettingPasswordUser(null);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchUsers();
        resetForm();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const showNotification = (msg, type = "success") => {
    if (type === "success") {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showNotification("Por favor, complete todos los campos obligatorios.", "error");
      return;
    }
    if (password.length < 6) {
      showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.createUser({
        username: username.trim(),
        password,
        role,
      });

      if (response && response.status === "success") {
        showNotification("Usuario creado con éxito. Se obligará a cambiar clave al ingresar.");
        fetchUsers();
        resetForm();
      } else {
        setError(response.message || "Error al crear el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al intentar crear el usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showNotification("Por favor, ingrese un nombre de usuario válido.", "error");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.updateUser(editingUser.id, {
        username: username.trim(),
        role,
      });

      if (response && response.status === "success") {
        showNotification("Usuario actualizado correctamente.");
        fetchUsers();
        resetForm();
      } else {
        setError(response.message || "Error al actualizar el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al intentar actualizar el usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.changeUserPassword(
        resettingPasswordUser.id,
        password,
      );

      if (response && response.status === "success") {
        showNotification(response.message || "Contraseña restablecida de forma exitosa.");
        fetchUsers();
        resetForm();
      } else {
        setError(response.message || "Error al cambiar la contraseña.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("¿Está seguro de que desea eliminar a este usuario permanentemente?")) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.deleteUser(userId);
      if (response && response.status === "success") {
        showNotification("Usuario eliminado correctamente.");
        fetchUsers();
      } else {
        setError(response.message || "Error al eliminar el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al intentar eliminar el usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (user) => {
    resetForm();
    setEditingUser(user);
    setUsername(user.username);
    setRole(user.role);
  };

  const startResetPassword = (user) => {
    resetForm();
    setResettingPasswordUser(user);
  };

  if (!isOpen) return null;

  return (
    <Box>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(8px)"
        zIndex={1900}
        onClick={onClose}
        animation="fade-in 0.25s ease-out forwards"
      />

      <Flex
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={2000}
        align="center"
        justify="center"
        p={4}
        pointerEvents="none"
      >
        <Box
          w="full"
          maxW="2xl"
          bg="white"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="2xl"
          pointerEvents="auto"
          display="flex"
          flexDirection="column"
          maxH="85vh"
          overflow="hidden"
          animation="modal-content-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        >
          <Flex
            p={4}
            borderBottomWidth="1px"
            borderColor="gray.100"
            justify="space-between"
            align="center"
            bg="gray.50"
          >
            <HStack gap={3}>
              <Box p={2} borderRadius="xl" bg="gray.100" color="gray.800">
                <Users size={20} />
              </Box>
              <VStack align="stretch" gap={0}>
                <Text fontWeight="bold" fontSize="md" color="gray.800">
                  Gestión Administrativa de Usuarios
                </Text>
                <Text fontSize="2xs" color="gray.500">
                  Crear, editar, restablecer contraseñas y eliminar accesos del NVR
                </Text>
              </VStack>
            </HStack>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              borderRadius="xl"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </IconButton>
          </Flex>

          {successMsg && (
            <Flex
              bg="emerald.50"
              borderBottomWidth="1px"
              borderColor="emerald.200"
              p={3.5}
              px={4}
              gap={3}
              align="center"
              animation="slide-down 0.2s ease-out"
            >
              <Box color="emerald.500">
                <CheckCircle size={16} />
              </Box>
              <Text fontSize="xs" fontWeight="semibold" color="emerald.700">
                {successMsg}
              </Text>
            </Flex>
          )}

          {error && (
            <Flex
              bg="red.50"
              borderBottomWidth="1px"
              borderColor="red.200"
              p={3.5}
              px={4}
              gap={3}
              align="center"
              animation="slide-down 0.2s ease-out"
            >
              <Box color="red.500">
                <AlertCircle size={16} />
              </Box>
              <Text fontSize="xs" fontWeight="semibold" color="red.700">
                {error}
              </Text>
            </Flex>
          )}

          <Box flex="1" overflowY="auto" p={5} bg="gray.50/50">
            {(isCreating || editingUser || resettingPasswordUser) && (
              <Box
                bg="rgba(255, 255, 255, 0.8)"
                backdropFilter="blur(20px)"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                p={4}
                mb={5}
                shadow="sm"
                animation="slide-down 0.25s ease-out"
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="xs" color="gray.700" fontWeight="bold">
                    {isCreating && "Registrar Nuevo Usuario"}
                    {editingUser && `Editar Perfil: ${editingUser.username}`}
                    {resettingPasswordUser && `Restablecer Clave de: ${resettingPasswordUser.username}`}
                  </Heading>
                  <Button
                    size="2xs"
                    variant="ghost"
                    colorPalette="red"
                    borderRadius="lg"
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                </Flex>

                <form
                  onSubmit={
                    isCreating
                      ? handleCreateUser
                      : editingUser
                      ? handleUpdateUser
                      : handleResetPassword
                  }
                >
                  <VStack gap={4} align="stretch">
                    {!resettingPasswordUser && (
                      <HStack gap={4} align="start">
                        <Box flex="1">
                          <Text fontSize="2xs" fontWeight="bold" color="gray.700" mb={1.5} textTransform="uppercase">
                            Nombre de Usuario
                          </Text>
                          <Input
                            placeholder="Ej. JuanPerez"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            h="38px"
                            borderRadius="lg"
                            bg="white"
                            fontSize="sm"
                            disabled={actionLoading}
                            required
                          />
                        </Box>

                        <Box w="180px">
                          <Text fontSize="2xs" fontWeight="bold" color="gray.700" mb={1.5} textTransform="uppercase">
                            Rol del Usuario
                          </Text>
                          <NativeSelect.Root size="sm" h="38px" bg="white" borderRadius="lg">
                            <NativeSelect.Field
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              disabled={actionLoading}
                            >
                              <option value="viewer">Visor (Cámaras)</option>
                              <option value="admin">Administrador</option>
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Box>
                      </HStack>
                    )}

                    {(isCreating || resettingPasswordUser) && (
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color="gray.700" mb={1.5} textTransform="uppercase">
                          {resettingPasswordUser ? "Nueva Contraseña" : "Contraseña Inicial"}
                        </Text>
                        <Flex position="relative" align="center">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            h="38px"
                            borderRadius="lg"
                            bg="white"
                            fontSize="sm"
                            disabled={actionLoading}
                            pr="40px"
                            required
                          />
                          <IconButton
                            type="button"
                            position="absolute"
                            right="2"
                            variant="ghost"
                            h="28px"
                            w="28px"
                            p={0}
                            minW="auto"
                            color="gray.400"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={actionLoading}
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </IconButton>
                        </Flex>
                        {isCreating && (
                          <Text fontSize="3xs" color="gray.500" mt={1}>
                            * Nota: Por seguridad, se obligará al usuario a redefinir esta clave en su primer acceso.
                          </Text>
                        )}
                      </Box>
                    )}

                    <Button
                      type="submit"
                      loading={actionLoading}
                      loadingText="Guardando..."
                      h="38px"
                      bg="blue.600"
                      color="white"
                      borderRadius="lg"
                      fontSize="xs"
                      fontWeight="bold"
                      _hover={{
                        bg: "blue.700",
                      }}
                    >
                      Guardar Cambios
                    </Button>
                  </VStack>
                </form>
              </Box>
            )}

            {isLoading ? (
              <Flex py={12} direction="column" align="center" gap={4}>
                <Spinner color="blue.600" size="lg" />
                <Text fontSize="xs" color="gray.500">
                  Cargando listado de usuarios...
                </Text>
              </Flex>
            ) : (
              <Box>
                {!isCreating && !editingUser && !resettingPasswordUser && (
                  <Button
                    size="sm"
                    variant="solid"
                    colorPalette="blue"
                    borderRadius="xl"
                    onClick={() => setIsCreating(true)}
                    mb={4}
                    gap={2}
                  >
                    <UserPlus size={14} />
                    Registrar Nuevo Usuario
                  </Button>
                )}

                <VStack gap={3.5} align="stretch">
                  {users.map((user) => (
                    <Box
                      key={user.id}
                      p={3.5}
                      bg="white"
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="xl"
                      shadow="xs"
                      transition="all 0.2s"
                      _hover={{ shadow: "sm", borderColor: "gray.300" }}
                    >
                      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                        <HStack gap={3}>
                          <Center
                            p={2.5}
                            borderRadius="full"
                            bg="gray.100"
                            color="gray.800"
                          >
                            {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
                          </Center>
                          <VStack align="stretch" gap={0.5}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                              {user.username}
                            </Text>
                            <HStack gap={2}>
                              <Badge
                                colorPalette="gray"
                                variant="subtle"
                                fontSize="3xs"
                                borderRadius="md"
                                px={1.5}
                              >
                                {user.role === "admin" ? "Administrador" : "Visor"}
                              </Badge>
                              {user.password_changed === 0 && (
                                <Badge
                                  colorPalette="orange"
                                  variant="subtle"
                                  fontSize="3xs"
                                  borderRadius="md"
                                  px={1.5}
                                >
                                  Clave Temporal
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                        </HStack>

                        <HStack gap={1.5}>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="gray"
                            borderRadius="lg"
                            onClick={() => startEdit(user)}
                            title="Editar Perfil"
                            disabled={actionLoading}
                          >
                            <Edit size={14} />
                          </IconButton>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="gray"
                            borderRadius="lg"
                            onClick={() => startResetPassword(user)}
                            title="Restablecer Contraseña"
                            disabled={actionLoading}
                          >
                            <Key size={14} />
                          </IconButton>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            borderRadius="lg"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Eliminar Cuenta"
                            disabled={actionLoading}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </HStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default UserManagementModal;
