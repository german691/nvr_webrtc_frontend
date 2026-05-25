import { Box } from "@chakra-ui/react";
import gridPresets from "./gridPresets.json";

/**
 * Obtiene la lista de opciones de diseño válidas para una cantidad específica de cámaras.
 * Lee dinámicamente de gridPresets.json.
 * 
 * @param {number} num - Cantidad de cámaras activas.
 * @returns {Array<{key: string, label: string}>} Lista de opciones.
 */
export const getLayoutOptions = (num) => {
  const layouts = gridPresets[String(num)];
  if (!layouts) return [];
  return Object.keys(layouts).map((key) => ({
    key,
    label: layouts[key].label || `Diseño ${key}`,
  }));
};

/**
 * Retorna las dimensiones de rejilla (columnas y filas) para una cantidad y diseño.
 * Si no está definido en el preset, calcula una rejilla uniforme.
 * 
 * @param {number} num - Cantidad de cámaras activas.
 * @param {string} layout - Identificador del diseño.
 * @returns {{cols: number, rows: number}} Dimensiones de la rejilla.
 */
export const getGridDimensions = (num, layout) => {
  const preset = gridPresets[String(num)]?.[layout];
  if (preset) {
    return { cols: preset.cols, rows: preset.rows };
  }
  // Fallback matemático para rejilla uniforme uniforme
  if (num <= 1) return { cols: 1, rows: 1 };
  const cols = Math.ceil(Math.sqrt(num));
  const rows = Math.ceil(num / cols);
  return { cols, rows };
};

/**
 * Obtiene los ratios iniciales de redimensionamiento de fila/columna por defecto.
 * 
 * @param {number} num - Cantidad de cámaras activas.
 * @param {string} layout - Identificador del diseño.
 * @returns {{colRatio: number, colRatio2: number, rowRatio: number, rowRatio2: number}} Ratios iniciales.
 */
export const getDefaultRatios = (num, layout) => {
  const { cols: activeCols, rows: activeRows } = getGridDimensions(num, layout);

  // Valores equitativos por defecto según cantidad de columnas y filas
  let defCol = activeCols === 3 ? 33.33 : 50;
  let defCol2 = 66.66;
  let defRow = activeRows === 3 ? 33.33 : 50;
  let defRow2 = 66.66;

  const preset = gridPresets[String(num)]?.[layout];
  if (preset && preset.defaultRatios) {
    const r = preset.defaultRatios;
    return {
      colRatio: r.colRatio !== undefined ? r.colRatio : defCol,
      colRatio2: r.colRatio2 !== undefined ? r.colRatio2 : defCol2,
      rowRatio: r.rowRatio !== undefined ? r.rowRatio : defRow,
      rowRatio2: r.rowRatio2 !== undefined ? r.rowRatio2 : defRow2,
    };
  }

  return {
    colRatio: defCol,
    colRatio2: defCol2,
    rowRatio: defRow,
    rowRatio2: defRow2,
  };
};

/**
 * Retorna las coordenadas de área CSS grid ({ gridColumn, gridRow }) para un elemento visual.
 * 
 * @param {number} visualIdx - Posición del elemento en la lista ordenada.
 * @param {number} num - Cantidad de cámaras activas.
 * @param {string} layout - Identificador del diseño.
 * @returns {{gridColumn: string, gridRow: string}} Coordenadas CSS grid.
 */
export const getGridAreaProps = (visualIdx, num, layout) => {
  if (num <= 1) {
    return { gridColumn: "1", gridRow: "1" };
  }

  const preset = gridPresets[String(num)]?.[layout];
  if (preset && preset.cells && preset.cells[visualIdx]) {
    const cell = preset.cells[visualIdx];
    return {
      gridColumn: cell.gridColumn,
      gridRow: cell.gridRow,
    };
  }

  // Fallback: calcular coordenadas para cuadrícula matemática uniforme
  const { cols } = getGridDimensions(num, layout);
  const col = (visualIdx % cols) + 1;
  const row = Math.floor(visualIdx / cols) + 1;
  return {
    gridColumn: String(col),
    gridRow: String(row),
  };
};

/**
 * Genera el diagrama miniatura interactivo del diseño seleccionado en base a los metadatos.
 * 
 * @param {number} num - Cantidad de cámaras activas.
 * @param {string} layout - Identificador del diseño.
 * @returns {React.ReactElement} Componente visual.
 */
export const renderLayoutShape = (num, layout) => {
  const preset = gridPresets[String(num)]?.[layout];

  let cells;
  let dCols;
  let dRows;

  if (preset) {
    dCols = preset.cols;
    dRows = preset.rows;
    cells = preset.cells.map((c) => ({
      col: c.gridColumn,
      row: c.gridRow,
      bg: c.isPrimary ? "blue.500" : "gray.300",
    }));
  } else {
    // Fallback dinámico para rejilla uniforme uniforme
    const dims = getGridDimensions(num, layout);
    dCols = dims.cols;
    dRows = dims.rows;
    cells = Array.from({ length: num }, (_, idx) => {
      const col = (idx % dCols) + 1;
      const row = Math.floor(idx / dCols) + 1;
      return {
        col: String(col),
        row: String(row),
        bg: "gray.300",
      };
    });
  }

  const shapeBg = "rgba(15, 23, 42, 0.04)";
  const shapeBorderColor = "gray.200";

  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${dCols}, 1fr)`}
      gridTemplateRows={`repeat(${dRows}, 1fr)`}
      gap="2px"
      w="54px"
      h="38px"
      bg={shapeBg}
      p="2px"
      borderRadius="sm"
      border="1px solid"
      borderColor={shapeBorderColor}
    >
      {cells.map((c, idx) => (
        <Box
          key={idx}
          gridColumn={c.col}
          gridRow={c.row}
          bg={c.bg}
          borderRadius="1px"
          opacity={0.85}
        />
      ))}
    </Box>
  );
};
