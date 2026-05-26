import { useState } from "react";
import { cameraApi } from "../api/camera.api";

/**
 * Hook de negocio para el flujo de cambio de contraseña obligatoria.
 * 
 * @param {function} onPasswordChanged - Callback invocado tras la actualización exitosa.
 * @returns {object} Estados y controladores para la vista.
 */
export const useChangePassword = (onPasswordChanged) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError(null);

    // Validaciones básicas de presentación y negocio
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Por favor, complete ambos campos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await cameraApi.changePassword(newPassword);
      if (response && response.status === "success" && response.token) {
        setSuccess(true);
        // Esperar un breve instante para mostrar la animación de éxito antes de transicionar
        setTimeout(() => {
          onPasswordChanged(response.token);
        }, 1200);
      } else {
        setError(response.message || "Error al actualizar la contraseña.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err.response?.data?.message ||
          "Ocurrió un error al intentar cambiar la contraseña.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    setError,
    success,
    handleSubmit,
  };
};

export default useChangePassword;
