import { useState, useMemo, useRef } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Center,
  Grid,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { Layout, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { createLayout, deleteLayout } from "../store/slices/layoutsSlice";
import { toaster } from "./ui/toaster";

const resolveLayoutPositions = (count, columns, rowsCount, existingCells = []) => {
  const newCells = [];
  const gridMap = {};
  for (let r = 1; r <= rowsCount; r++) {
    gridMap[r] = {};
    for (let c = 1; c <= columns; c++) {
      gridMap[r][c] = false;
    }
  }

  const isRegionFree = (startRow, startCol, rSpan, cSpan) => {
    for (let r = startRow; r < startRow + rSpan; r++) {
      for (let c = startCol; c < startCol + cSpan; c++) {
        if (!gridMap[r] || gridMap[r][c] === undefined || gridMap[r][c] === true) {
          return false;
        }
      }
    }
    return true;
  };

  const markRegion = (startRow, startCol, rSpan, cSpan, val) => {
    for (let r = startRow; r < startRow + rSpan; r++) {
      for (let c = startCol; c < startCol + cSpan; c++) {
        if (gridMap[r]) {
          gridMap[r][c] = val;
        }
      }
    }
  };

  for (let idx = 0; idx < count; idx++) {
    const existing = existingCells[idx];
    if (existing) {
      const fits =
        existing.startCol >= 1 &&
        existing.startCol + existing.colSpan - 1 <= columns &&
        existing.startRow >= 1 &&
        existing.startRow + existing.rowSpan - 1 <= rowsCount;

      if (fits && isRegionFree(existing.startRow, existing.startCol, existing.rowSpan, existing.colSpan)) {
        markRegion(existing.startRow, existing.startCol, existing.rowSpan, existing.colSpan, true);
        newCells.push({
          startCol: existing.startCol,
          colSpan: existing.colSpan,
          startRow: existing.startRow,
          rowSpan: existing.rowSpan,
          isPrimary: existing.isPrimary,
        });
        continue;
      }
    }
    newCells.push(null);
  }

  for (let idx = 0; idx < count; idx++) {
    if (newCells[idx] !== null) continue;

    let placed = false;
    for (let r = 1; r <= rowsCount; r++) {
      for (let c = 1; c <= columns; c++) {
        if (isRegionFree(r, c, 1, 1)) {
          markRegion(r, c, 1, 1, true);
          newCells[idx] = {
            startCol: c,
            colSpan: 1,
            startRow: r,
            rowSpan: 1,
            isPrimary: idx === 0,
          };
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      newCells[idx] = {
        startCol: 1,
        colSpan: 1,
        startRow: 1,
        rowSpan: 1,
        isPrimary: idx === 0,
      };
    }
  }

  return newCells;
};

const hasCollision = (idx, startCol, startRow, colSpan, rowSpan, currentCells) => {
  const a_endCol = startCol + colSpan - 1;
  const a_endRow = startRow + rowSpan - 1;

  for (let i = 0; i < currentCells.length; i++) {
    if (i === idx) continue;
    const b = currentCells[i];
    const b_endCol = b.startCol + b.colSpan - 1;
    const b_endRow = b.startRow + b.rowSpan - 1;

    const overlap = !(
      a_endCol < b.startCol ||
      b_endCol < startCol ||
      a_endRow < b.startRow ||
      b_endRow < startRow
    );
    if (overlap) return true;
  }
  return false;
};

let lastToastTime = 0;
const showToast = (description, type) => {
  const now = Date.now();
  if (now - lastToastTime < 500) return;
  lastToastTime = now;

  toaster.create({
    description,
    type,
  });
};

export const VideoWallEditor = ({ onClose }) => {
  const dispatch = useDispatch();
  const boardRef = useRef(null);

  const { presets } = useSelector((state) => state.layouts);

  const [cameraCount, setCameraCount] = useState(4);
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [selectedCamIdx, setSelectedCamIdx] = useState(0);

  const [colRatio, setColRatio] = useState(50);
  const [colRatio2, setColRatio2] = useState(66.66);
  const [rowRatio, setRowRatio] = useState(50);
  const [rowRatio2, setRowRatio2] = useState(66.66);

  const [cells, setCells] = useState([
    { startCol: 1, colSpan: 1, startRow: 1, rowSpan: 1, isPrimary: true },
    { startCol: 2, colSpan: 1, startRow: 1, rowSpan: 1, isPrimary: false },
    { startCol: 1, colSpan: 1, startRow: 2, rowSpan: 1, isPrimary: false },
    { startCol: 2, colSpan: 1, startRow: 2, rowSpan: 1, isPrimary: false },
  ]);

  const cameraCountCollection = useMemo(
    () =>
      createListCollection({
        items: Array.from({ length: 11 }, (_, i) => ({
          label: String(i + 2),
          value: String(i + 2),
        })),
      }),
    []
  );

  const colsCollection = useMemo(
    () =>
      createListCollection({
        items: Array.from({ length: 12 }, (_, i) => ({
          label: String(i + 1),
          value: String(i + 1),
        })),
      }),
    []
  );

  const rowsCollection = useMemo(
    () =>
      createListCollection({
        items: Array.from({ length: 12 }, (_, i) => ({
          label: String(i + 1),
          value: String(i + 1),
        })),
      }),
    []
  );

  const isGridSizeSufficient = cols * rows >= cameraCount;

  const customLayouts = useMemo(() => {
    const list = [];
    Object.keys(presets).forEach((camCount) => {
      const group = presets[camCount];
      Object.keys(group).forEach((layoutKey) => {
        const layout = group[layoutKey];
        if (layout.isCustom) {
          list.push({
            ...layout,
            cameraCount: Number(camCount),
            layoutKey,
          });
        }
      });
    });
    return list;
  }, [presets]);

  const handleCameraCountChange = (newCount) => {
    setCameraCount(newCount);
    setCells((prev) => resolveLayoutPositions(newCount, cols, rows, prev));
    setSelectedCamIdx(0);

    if (cols * rows < newCount) {
      showToast(
        `La rejilla actual de ${cols}x${rows} (${cols * rows} celdas) es demasiado pequeña para albergar ${newCount} cámaras. Por favor incrementa las columnas o filas.`,
        "error"
      );
    }
  };

  const handleColsChange = (newCols) => {
    setCols(newCols);
    setCells((prev) => resolveLayoutPositions(cameraCount, newCols, rows, prev));

    if (newCols === 1) {
      setColRatio(50);
      setColRatio2(66.66);
    } else if (newCols === 2) {
      setColRatio(50);
    } else if (newCols === 3) {
      setColRatio(33.33);
      setColRatio2(66.66);
    }

    if (newCols * rows < cameraCount) {
      showToast(
        `La rejilla actual de ${newCols}x${rows} (${newCols * rows} celdas) es demasiado pequeña para albergar ${cameraCount} cámaras. Por favor incrementa las columnas o filas.`,
        "error"
      );
    }
  };

  const handleRowsChange = (newRows) => {
    setRows(newRows);
    setCells((prev) => resolveLayoutPositions(cameraCount, cols, newRows, prev));

    if (newRows === 1) {
      setRowRatio(50);
      setRowRatio2(66.66);
    } else if (newRows === 2) {
      setRowRatio(50);
    } else if (newRows === 3) {
      setRowRatio(33.33);
      setRowRatio2(66.66);
    }

    if (cols * newRows < cameraCount) {
      showToast(
        `La rejilla actual de ${cols}x${newRows} (${cols * newRows} celdas) es demasiado pequeña para albergar ${cameraCount} cámaras. Por favor incrementa las columnas o filas.`,
        "error"
      );
    }
  };

  const handleResetRatios = () => {
    if (cols === 2) {
      setColRatio(50);
    } else if (cols === 3) {
      setColRatio(33.33);
      setColRatio2(66.66);
    }

    if (rows === 2) {
      setRowRatio(50);
    } else if (rows === 3) {
      setRowRatio(33.33);
      setRowRatio2(66.66);
    }

    showToast("Proporciones de la rejilla restablecidas", "info");
  };

  const handleDeleteLayout = (id) => {
    dispatch(deleteLayout(id));
    showToast("Diseño personalizado eliminado", "info");
  };

  const handleVisualCellClick = (r, c) => {
    setCells((prev) => {
      const updated = [...prev];
      const active = { ...updated[selectedCamIdx] };

      let targetRowSpan = active.rowSpan;
      let targetColSpan = active.colSpan;

      if (r + targetRowSpan - 1 > rows) {
        targetRowSpan = Math.max(1, rows - r + 1);
      }
      if (c + targetColSpan - 1 > cols) {
        targetColSpan = Math.max(1, cols - c + 1);
      }

      if (!hasCollision(selectedCamIdx, c, r, targetColSpan, targetRowSpan, prev)) {
        active.startRow = r;
        active.startCol = c;
        active.rowSpan = targetRowSpan;
        active.colSpan = targetColSpan;
        updated[selectedCamIdx] = active;
      }
      return updated;
    });
  };

  const handleSwapCameras = (idxA, idxB) => {
    if (idxA === idxB) return;
    setCells((prev) => {
      const updated = [...prev];
      const cellA = { ...updated[idxA] };
      const cellB = { ...updated[idxB] };

      updated[idxA] = {
        ...cellA,
        startCol: cellB.startCol,
        colSpan: cellB.colSpan,
        startRow: cellB.startRow,
        rowSpan: cellB.rowSpan,
        isPrimary: cellB.isPrimary,
      };

      updated[idxB] = {
        ...cellB,
        startCol: cellA.startCol,
        colSpan: cellA.colSpan,
        startRow: cellA.startRow,
        rowSpan: cellA.rowSpan,
        isPrimary: cellA.isPrimary,
      };

      return updated;
    });
    setSelectedCamIdx(idxB);
  };

  const handleMouseDown = (e, idx, action) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedCamIdx(idx);

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    const initialCells = [...cells];
    const cell = { ...initialCells[idx] };
    const initialCellLeft = (cell.startCol - 1) * cellWidth;
    const initialCellTop = (cell.startRow - 1) * cellHeight;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const offsetX = clickX - initialCellLeft;
    const offsetY = clickY - initialCellTop;

    const handleMouseMove = (moveEvent) => {
      const x = moveEvent.clientX - rect.left;
      const y = moveEvent.clientY - rect.top;

      setCells((prev) => {
        const updated = [...prev];
        const currentCell = { ...updated[idx] };

        if (action === "move") {
          const targetLeft = x - offsetX;
          const targetTop = y - offsetY;

          let col = Math.round(targetLeft / cellWidth) + 1;
          let row = Math.round(targetTop / cellHeight) + 1;

          col = Math.max(1, Math.min(col, cols - currentCell.colSpan + 1));
          row = Math.max(1, Math.min(row, rows - currentCell.rowSpan + 1));

          if (!hasCollision(idx, col, row, currentCell.colSpan, currentCell.rowSpan, prev)) {
            currentCell.startCol = col;
            currentCell.startRow = row;
          }
        } else if (action === "resize-col") {
          let col = Math.floor(x / cellWidth) + 1;
          let newColSpan = col - currentCell.startCol + 1;
          newColSpan = Math.max(1, Math.min(newColSpan, cols - currentCell.startCol + 1));

          if (!hasCollision(idx, currentCell.startCol, currentCell.startRow, newColSpan, currentCell.rowSpan, prev)) {
            currentCell.colSpan = newColSpan;
          }
        } else if (action === "resize-row") {
          let row = Math.floor(y / cellHeight) + 1;
          let newRowSpan = row - currentCell.startRow + 1;
          newRowSpan = Math.max(1, Math.min(newRowSpan, rows - currentCell.startRow + 1));

          if (!hasCollision(idx, currentCell.startCol, currentCell.startRow, currentCell.colSpan, newRowSpan, prev)) {
            currentCell.rowSpan = newRowSpan;
          }
        } else if (action === "resize-both") {
          let col = Math.floor(x / cellWidth) + 1;
          let row = Math.floor(y / cellHeight) + 1;

          let newColSpan = Math.max(1, Math.min(col - currentCell.startCol + 1, cols - currentCell.startCol + 1));
          let newRowSpan = Math.max(1, Math.min(row - currentCell.startRow + 1, rows - currentCell.startRow + 1));

          if (!hasCollision(idx, currentCell.startCol, currentCell.startRow, newColSpan, newRowSpan, prev)) {
            currentCell.colSpan = newColSpan;
            currentCell.rowSpan = newRowSpan;
          }
        }

        updated[idx] = currentCell;
        return updated;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDividerMouseDown = (e, type, idx) => {
    e.preventDefault();
    e.stopPropagation();

    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent) => {
      if (type === "col") {
        const x = moveEvent.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        
        if (idx === 1) {
          const maxVal = cols === 3 ? colRatio2 - 15 : 85;
          setColRatio(Math.min(Math.max(percentage, 15), maxVal));
        } else if (idx === 2) {
          setColRatio2(Math.min(Math.max(percentage, colRatio + 15), 85));
        }
      } else if (type === "row") {
        const y = moveEvent.clientY - rect.top;
        const percentage = (y / rect.height) * 100;

        if (idx === 1) {
          const maxVal = rows === 3 ? rowRatio2 - 15 : 85;
          setRowRatio(Math.min(Math.max(percentage, 15), maxVal));
        } else if (idx === 2) {
          setRowRatio2(Math.min(Math.max(percentage, rowRatio + 15), 85));
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const getOverlapResult = (cellsList) => {
    if (cellsList.length === 0) return { hasOverlap: false };
    for (let i = 0; i < cellsList.length; i++) {
      const a = cellsList[i];
      const a_endCol = a.startCol + a.colSpan - 1;
      const a_endRow = a.startRow + a.rowSpan - 1;
      for (let j = i + 1; j < cellsList.length; j++) {
        const b = cellsList[j];
        const b_endCol = b.startCol + b.colSpan - 1;
        const b_endRow = b.startRow + b.rowSpan - 1;

        const hasOverlap = !(
          a_endCol < b.startCol ||
          b_endCol < a.startCol ||
          a_endRow < b.startRow ||
          b_endRow < a.startRow
        );
        if (hasOverlap) {
          return { hasOverlap: true, camA: i + 1, camB: j + 1 };
        }
      }
    }
    return { hasOverlap: false };
  };

  const overlapResult = getOverlapResult(cells);

  const handleSave = () => {
    if (!isGridSizeSufficient) {
      showToast("La rejilla actual es demasiado pequeña para albergar todas las cámaras.", "error");
      return;
    }

    if (overlapResult.hasOverlap) {
      showToast(`Superposición detectada: Cámara ${overlapResult.camA} y Cámara ${overlapResult.camB} comparten espacio.`, "error");
      return;
    }

    const cellsPayload = cells.map((c) => ({
      gridColumn: c.colSpan > 1 ? `${c.startCol} / span ${c.colSpan}` : String(c.startCol),
      gridRow: c.rowSpan > 1 ? `${c.startRow} / span ${c.rowSpan}` : String(c.startRow),
      isPrimary: c.isPrimary,
    }));

    const default_ratios = {};
    if (cols === 2 || cols === 3) default_ratios.colRatio = colRatio;
    if (cols === 3) default_ratios.colRatio2 = colRatio2;
    if (rows === 2 || rows === 3) default_ratios.rowRatio = rowRatio;
    if (rows === 3) default_ratios.rowRatio2 = rowRatio2;

    const generatedLabel = `Rejilla ${cols}x${rows} (${cameraCount} c.)`;

    dispatch(
      createLayout({
        camera_count: cameraCount,
        label: generatedLabel,
        cols,
        rows,
        default_ratios,
        cells: cellsPayload,
      })
    );

    onClose();
  };

  return (
    <Box
      h="100vh"
      w="100vw"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex
        p={4}
        borderBottomWidth="1px"
        borderColor="gray.200"
        justify="space-between"
        align="center"
        bg="white"
        shadow="sm"
      >
        <HStack gap={3}>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={onClose}
            aria-label="Volver al VideoWall"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Center
            p={2}
            borderRadius="xl"
            bg="blue.50"
            color="blue.600"
          >
            <Layout size={20} />
          </Center>
          <VStack align="stretch" gap={0}>
            <Text fontWeight="bold" fontSize="md" color="gray.800">
              Creador Visual de Diseños
            </Text>
            <Text fontSize="2xs" color="gray.500">
              Crea esquemas de rejilla a medida para organizar tus flujos de cámaras
            </Text>
          </VStack>
        </HStack>
        <HStack gap={2}>
          <Button size="sm" variant="ghost" colorPalette="gray" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            colorPalette="blue"
            variant="solid"
            onClick={handleSave}
            disabled={!isGridSizeSufficient}
            opacity={!isGridSizeSufficient ? 0.6 : 1}
          >
            Guardar Diseño
          </Button>
        </HStack>
      </Flex>

      <Box flex="1" overflowY="auto" p={6}>
        <Flex gap={6} flexDirection={{ base: "column", lg: "row" }} h="full" maxW="7xl" mx="auto">
          <VStack align="stretch" gap={4} w={{ base: "100%", lg: "30%" }}>
            <Box
              p={4}
              bg="white"
              borderColor="gray.200"
              borderWidth="1px"
              borderRadius="xl"
              shadow="sm"
              maxH="600px"
              overflowY="auto"
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={3} textTransform="uppercase">
                Diseños Personalizados
              </Text>
              
              {customLayouts.length === 0 ? (
                <Text fontSize="2xs" color="gray.500" fontStyle="italic" py={2}>
                  No hay diseños personalizados creados.
                </Text>
              ) : (
                <VStack gap={2} align="stretch">
                  {customLayouts.map((layout) => (
                    <Flex
                      key={layout.id}
                      p={3}
                      bg="gray.50"
                      borderColor="gray.200"
                      borderWidth="1px"
                      borderRadius="lg"
                      justify="space-between"
                      align="center"
                      transition="all 0.2s"
                      _hover={{ bg: "gray.100" }}
                    >
                      <VStack align="start" gap={0}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.700">
                          {layout.label}
                        </Text>
                        <Text fontSize="5xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                          {layout.cameraCount} cámaras • {layout.cols}x{layout.rows}
                        </Text>
                      </VStack>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDeleteLayout(layout.id)}
                        aria-label="Eliminar diseño"
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>

          <VStack align="stretch" gap={4} flex={1}>
            <Box
              p={6}
              bg="white"
              borderColor="gray.200"
              borderWidth="1px"
              borderRadius="xl"
              display="flex"
              flexDirection="column"
              h="100%"
              minH="600px"
              shadow="sm"
            >
              <Flex
                justifyContent="space-between"
                alignItems="center"
                borderBottomWidth="1px"
                borderColor="gray.100"
                pb={4}
                mb={4}
                flexDirection={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack align="stretch" gap={0}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">
                    Configuración y Lienzo
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Rejilla Interactiva de {rows} x {cols}
                  </Text>
                </VStack>

                <HStack gap={4} width={{ base: "100%", md: "auto" }} flexWrap="wrap" alignItems="flex-end">
                  <HStack gap={3}>
                    <Box w="80px">
                      <Text fontSize="2xs" fontWeight="semibold" mb={1} color="gray.600">
                        Cámaras
                      </Text>
                      <Select.Root
                        size="sm"
                        collection={cameraCountCollection}
                        value={[String(cameraCount)]}
                        onValueChange={(e) => handleCameraCountChange(Number(e.value[0]))}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger bg="white" borderColor="gray.300" borderRadius="md">
                            <Select.ValueText />
                          </Select.Trigger>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content bg="white" borderColor="gray.200" shadow="md" borderRadius="lg" zIndex={2100}>
                            {cameraCountCollection.items.map((item) => (
                              <Select.Item item={item} key={item.value} _hover={{ bg: "gray.50" }}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>

                    <Box w="80px">
                      <Text fontSize="2xs" fontWeight="semibold" mb={1} color="gray.600">
                        Columnas
                      </Text>
                      <Select.Root
                        size="sm"
                        collection={colsCollection}
                        value={[String(cols)]}
                        onValueChange={(e) => handleColsChange(Number(e.value[0]))}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger bg="white" borderColor="gray.300" borderRadius="md">
                            <Select.ValueText />
                          </Select.Trigger>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content bg="white" borderColor="gray.200" shadow="md" borderRadius="lg" zIndex={2100}>
                            {colsCollection.items.map((item) => (
                              <Select.Item item={item} key={item.value} _hover={{ bg: "gray.50" }}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>

                    <Box w="80px">
                      <Text fontSize="2xs" fontWeight="semibold" mb={1} color="gray.600">
                        Filas
                      </Text>
                      <Select.Root
                        size="sm"
                        collection={rowsCollection}
                        value={[String(rows)]}
                        onValueChange={(e) => handleRowsChange(Number(e.value[0]))}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger bg="white" borderColor="gray.300" borderRadius="md">
                            <Select.ValueText />
                          </Select.Trigger>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content bg="white" borderColor="gray.200" shadow="md" borderRadius="lg" zIndex={2100}>
                            {rowsCollection.items.map((item) => (
                              <Select.Item item={item} key={item.value} _hover={{ bg: "gray.50" }}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>
                  </HStack>

                  <Box>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="gray"
                      onClick={handleResetRatios}
                    >
                      <RotateCcw size={14} style={{ marginRight: "4px" }} />
                      Restablecer
                    </Button>
                  </Box>
                </HStack>
              </Flex>

              <Box
                ref={boardRef}
                flex={1}
                position="relative"
                bg="gray.50"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="lg"
                overflow="hidden"
                p={2}
                userSelect="none"
              >
                <Grid
                  templateColumns={
                    cols === 2
                      ? `${colRatio}% ${100 - colRatio}%`
                      : cols === 3
                      ? `${colRatio}% ${colRatio2 - colRatio}% ${100 - colRatio2}%`
                      : `repeat(${cols}, 1fr)`
                  }
                  templateRows={
                    rows === 2
                      ? `${rowRatio}% ${100 - rowRatio}%`
                      : rows === 3
                      ? `${rowRatio}% ${rowRatio2 - rowRatio}% ${100 - rowRatio2}%`
                      : `repeat(${rows}, 1fr)`
                  }
                  gap="4px"
                  h="100%"
                  w="100%"
                  position="relative"
                >
                  {Array.from({ length: rows * cols }).map((_, idx) => {
                    const col = (idx % cols) + 1;
                    const row = Math.floor(idx / cols) + 1;
                    return (
                      <Box
                        key={`empty-${row}-${col}`}
                        gridColumn={String(col)}
                        gridRow={String(row)}
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor="gray.200"
                        borderRadius="sm"
                        bg="white"
                        _hover={{
                          bg: "blue.50",
                          cursor: "pointer",
                        }}
                        onClick={() => handleVisualCellClick(row, col)}
                      />
                    );
                  })}

                  {cells.map((cell, idx) => {
                    const isSelected = idx === selectedCamIdx;
                    return (
                      <Box
                        key={`cam-box-${idx}`}
                        gridColumn={
                          cell.colSpan > 1 ? `${cell.startCol} / span ${cell.colSpan}` : String(cell.startCol)
                        }
                        gridRow={
                          cell.rowSpan > 1 ? `${cell.startRow} / span ${cell.rowSpan}` : String(cell.startRow)
                        }
                        bg={isSelected ? "blue.500" : "gray.100"}
                        border="2px solid"
                        borderColor={isSelected ? "blue.600" : "gray.300"}
                        borderRadius="md"
                        p={2}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        zIndex={10}
                        cursor="move"
                        position="relative"
                        onMouseDown={(e) => handleMouseDown(e, idx, "move")}
                        _hover={{
                          borderColor: "blue.400",
                          bg: isSelected ? "blue.600" : undefined,
                        }}
                      >
                        <VStack gap={0} pointerEvents="none">
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color={isSelected ? "white" : "gray.700"}
                            textAlign="center"
                          >
                            Cámara {idx + 1}
                          </Text>
                        </VStack>

                        <Box
                          mt={2}
                          pointerEvents="auto"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <select
                            value={idx + 1}
                            onChange={(e) => handleSwapCameras(idx, Number(e.target.value) - 1)}
                            style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.05)",
                              color: isSelected ? "white" : "#2D3748",
                              border: "1px solid",
                              borderColor: isSelected ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.15)",
                              borderRadius: "6px",
                              padding: "2px 8px 2px 6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                          >
                            {Array.from({ length: cameraCount }, (_, cIdx) => (
                              <option
                                key={cIdx}
                                value={cIdx + 1}
                                style={{
                                  color: "black",
                                  backgroundColor: "white",
                                }}
                              >
                                Cámara {cIdx + 1}
                              </option>
                            ))}
                          </select>
                        </Box>

                        {isSelected && (
                          <>
                            <Box
                              position="absolute"
                              right="-2px"
                              top={0}
                              bottom={0}
                              w="8px"
                              cursor="col-resize"
                              zIndex={15}
                              bg="transparent"
                              transition="background 0.2s"
                              _hover={{ bg: "blue.400", opacity: 0.8 }}
                              onMouseDown={(e) => handleMouseDown(e, idx, "resize-col")}
                            />

                            <Box
                              position="absolute"
                              bottom="-2px"
                              left={0}
                              right={0}
                              h="8px"
                              cursor="row-resize"
                              zIndex={15}
                              bg="transparent"
                              transition="background 0.2s"
                              _hover={{ bg: "blue.400", opacity: 0.8 }}
                              onMouseDown={(e) => handleMouseDown(e, idx, "resize-row")}
                            />

                            <Box
                              position="absolute"
                              bottom="2px"
                              right="2px"
                              w="10px"
                              h="10px"
                              cursor="nwse-resize"
                              zIndex={20}
                              bg="blue.500"
                              borderRadius="full"
                              border="2px solid white"
                              boxShadow="sm"
                              transition="transform 0.2s, background 0.2s"
                              _hover={{ bg: "blue.600", transform: "scale(1.2)" }}
                              onMouseDown={(e) => handleMouseDown(e, idx, "resize-both")}
                            />
                          </>
                        )}
                      </Box>
                    );
                  })}
                </Grid>

                {(cols === 2 || cols === 3) && (
                  <Box
                    position="absolute"
                    left={`${colRatio}%`}
                    top={0}
                    bottom={0}
                    w="8px"
                    ml="-4px"
                    cursor="col-resize"
                    zIndex={25}
                    bg="rgba(0, 0, 0, 0.03)"
                    onMouseDown={(e) => handleDividerMouseDown(e, "col", 1)}
                    _hover={{ bg: "blue.500", opacity: 0.5 }}
                    transition="background 0.2s"
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
                    zIndex={25}
                    bg="rgba(0, 0, 0, 0.03)"
                    onMouseDown={(e) => handleDividerMouseDown(e, "col", 2)}
                    _hover={{ bg: "blue.500", opacity: 0.5 }}
                    transition="background 0.2s"
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
                    zIndex={25}
                    bg="rgba(0, 0, 0, 0.03)"
                    onMouseDown={(e) => handleDividerMouseDown(e, "row", 1)}
                    _hover={{ bg: "blue.500", opacity: 0.5 }}
                    transition="background 0.2s"
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
                    zIndex={25}
                    bg="rgba(0, 0, 0, 0.03)"
                    onMouseDown={(e) => handleDividerMouseDown(e, "row", 2)}
                    _hover={{ bg: "blue.500", opacity: 0.5 }}
                    transition="background 0.2s"
                  />
                )}
              </Box>

              <Text fontSize="2xs" color="gray.500" mt={2} textAlign="center">
                Instrucciones: Haz clic sobre cualquier cámara para seleccionarla. Haz clic y arrastra el centro de la cámara para moverla. Arrastra los bordes derecho/inferior o la esquina inferior derecha para cambiar su ancho y alto.
              </Text>
            </Box>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default VideoWallEditor;
