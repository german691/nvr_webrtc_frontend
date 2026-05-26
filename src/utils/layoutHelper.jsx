import { Box } from "@chakra-ui/react";
import gridPresets from "./gridPresets.json";

export const getLayoutOptions = (num, customPresets) => {
  const presets = customPresets && Object.keys(customPresets).length > 0 ? customPresets : gridPresets;
  const layouts = presets[String(num)];
  if (!layouts) return [];
  return Object.keys(layouts).map((key) => ({
    key: Number(key),
    label: layouts[key].label || `Diseño ${key}`,
  }));
};

export const getGridDimensions = (num, layout, customPresets) => {
  const presets = customPresets && Object.keys(customPresets).length > 0 ? customPresets : gridPresets;
  const preset = presets[String(num)]?.[String(layout)];
  if (preset) {
    return { cols: preset.cols, rows: preset.rows };
  }
  if (num <= 1) return { cols: 1, rows: 1 };
  const cols = Math.ceil(Math.sqrt(num));
  const rows = Math.ceil(num / cols);
  return { cols, rows };
};

export const getDefaultRatios = (num, layout, customPresets) => {
  const { cols: activeCols, rows: activeRows } = getGridDimensions(num, layout, customPresets);

  let defCol = activeCols === 3 ? 33.33 : 50;
  let defCol2 = 66.66;
  let defRow = activeRows === 3 ? 33.33 : 50;
  let defRow2 = 66.66;

  const presets = customPresets && Object.keys(customPresets).length > 0 ? customPresets : gridPresets;
  const preset = presets[String(num)]?.[String(layout)];
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

export const getGridAreaProps = (visualIdx, num, layout, customPresets) => {
  if (num <= 1) {
    return { gridColumn: "1", gridRow: "1" };
  }

  const presets = customPresets && Object.keys(customPresets).length > 0 ? customPresets : gridPresets;
  const preset = presets[String(num)]?.[String(layout)];
  if (preset && preset.cells && preset.cells[visualIdx]) {
    const cell = preset.cells[visualIdx];
    return {
      gridColumn: cell.gridColumn,
      gridRow: cell.gridRow,
    };
  }

  const { cols } = getGridDimensions(num, layout, customPresets);
  const col = (visualIdx % cols) + 1;
  const row = Math.floor(visualIdx / cols) + 1;
  return {
    gridColumn: String(col),
    gridRow: String(row),
  };
};

export const renderLayoutShape = (num, layout, customPresets) => {
  const presets = customPresets && Object.keys(customPresets).length > 0 ? customPresets : gridPresets;
  const preset = presets[String(num)]?.[String(layout)];

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
    const dims = getGridDimensions(num, layout, customPresets);
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

export const getGridTemplateStyles = (count, cols, rows, colRatio, colRatio2, rowRatio, rowRatio2) => {
  if (count <= 1) {
    return {
      display: "grid",
      gridTemplateColumns: "100%",
      gridTemplateRows: "100%",
    };
  }

  let gridTemplateColumns;
  let gridTemplateRows;

  if (cols === 2) {
    gridTemplateColumns = `${colRatio}% ${100 - colRatio}%`;
  } else if (cols === 3) {
    gridTemplateColumns = `${colRatio}% ${colRatio2 - colRatio}% ${100 - colRatio2}%`;
  } else {
    gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  if (rows === 2) {
    gridTemplateRows = `${rowRatio}% ${100 - rowRatio}%`;
  } else if (rows === 3) {
    gridTemplateRows = `${rowRatio}% ${rowRatio2 - rowRatio}% ${100 - rowRatio2}%`;
  } else {
    gridTemplateRows = `repeat(${rows}, 1fr)`;
  }

  return {
    display: "grid",
    gridTemplateColumns,
    gridTemplateRows,
  };
};
