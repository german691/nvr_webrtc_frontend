import { useState, useRef } from "react";

/**
 * Hook de React para manejar la grabación de video en vivo (localmente) desde un elemento HTMLVideoElement.
 * Soporta almacenamiento directo a disco mediante File System Access API (si está disponible)
 * o descarga en diferido mediante buffers en memoria RAM.
 * 
 * @returns {object} Estados y controladores de grabación.
 */
export const useLocalRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const fileStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async (videoRef) => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    const stream = videoRef.current.srcObject;
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    // Plan A: Escritura directa a disco mediante showSaveFilePicker (soportado en Chromium)
    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `Evidencia_NVR_${new Date().getTime()}.webm`,
          types: [
            {
              description: "Video H.264 (WebM)",
              accept: { "video/webm": [".webm"] },
            },
          ],
        });

        const writableStream = await fileHandle.createWritable();
        fileStreamRef.current = writableStream;

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && fileStreamRef.current) {
            await fileStreamRef.current.write(e.data);
          }
        };

        recorder.onstop = async () => {
          if (fileStreamRef.current) {
            await fileStreamRef.current.close();
            fileStreamRef.current = null;
          }
        };

        recorder.start(1000);
        setIsRecording(true);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn(
          "No se pudo usar acceso directo a disco. Pasando a Plan B (RAM)...",
        );
      }
    }

    // Plan B: Acumular en memoria RAM (Descarga tradicional tras detener la grabación)
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = `Evidencia_NVR_${new Date().getTime()}.webm`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
      chunksRef.current = [];
    };

    recorder.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};

export default useLocalRecorder;
