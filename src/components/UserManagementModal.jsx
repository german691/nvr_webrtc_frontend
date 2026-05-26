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
  IconButton,
  Center,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { BeatLoader } from "react-spinners";
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
  ArrowLeft,
} from "lucide-react";
import { cameraApi } from "../api/camera.api";

// Colección para el Select de Chakra UI
const roleCollection = createListCollection({
  items: [
    { value: "viewer", label: "Visor (Cámaras)" },
    { value: "admin", label: "Administrador" },
  ],
});

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

  // animación
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);

  // confirmación de eliminación
  const [userToDelete, setUserToDelete] = useState(null);

  const isFormOpen = isCreating || !!editingUser || !!resettingPasswordUser;

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

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteClosing(false);
  };

  const handleCloseDelete = () => {
    setIsDeleteClosing(true);
    setTimeout(() => {
      setUserToDelete(null);
      setIsDeleteClosing(false);
    }, 280);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showNotification(
        "Por favor, complete todos los campos obligatorios.",
        "error",
      );
      return;
    }
    if (password.length < 6) {
      showNotification(
        "La contraseña debe tener al menos 6 caracteres.",
        "error",
      );
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
        showNotification(
          "Usuario creado con éxito. Se obligará a cambiar clave al ingresar.",
        );
        fetchUsers();
        resetForm();
      } else {
        setError(response.message || "Error al crear el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al intentar crear el usuario.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showNotification(
        "Por favor, ingrese un nombre de usuario válido.",
        "error",
      );
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
      setError(
        err.response?.data?.message ||
          "Error al intentar actualizar el usuario.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      showNotification(
        "La contraseña debe tener al menos 6 caracteres.",
        "error",
      );
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
        showNotification(
          response.message || "Contraseña restablecida de forma exitosa.",
        );
        fetchUsers();
        resetForm();
      } else {
        setError(response.message || "Error al cambiar la contraseña.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al cambiar la contraseña.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.deleteUser(userId);
      if (response && response.status === "success") {
        showNotification("Usuario eliminado correctamente.");
        fetchUsers();
        handleCloseDelete();
      } else {
        setError(response.message || "Error al eliminar el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al intentar eliminar el usuario.",
      );
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
      {/* CAPA DE FONDO DEL MODAL */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(8px)"
        zIndex={1900}
        onClick={handleCloseModal}
        className={isClosing ? "animate-backdrop-out" : "animate-backdrop-in"}
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
          bg="nvr.bg.modal"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="nvr.border.default"
          shadow="2xl"
          pointerEvents="auto"
          display="flex"
          flexDirection="column"
          maxH="85vh"
          overflow="hidden"
          className={isClosing ? "animate-modal-out" : "animate-modal-in"}
          transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        >
          {/* HEADER DINÁMICO SEGÚN EL CONTENIDO */}
          <Flex
            p={3}
            borderBottomWidth="1px"
            borderColor="nvr.border.subtle"
            justify="space-between"
            align="center"
            bg="nvr.bg.headerBg"
          >
            <HStack gap={3}>
              <Center
                p={2}
                borderRadius="lg"
                bg={isFormOpen ? "nvr.brand.activeBg" : "nvr.bg.muted"}
                color={
                  isFormOpen ? "nvr.brand.primaryText" : "nvr.text.primary"
                }
              >
                {isFormOpen ? (
                  resettingPasswordUser ? (
                    <Key size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )
                ) : (
                  <Users size={20} />
                )}
              </Center>
              <VStack align="stretch" gap={0}>
                <Text fontWeight="bold" fontSize="md" color="nvr.text.primary">
                  {isCreating && "Registrar Nuevo Usuario"}
                  {editingUser && "Editar Perfil de Usuario"}
                  {resettingPasswordUser && "Restablecer Contraseña"}
                  {!isFormOpen && "Gestión Administrativa de Usuarios"}
                </Text>
                <Text fontSize="2xs" color="nvr.text.secondary">
                  {isCreating && "Agrega una nueva cuenta de acceso al sistema"}
                  {editingUser &&
                    `Modifica los privilegios del usuario: ${editingUser.username}`}
                  {resettingPasswordUser &&
                    `Genera una clave temporal para: ${resettingPasswordUser.username}`}
                  {!isFormOpen &&
                    "Crear, editar, restablecer contraseñas y eliminar accesos del NVR"}
                </Text>
              </VStack>
            </HStack>

            {isFormOpen ? (
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="gray"
                borderRadius="xl"
                onClick={resetForm}
                title="Volver al listado"
                aria-label="Volver al listado"
              >
                <ArrowLeft size={18} />
              </IconButton>
            ) : (
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="gray"
                borderRadius="xl"
                onClick={handleCloseModal}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </IconButton>
            )}
          </Flex>
          {successMsg && (
            <Flex
              bg="nvr.brand.successBg"
              borderBottomWidth="1px"
              borderColor="nvr.brand.successBorder"
              p={3.5}
              px={4}
              gap={3}
              align="center"
              animation="slide-down 0.2s ease-out"
            >
              <Box color="nvr.brand.success">
                <CheckCircle size={16} />
              </Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="nvr.brand.success"
              >
                {successMsg}
              </Text>
            </Flex>
          )}

          {error && (
            <Flex
              bg="nvr.brand.dangerBg"
              borderBottomWidth="1px"
              borderColor="nvr.brand.dangerBorder"
              p={3.5}
              px={4}
              gap={3}
              align="center"
              animation="slide-down 0.2s ease-out"
            >
              <Box color="nvr.brand.dangerIcon">
                <AlertCircle size={16} />
              </Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="nvr.brand.danger"
              >
                {error}
              </Text>
            </Flex>
          )}

          {/* CONTENIDO DINÁMICO: FORMULARIO O LISTADO */}
          <Box flex="1" overflowY="auto" p={4} bg="nvr.bg.muted">
            {isFormOpen ? (
              /* FORMULARIO DE ACCIONES */
              <form
                onSubmit={
                  isCreating
                    ? handleCreateUser
                    : editingUser
                      ? handleUpdateUser
                      : handleResetPassword
                }
              >
                <VStack gap={4} align="stretch" p={1}>
                  {!resettingPasswordUser && (
                    <HStack gap={3} align="start">
                      <Box flex="1">
                        <Text
                          fontSize="2xs"
                          fontWeight="bold"
                          color="nvr.text.secondary"
                          mb={1.5}
                          textTransform="uppercase"
                        >
                          Nombre de Usuario
                        </Text>
                        <Input
                          placeholder="Ej. JuanPerez"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          h="38px"
                          borderRadius="lg"
                          bg="nvr.bg.card"
                          borderColor="nvr.border.interactive"
                          fontSize="sm"
                          disabled={actionLoading}
                          required
                        />
                      </Box>

                      <Box w="180px">
                        <Text
                          fontSize="2xs"
                          fontWeight="bold"
                          color="nvr.text.secondary"
                          mb={1.5}
                          textTransform="uppercase"
                        >
                          Rol del Usuario
                        </Text>
                        <Select.Root
                          size="sm"
                          collection={roleCollection}
                          value={[role]}
                          onValueChange={(e) => setRole(e.value[0])}
                          disabled={actionLoading}
                        >
                          <Select.HiddenSelect name="role" />
                          <Select.Control>
                            <Select.Trigger
                              bg="nvr.bg.card"
                              borderColor="nvr.border.interactive"
                              borderRadius="lg"
                              h="38px"
                            >
                              <Select.ValueText placeholder="Seleccionar rol" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Select.Positioner>
                            <Select.Content
                              bg="nvr.bg.modal"
                              borderColor="nvr.border.default"
                              shadow="md"
                              borderRadius="lg"
                              zIndex={2200}
                            >
                              {roleCollection.items.map((item) => (
                                <Select.Item
                                  item={item}
                                  key={item.value}
                                  _hover={{ bg: "nvr.bg.muted" }}
                                >
                                  {item.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Select.Root>
                      </Box>
                    </HStack>
                  )}

                  {(isCreating || resettingPasswordUser) && (
                    <Box>
                      <Text
                        fontSize="2xs"
                        fontWeight="bold"
                        color="nvr.text.secondary"
                        mb={1.5}
                        textTransform="uppercase"
                      >
                        {resettingPasswordUser
                          ? "Nueva Contraseña"
                          : "Contraseña Inicial"}
                      </Text>
                      <Flex position="relative" align="center">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          h="38px"
                          borderRadius="lg"
                          bg="nvr.bg.card"
                          borderColor="nvr.border.interactive"
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
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </IconButton>
                      </Flex>
                      {isCreating && (
                        <Text fontSize="2xs" color="gray.500" mt={1.5}>
                          * Nota: Por seguridad, se obligará al usuario a
                          redefinir esta clave en su primer acceso.
                        </Text>
                      )}
                    </Box>
                  )}

                  <HStack gap={3} pt={2}>
                    <Button
                      variant="outline"
                      colorPalette="gray"
                      borderColor="nvr.border.default"
                      _hover={{ bg: "nvr.bg.muted" }}
                      onClick={resetForm}
                      disabled={actionLoading}
                      h="38px"
                      flex="1"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={actionLoading}
                      loadingText="Guardando..."
                      h="38px"
                      bg="nvr.brand.primaryText"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      flex="2"
                      _hover={{
                        bg: "blue.700",
                      }}
                    >
                      Guardar Cambios
                    </Button>
                  </HStack>
                </VStack>
              </form>
            ) : isLoading ? (
              /* ESTADO DE CARGA DEL LISTADO */
              <Flex py={12} direction="column" align="center" gap={4}>
                <BeatLoader size={12} color="#2563eb" />
                <Text fontSize="xs" color="gray.500">
                  Cargando listado de usuarios...
                </Text>
              </Flex>
            ) : (
              /* LISTADO DE USUARIOS */
              <Box>
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="blue"
                  onClick={() => setIsCreating(true)}
                  mb={4}
                  gap={2}
                >
                  <UserPlus size={14} />
                  Registrar Nuevo Usuario
                </Button>

                <VStack gap={2.5} align="stretch">
                  {users.map((user) => (
                    <Box
                      key={user.id}
                      p={2.5}
                      bg="nvr.bg.card"
                      borderWidth="1px"
                      borderColor="nvr.border.default"
                      borderRadius="lg"
                      shadow="xs"
                      transition="all 0.2s"
                      _hover={{
                        shadow: "sm",
                        borderColor: "nvr.border.interactive",
                      }}
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap={3}
                      >
                        <HStack gap={3}>
                          <Center
                            p={2.5}
                            borderRadius="full"
                            bg="nvr.bg.muted"
                            color="nvr.text.primary"
                          >
                            {user.role === "admin" ? (
                              <Shield size={16} />
                            ) : (
                              <User size={16} />
                            )}
                          </Center>
                          <VStack align="stretch" gap={0.5}>
                            <Text
                              fontWeight="bold"
                              fontSize="sm"
                              color="nvr.text.primary"
                            >
                              {user.username}
                            </Text>
                            <HStack gap={2}>
                              <Badge
                                colorPalette="gray"
                                variant="subtle"
                                fontSize="2xs"
                                borderRadius="md"
                                px={1.5}
                              >
                                {user.role === "admin"
                                  ? "Administrador"
                                  : "Visor"}
                              </Badge>
                              {user.password_changed === 0 && (
                                <Badge
                                  colorPalette="orange"
                                  variant="subtle"
                                  fontSize="2xs"
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
                            onClick={() => handleOpenDelete(user)}
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

      {/* POPUP ALERT DIALOG: CONFIRMACIÓN DE ELIMINACIÓN DE USUARIO */}
      {userToDelete && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            backdropFilter="blur(4px)"
            zIndex={2200}
            onClick={handleCloseDelete}
            className={
              isDeleteClosing ? "animate-backdrop-out" : "animate-backdrop-in"
            }
          />
          <Flex
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={2300}
            align="center"
            justify="center"
            p={4}
            pointerEvents="none"
          >
            <Box
              w="full"
              maxW="md"
              bg="nvr.bg.modal"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="nvr.border.default"
              shadow="2xl"
              pointerEvents="auto"
              p={5}
              className={
                isDeleteClosing ? "animate-modal-out" : "animate-modal-in"
              }
            >
              <VStack gap={4} align="center" textAlign="center">
                <Center
                  p={3}
                  borderRadius="full"
                  bg="nvr.brand.dangerBg"
                  color="nvr.brand.dangerIcon"
                >
                  <AlertCircle size={28} />
                </Center>
                <VStack gap={1}>
                  <Heading size="xs" color="nvr.text.primary" fontWeight="bold">
                    ¿Eliminar cuenta de usuario?
                  </Heading>
                  <Text fontSize="xs" color="nvr.text.secondary">
                    ¿Está seguro de que desea eliminar al usuario{" "}
                    <strong>{userToDelete.username}</strong>? Esta acción no se
                    puede deshacer y revocará todos sus accesos de inmediato.
                  </Text>
                </VStack>
                <HStack gap={3} w="full">
                  <Button
                    flex="1"
                    variant="outline"
                    colorPalette="gray"
                    borderColor="nvr.border.default"
                    _hover={{ bg: "nvr.bg.muted" }}
                    size="sm"
                    onClick={handleCloseDelete}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="nvr.brand.danger"
                    color="white"
                    size="sm"
                    onClick={() => handleDeleteUser(userToDelete.id)}
                    loading={actionLoading}
                    _hover={{ bg: "red.700" }}
                  >
                    Eliminar Cuenta
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Flex>
        </Portal>
      )}
    </Box>
  );
};

export default UserManagementModal;
