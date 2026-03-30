import {
  Camera,
  CameraPermissionState,
  CameraResultType,
  CameraSource,
  PermissionStatus,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export type EvidencePhotoType =
  | "front"
  | "rear"
  | "leftSide"
  | "rightSide"
  | "dashboard"
  | "document"
  | "registration"
  | "license";

export interface EvidencePhoto {
  type: EvidencePhotoType;
  label: string;
  dataUrl: string;
  createdAt: string;
}

const LABELS: Record<EvidencePhotoType, string> = {
  front: "Foto frontal del vehiculo",
  rear: "Foto trasera del vehiculo",
  leftSide: "Foto lateral izquierda",
  rightSide: "Foto lateral derecha",
  dashboard: "Foto del tablero",
  document: "Foto de la cedula",
  registration: "Foto de la matricula",
  license: "Foto de la licencia",
};

function createEvidencePhoto(type: EvidencePhotoType, dataUrl: string): EvidencePhoto {
  return {
    type,
    label: LABELS[type],
    dataUrl,
    createdAt: new Date().toISOString(),
  };
}

function isGranted(state?: CameraPermissionState) {
  return state === "granted" || state === "limited";
}

async function ensurePermissions() {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  let permissions: PermissionStatus = await Camera.checkPermissions();
  if (isGranted(permissions.camera) && isGranted(permissions.photos)) {
    return true;
  }

  permissions = await Camera.requestPermissions({
    permissions: ["camera", "photos"],
  });

  return isGranted(permissions.camera) && isGranted(permissions.photos);
}

async function pickWebImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.style.display = "none";

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        reject(new Error("No se selecciono ninguna imagen."));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        cleanup();
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("No se pudo leer la imagen seleccionada."));
      };

      reader.onerror = () => {
        cleanup();
        reject(new Error("Error al leer la imagen seleccionada."));
      };

      reader.readAsDataURL(file);
    });

    document.body.appendChild(input);
    input.click();
  });
}

async function takeEvidencePhoto(type: EvidencePhotoType): Promise<EvidencePhoto> {
  if (!Capacitor.isNativePlatform()) {
    const dataUrl = await pickWebImage();
    return createEvidencePhoto(type, dataUrl);
  }

  const hasPermissions = await ensurePermissions();
  if (!hasPermissions) {
    throw new Error("Permiso de camara denegado. Habilitalo para capturar evidencia.");
  }

  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    promptLabelHeader: "Selecciona una opcion",
    promptLabelPhoto: "Desde galeria",
    promptLabelPicture: "Tomar foto",
    promptLabelCancel: "Cancelar",
  });

  if (!photo.dataUrl) {
    throw new Error("No se pudo obtener la imagen capturada.");
  }

  return createEvidencePhoto(type, photo.dataUrl);
}

export const cameraService = {
  ensurePermissions,
  takeEvidencePhoto,
};
