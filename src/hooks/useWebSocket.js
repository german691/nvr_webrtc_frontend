import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  fetchCamerasForNode,
  updateNodeStatus,
  setInitialNodeStatuses,
} from "../store/slices/cameraSlice";

const getWebSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  
  if (envUrl) {
    try {
      // Si la URL empieza con /api (relativa en producción)
      if (envUrl.startsWith("/")) {
        return `${protocol}//${window.location.host}/ws/client`;
      }
      const urlObj = new URL(envUrl);
      let host = urlObj.host; // e.g. "localhost:3000"
      if (typeof window !== "undefined" && window.location && window.location.hostname) {
        const currentHost = window.location.hostname;
        if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
          host = host.replace(/localhost|127\.0\.0\.1/, currentHost);
        }
      }
      return `${urlObj.protocol === "https:" ? "wss:" : "ws:"}//${host}/ws/client`;
    } catch (e) {
      console.warn("Failed to parse VITE_API_URL for WebSocket, fallback to window.location:", e);
    }
  }
  return `${protocol}//${window.location.host}/ws/client`;
};

export const useWebSocket = (enabled = true) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const connect = () => {
      const wsUrl = getWebSocketUrl();
      console.log(`[WS Client] Conectando a: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[WS Client] Conexión WebSocket establecida con el servidor central.");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[WS Client] Mensaje recibido:", message);

          switch (message.type) {
            case "initial_status":
              dispatch(setInitialNodeStatuses(message.status));
              break;

            case "node_status":
              dispatch(updateNodeStatus({ nodeIp: message.nodeIp, status: message.status }));
              if (message.status === "online") {
                // Al volver online, recargar dinámicamente las cámaras del nodo
                dispatch(fetchCamerasForNode(message.nodeIp));
              }
              break;

            case "agent_event":
              if (message.event === "camera_lost" || message.event === "camera_found") {
                console.log(`[WS Client] Evento USB detectado en ${message.nodeIp}: ${message.event}. Recargando cámaras.`);
                dispatch(fetchCamerasForNode(message.nodeIp));
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("[WS Client] Error parseando mensaje de WebSocket:", err);
        }
      };

      ws.onclose = (event) => {
        console.log(`[WS Client] Conexión WebSocket cerrada: ${event.reason || "Sin razón específica"}. Reintentando en 3s...`);
        socketRef.current = null;
        
        // Reintentar conexión después de 3 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WS Client] Error en WebSocket:", err);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dispatch, enabled]);
};
