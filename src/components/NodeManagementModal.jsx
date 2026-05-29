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
} from "@chakra-ui/react";
import { BeatLoader } from "react-spinners";
import {
  Server,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { cameraApi } from "../api/camera.api";

export const NodeManagementModal = ({ isOpen, onClose }) => {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");

  // animación
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);

  // confirmación de eliminación
  const [nodeToDelete, setNodeToDelete] = useState(null);

  const isFormOpen = isCreating || !!editingNode;

  const fetchNodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cameraApi.getNodes();
      if (data.status === "success") {
        setNodes(data.nodes || []);
      } else {
        setError("No se pudo obtener la lista de nodos.");
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
    setIp("");
    setLabel("");
    setIsCreating(false);
    setEditingNode(null);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchNodes();
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

  const handleOpenDelete = (node) => {
    setNodeToDelete(node);
    setIsDeleteClosing(false);
  };

  const handleCloseDelete = () => {
    setIsDeleteClosing(true);
    setTimeout(() => {
      setNodeToDelete(null);
      setIsDeleteClosing(false);
    }, 280);
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    if (!ip.trim()) {
      showNotification(
        "Por favor, ingrese la dirección IP.",
        "error",
      );
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.createNode({
        ip: ip.trim(),
        label: label.trim() || null,
      });

      if (response && response.status === "success") {
        showNotification("Fuente de video agregada y registrado con éxito.");
        fetchNodes();
        resetForm();
      } else {
        setError(response.message || "Error al registrar el nodo.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al intentar registrar el nodo.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateNode = async (e) => {
    e.preventDefault();
    if (!ip.trim()) {
      showNotification(
        "Por favor, ingrese la dirección IP.",
        "error",
      );
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.updateNode(editingNode.id, {
        ip: ip.trim(),
        label: label.trim() || null,
      });

      if (response && response.status === "success") {
        showNotification("Configuración de nodo actualizada correctamente.");
        fetchNodes();
        resetForm();
      } else {
        setError(response.message || "Error al actualizar el nodo.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al intentar actualizar el nodo.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await cameraApi.deleteNode(nodeId);
      if (response && response.status === "success") {
        showNotification("Nodo eliminado del pool correctamente.");
        fetchNodes();
        handleCloseDelete();
      } else {
        setError(response.message || "Error al eliminar el nodo.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al intentar eliminar el nodo.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (node) => {
    resetForm();
    setEditingNode(node);
    setIp(node.ip);
    setLabel(node.label || "");
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
          {/* HEADER DINÁMICO */}
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
                <Server size={20} />
              </Center>
              <VStack align="stretch" gap={0}>
                <Text fontWeight="bold" fontSize="md" color="nvr.text.primary">
                  {isCreating && "Añadir nueva fuente"}
                  {editingNode &&
                    `Editar Nodo: ${editingNode.label || editingNode.ip}`}
                  {!isFormOpen && "Gestión de fuentes"}
                </Text>
                <Text fontSize="2xs" color="nvr.text.secondary">
                  {isCreating &&
                    "Registra un servidor adicional para capturar cámaras USB"}
                  {editingNode &&
                    "Modifica los parámetros de red del nodo"}
                  {!isFormOpen &&
                    "Administra los servidores de captura y streaming WebRTC"}
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

          {/* CUERPO DEL MODAL */}
          <Box flex="1" overflowY="auto" p={4} bg="nvr.bg.muted">
            {isFormOpen ? (
              /* FORMULARIO DE ACCIONES */
              <form onSubmit={isCreating ? handleCreateNode : handleUpdateNode}>
                <VStack gap={4} align="stretch" p={1}>
                  <Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      color="nvr.text.secondary"
                      mb={1.5}
                      textTransform="uppercase"
                    >
                      Dirección IP / Hostname *
                    </Text>
                    <Input
                      placeholder="Ej. 192.168.1.103"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      h="38px"
                      borderRadius="lg"
                      bg="nvr.bg.card"
                      borderColor="nvr.border.interactive"
                      fontSize="sm"
                      disabled={actionLoading}
                      required
                    />
                  </Box>

                  <Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      color="nvr.text.secondary"
                      mb={1.5}
                      textTransform="uppercase"
                    >
                      Nombre / Etiqueta del Nodo (Opcional)
                    </Text>
                    <Input
                      placeholder="Ej. Nodo Quirófanos Planta Alta"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      h="38px"
                      borderRadius="lg"
                      bg="nvr.bg.card"
                      borderColor="nvr.border.interactive"
                      fontSize="sm"
                      disabled={actionLoading}
                    />
                  </Box>

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
                      Guardar Nodo
                    </Button>
                  </HStack>
                </VStack>
              </form>
            ) : isLoading ? (
              /* ESTADO DE CARGA */
              <Flex py={12} direction="column" align="center" gap={4}>
                <BeatLoader size={12} color="#2563eb" />
                <Text fontSize="xs" color="gray.500">
                  Cargando listado de nodos...
                </Text>
              </Flex>
            ) : (
              /* LISTADO DE NODOS */
              <Box>
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="blue"
                  onClick={() => setIsCreating(true)}
                  mb={4}
                  gap={2}
                >
                  <Plus size={14} />
                  Añadir nueva fuente de video
                </Button>

                {nodes.length === 0 ? (
                  <Center py={8} flexDirection="column" gap={3}>
                    <Server size={36} color="#9ca3af" />
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      No hay nodos registrados en el pool.
                    </Text>
                  </Center>
                ) : (
                  <VStack gap={2.5} align="stretch">
                    {nodes.map((node) => (
                      <Box
                        key={node.id}
                        p={3}
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
                              color="nvr.brand.primaryText"
                            >
                              <Server size={18} />
                            </Center>
                            <VStack align="stretch" gap={0.5}>
                              <Text
                                fontWeight="bold"
                                fontSize="sm"
                                color="nvr.text.primary"
                              >
                                {node.label || "Nodo sin Nombre"}
                              </Text>
                              <HStack gap={2}>
                                <Badge
                                  colorPalette="blue"
                                  variant="subtle"
                                  fontSize="2xs"
                                  borderRadius="md"
                                  px={1.5}
                                >
                                  IP: {node.ip}
                                </Badge>
                              </HStack>
                            </VStack>
                          </HStack>

                          <HStack gap={1.5}>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="gray"
                              onClick={() => startEdit(node)}
                              title="Editar Nodo"
                              disabled={actionLoading}
                            >
                              <Edit size={14} />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleOpenDelete(node)}
                              title="Eliminar Nodo"
                              disabled={actionLoading}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Flex>

      {/* DIÁLOGO DE ELIMINACIÓN */}
      {nodeToDelete && (
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
              p={5}
              pointerEvents="auto"
              className={
                isDeleteClosing ? "animate-modal-out" : "animate-modal-in"
              }
            >
              <VStack gap={4} align="stretch">
                <HStack gap={3}>
                  <Center p={2} borderRadius="lg" bg="red.100" color="red.600">
                    <Trash2 size={20} />
                  </Center>
                  <Heading size="xs" color="nvr.text.primary">
                    ¿Eliminar fuente de video del pool?
                  </Heading>
                </HStack>

                <Text fontSize="xs" color="nvr.text.secondary">
                  Esta acción desconectará y eliminará el nodo{" "}
                  <strong>{nodeToDelete.label || nodeToDelete.ip}</strong> (
                  {nodeToDelete.ip}) de la orquestación de cámaras. Las cámaras
                  asociadas a este nodo ya no se listarán ni podrán controlarse
                  en el videowall.
                </Text>

                <HStack gap={3} justify="end" pt={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    onClick={handleCloseDelete}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    bg="red.600"
                    color="white"
                    _hover={{ bg: "red.700" }}
                    onClick={() => handleDeleteNode(nodeToDelete.id)}
                    loading={actionLoading}
                  >
                    Eliminar Nodo
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
