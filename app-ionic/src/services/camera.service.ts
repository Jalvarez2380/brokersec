import {
  Camera,
  CameraPermissionState,
  CameraResultType,
  CameraSource,
  PermissionStatus,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export type EvidencePhotoType = "vehicle" | "document";

export interface EvidencePhoto {
  type: EvidencePhotoType;
  label: string;
  dataUrl: string;
  createdAt: string;
}

const LABELS: Record<EvidencePhotoType, string> = {
  vehicle: "Foto del vehiculo",
  document: "Foto de la cedula",
};

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

async function takeEvidencePhoto(type: EvidencePhotoType): Promise<EvidencePhoto> {
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

  return {
    type,
    label: LABELS[type],
    dataUrl: photo.dataUrl,
    createdAt: new Date().toISOString(),
  };
}

export const cameraService = {
  ensurePermissions,
  takeEvidencePhoto,
};
