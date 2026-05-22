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
