export const BITRATES = [
  { label: "Reducido (1 Mbps)", value: "1M" },
  { label: "Fluido Estándar (2 Mbps)", value: "2M" },
  { label: "Alta Definición (4 Mbps)", value: "4M" },
  { label: "Máxima Quirúrgica (10 Mbps)", value: "10M" },
];

export const formatDeviceName = (devPath) => {
  if (!devPath) return "";
  const name = devPath.split("/").pop();
  return `USB Cámera - ${name.replace("video", "video ")}`;
};

/**
 * Filtra y ordena las resoluciones soportadas por una cámara de forma ascendente.
 * @param {Array<object|string>} modes Modos soportados por la cámara
 * @returns {Array<string>} Resoluciones ordenadas de menor a mayor
 */
export const getSortedResolutions = (modes) => {
  if (!modes) return ["1920x1080", "1280x720"];
  const rawResolutions = modes.map((m) =>
    typeof m === "object" ? m.resolution : m
  );

  return [...new Set(rawResolutions)].sort((a, b) => {
    const [wA, hA] = a.trim().split("x").map(Number);
    const [wB, hB] = b.trim().split("x").map(Number);
    return wA - wB || hA - hB;
  });
};

/**
 * Consolida y ordena numéricamente los cuadros por segundo (FPS) válidos de la cámara.
 * @param {Array<object|string>} modes Modos soportados por la cámara
 * @returns {Array<string>} Lista de FPS válidos e independientes como cadenas
 */
export const getSortedFps = (modes) => {
  if (!modes) return ["30", "24", "60"];
  let rawFps = [];
  modes.forEach((m) => {
    if (typeof m === "object" && m.fps) {
      if (Array.isArray(m.fps)) {
        rawFps.push(...m.fps);
      } else {
        rawFps.push(m.fps);
      }
    }
  });

  if (rawFps.length === 0) {
    rawFps = [30, 24, 60];
  }

  return [...new Set(rawFps.map(String))].sort(
    (a, b) => Number(a) - Number(b)
  );
};
