import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { cameraApi } from "../api/camera.api.js";
import { fetchCameras } from "../store/slices/cameraSlice";

/**
 * Hook de React para aislar la lógica de depuración de procesos FFmpeg.
 * Administra las llamadas de red para consultar, matar procesos individuales
 * o masivos, copiar la URL RTSP y controlar los estados de UI transicionales.
 * 
 * @param {boolean} isOpen - Estado de visibilidad del modal para auto-refrescar.
 * @param {function} onClose - Callback al cerrar el modal (usado al matar todos los procesos).
 * @returns {object} Estados y controladores de depuración FFmpeg.
 */
export const useFfmpegDebug = (isOpen, onClose) => {
  const dispatch = useDispatch();

  const [debugStreams, setDebugStreams] = useState([]);
  const [isDebuggingLoading, setIsDebuggingLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [expandedCmds, setExpandedCmds] = useState(new Set());
  const [copiedPid, setCopiedPid] = useState(null);
  const [killingPids, setKillingPids] = useState(new Set());

  const fetchFfmpegDebug = async () => {
    setIsDebuggingLoading(true);
    setDebugError(null);
    try {
      const data = await cameraApi.getFfmpegDebug();
      if (data.status === "success") {
        setDebugStreams(data.streams || []);
      } else {
        setDebugError("No se pudo consultar el estado de FFmpeg.");
      }
    } catch (err) {
      setDebugError(
        err.response?.data?.details ||
          err.message ||
          "Error al conectar con el servidor."
      );
    } finally {
      setIsDebuggingLoading(false);
    }
  };

  // Refrescar automáticamente al abrir el visor
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchFfmpegDebug();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKillProcess = async (pid) => {
    setKillingPids((prev) => {
      const next = new Set(prev);
      next.add(pid);
      return next;
    });
    try {
      await cameraApi.killFfmpegProcess(pid);
      dispatch(fetchCameras());
      await fetchFfmpegDebug();
    } catch (err) {
      console.error("Error al matar el proceso:", err);
    } finally {
      setKillingPids((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
    }
  };

  const handleKillAll = async () => {
    setIsDebuggingLoading(true);
    try {
      await cameraApi.killAllFfmpegProcesses();
      if (onClose) onClose();
      dispatch(fetchCameras());
    } catch (err) {
      console.error("Error al matar todos los procesos:", err);
    } finally {
      setIsDebuggingLoading(false);
    }
  };

  const toggleCmd = (pid) => {
    setExpandedCmds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const handleCopy = (url, pid) => {
    navigator.clipboard.writeText(url);
    setCopiedPid(pid);
    setTimeout(() => {
      setCopiedPid(null);
    }, 1500);
  };

  return {
    debugStreams,
    isDebuggingLoading,
    debugError,
    expandedCmds,
    copiedPid,
    killingPids,
    fetchFfmpegDebug,
    handleKillProcess,
    handleKillAll,
    toggleCmd,
    handleCopy,
  };
};

export default useFfmpegDebug;
