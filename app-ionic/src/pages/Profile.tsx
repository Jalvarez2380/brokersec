import React, { useEffect, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/react";
import { camera, locate, pulse, save, trash } from "ionicons/icons";
import { cameraService, EvidencePhoto } from "../services/camera.service";
import { evidenceData } from "../storage";
import { authService } from "../services/auth.service";
import { ROLE_LABELS } from "../constants/roles";
import { CapturedLocation, locationService, LocationWatcher } from "../services/location.service";
import { createInspection } from "../services/inspection.service";

interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedula: string;
  usuario: string;
  role?: string;
}

interface EvidenceState {
  front?: EvidencePhoto;
  rear?: EvidencePhoto;
  leftSide?: EvidencePhoto;
  rightSide?: EvidencePhoto;
  dashboard?: EvidencePhoto;
  document?: EvidencePhoto;
  registration?: EvidencePhoto;
  license?: EvidencePhoto;
}

function formatLocation(location: CapturedLocation | null): string {
  if (!location) return "Ubicacion no capturada";

  const accuracy =
    typeof location.accuracy === "number"
      ? `Precision aprox. ${location.accuracy.toFixed(0)} m`
      : "Precision no disponible";

  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} | ${accuracy}`;
}

const Profile: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [evidence, setEvidence] = useState<EvidenceState>({});
  const [capturingType, setCapturingType] = useState<keyof EvidenceState | null>(null);
  const [inspectionLocation, setInspectionLocation] = useState<CapturedLocation | null>(null);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [watcherId, setWatcherId] = useState<LocationWatcher | null>(null);
  const [savingInspection, setSavingInspection] = useState(false);
  const [lastInspectionId, setLastInspectionId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [error, setError] = useState("");

  const evidenceItems: Array<{
    key: keyof EvidenceState;
    title: string;
    subtitle: string;
    photo?: EvidencePhoto;
  }> = [
    { key: "front", title: "Foto frontal", subtitle: "Parte delantera del vehiculo", photo: evidence.front },
    { key: "rear", title: "Foto trasera", subtitle: "Parte trasera del vehiculo", photo: evidence.rear },
    { key: "leftSide", title: "Lado izquierdo", subtitle: "Vista lateral izquierda", photo: evidence.leftSide },
    { key: "rightSide", title: "Lado derecho", subtitle: "Vista lateral derecha", photo: evidence.rightSide },
    { key: "dashboard", title: "Foto del tablero", subtitle: "Interior y tablero del vehiculo", photo: evidence.dashboard },
    { key: "document", title: "Foto de la cedula", subtitle: "Documento del titular", photo: evidence.document },
    { key: "registration", title: "Foto de la matricula", subtitle: "Documento de matricula vehicular", photo: evidence.registration },
    { key: "license", title: "Foto de la licencia", subtitle: "Licencia de conducir", photo: evidence.license },
  ];

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.user();
      if (!currentUser) return;

      setUsuario({
        id: currentUser.id,
        nombre: (currentUser as any).firstName || currentUser.name?.split(" ")?.[0] || "",
        apellido:
          (currentUser as any).lastName ||
          (typeof currentUser.name === "string" ? currentUser.name.split(" ").slice(1).join(" ") : ""),
        email: currentUser.email || "",
        telefono: (currentUser as any).mobile || "",
        cedula: currentUser.dni || "",
        usuario: currentUser.username,
        role: currentUser.role,
      });
    };

    const loadEvidence = async () => {
      try {
        setEvidence(await evidenceData.get());
      } catch (storageError) {
        console.error("Error cargando evidencia:", storageError);
      }
    };

    loadUser();
    loadEvidence();
  }, []);

  useEffect(() => {
    return () => {
      if (watcherId !== null) {
        locationService.clearWatch(watcherId);
      }
    };
  }, [watcherId]);

  const showFeedback = (message: string, color = "success") => {
    setToastMsg(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleCaptureEvidence = async (type: keyof EvidenceState) => {
    setCapturingType(type);
    try {
      const photo = await cameraService.takeEvidencePhoto(type);
      const updatedEvidence = await evidenceData.savePhoto(photo);
      setEvidence(updatedEvidence);
      showFeedback(`${photo.label} capturada correctamente.`);
    } catch (captureError) {
      const message =
        captureError instanceof Error
          ? captureError.message
          : "No se pudo capturar la evidencia.";
      showFeedback(message, "danger");
    } finally {
      setCapturingType(null);
    }
  };

  const handleRemoveEvidence = async (type: keyof EvidenceState) => {
    try {
      const updatedEvidence = await evidenceData.removePhoto(type);
      setEvidence(updatedEvidence);
      showFeedback("Evidencia eliminada.");
    } catch {
      showFeedback("No se pudo eliminar la evidencia.", "danger");
    }
  };

  const handleCaptureLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setInspectionLocation(location);
      showFeedback("Ubicacion capturada correctamente.");
    } catch (captureError) {
      const message =
        captureError instanceof Error
          ? captureError.message
          : "No se pudo capturar la ubicacion.";
      showFeedback(message, "danger");
    }
  };

  const toggleLocationTracking = async () => {
    if (trackingLocation) {
      if (watcherId !== null) {
        locationService.clearWatch(watcherId);
      }
      setWatcherId(null);
      setTrackingLocation(false);
      showFeedback("Seguimiento de ubicacion detenido.", "medium");
      return;
    }

    try {
      const initialLocation = await locationService.getCurrentLocation();
      setInspectionLocation(initialLocation);

      const nextWatcherId = locationService.watchLocation(
        (location) => setInspectionLocation(location),
        (message) => showFeedback(message, "danger"),
      );

      setWatcherId(nextWatcherId);
      setTrackingLocation(true);
      showFeedback("Seguimiento de ubicacion activado.");
    } catch (trackingError) {
      const message =
        trackingError instanceof Error
          ? trackingError.message
          : "No se pudo iniciar el seguimiento de ubicacion.";
      showFeedback(message, "danger");
    }
  };

  const handleSaveInspection = async () => {
    setError("");

    if (!usuario?.id) {
      setError("No se pudo identificar al usuario actual.");
      return;
    }

    const availableEvidence = [
      evidence.front,
      evidence.rear,
      evidence.leftSide,
      evidence.rightSide,
      evidence.dashboard,
      evidence.document,
      evidence.registration,
      evidence.license,
    ].filter(Boolean);

    if (availableEvidence.length === 0) {
      setError("Debes capturar al menos una evidencia para guardar la inspeccion.");
      return;
    }

    try {
      setSavingInspection(true);

      const inspection = await createInspection({
        userId: usuario.id,
        status: "pending",
        notes: "Inspeccion digital registrada desde la app movil.",
        location: inspectionLocation,
        evidences: availableEvidence.map((photo) => ({
          type: photo!.type,
          label: photo!.label,
          dataUrl: photo!.dataUrl,
          metadata: {
            createdAt: photo!.createdAt,
          },
        })),
      });

      setLastInspectionId(inspection?.id || null);
      showFeedback("Inspeccion guardada en PostgreSQL.");
    } catch (saveError: any) {
      setError(saveError?.message || "No se pudo guardar la inspeccion.");
    } finally {
      setSavingInspection(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Inspeccion BROKERSEC</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3000}
          color={toastColor}
          position="top"
        />

        {usuario && (
          <div style={{ padding: "14px 16px 0" }}>
            <IonCard style={{ margin: 0, background: "#e8f0fe", borderRadius: 10 }}>
              <IonCardContent style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: 15, margin: 0 }}>
                      {usuario.nombre} {usuario.apellido}
                    </p>
                    <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>{usuario.email}</p>
                    <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{usuario.telefono}</p>
                  </div>
                  <IonBadge color="success" style={{ fontSize: 11 }}>
                    {ROLE_LABELS[usuario.role || "usuario"] || "Usuario"}
                  </IonBadge>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <div style={{ padding: "14px 16px 24px" }}>
          <IonCard style={{ margin: 0, borderRadius: 12, border: "2px dashed #34a853" }}>
            <IonCardHeader style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonIcon icon={camera} style={{ color: "#34a853", fontSize: 20 }} />
                <IonCardTitle style={{ fontSize: 16, color: "#137333" }}>
                  Inspeccion digital del vehiculo
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ fontSize: 12, color: "#555", marginTop: 0 }}>
                Captura la evidencia visual requerida y guarda la inspeccion en la base de datos.
              </p>

              <div
                style={{
                  background: "#eef6ff",
                  border: "1px solid #d8e8ff",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontWeight: "bold", color: "#1a73e8", margin: "0 0 6px" }}>
                  Ubicacion de la inspeccion
                </p>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px" }}>
                  Guarda la ubicacion actual o activa seguimiento en tiempo real para registrar donde se realiza la inspeccion.
                </p>
                <p style={{ fontSize: 12, margin: "0 0 10px" }}>{formatLocation(inspectionLocation)}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <IonButton size="small" onClick={handleCaptureLocation}>
                    <IonIcon icon={locate} slot="start" />
                    Capturar ubicacion
                  </IonButton>
                  <IonButton
                    size="small"
                    fill={trackingLocation ? "solid" : "outline"}
                    color={trackingLocation ? "success" : "medium"}
                    onClick={toggleLocationTracking}
                  >
                    <IonIcon icon={pulse} slot="start" />
                    {trackingLocation ? "Detener seguimiento" : "Tiempo real"}
                  </IonButton>
                </div>
              </div>

              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  {evidenceItems.map((item) => (
                    <IonCol size="12" sizeMd="6" key={item.key}>
                      <div
                        style={{
                          background: "#f8fff9",
                          border: "1px solid #d2f0d9",
                          borderRadius: 12,
                          padding: 12,
                          minHeight: 260,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: "bold", margin: "0 0 4px", color: "#137333" }}>{item.title}</p>
                          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{item.subtitle}</p>
                        </div>

                        {item.photo ? (
                          <img
                            src={item.photo.dataUrl}
                            alt={item.title}
                            style={{
                              width: "100%",
                              height: 140,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #cde7d1",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 140,
                              borderRadius: 10,
                              border: "1px dashed #b7dabb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#7a7a7a",
                              fontSize: 12,
                              textAlign: "center",
                              padding: 12,
                            }}
                          >
                            Aun no hay evidencia capturada
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8 }}>
                          <IonButton
                            expand="block"
                            onClick={() => handleCaptureEvidence(item.key)}
                            disabled={capturingType !== null}
                            style={{ flex: 1, margin: 0 }}
                          >
                            {capturingType === item.key ? <IonSpinner name="crescent" /> : <IonIcon icon={camera} slot="start" />}
                            {item.photo ? "Repetir foto" : "Tomar foto"}
                          </IonButton>
                          {item.photo && (
                            <IonButton
                              color="medium"
                              fill="outline"
                              onClick={() => handleRemoveEvidence(item.key)}
                              disabled={capturingType !== null}
                              style={{ margin: 0 }}
                            >
                              <IonIcon icon={trash} />
                            </IonButton>
                          )}
                        </div>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>

              {error && (
                <IonText color="danger">
                  <p style={{ fontSize: 12, margin: "12px 0 0" }}>{error}</p>
                </IonText>
              )}

              {lastInspectionId && (
                <IonText color="success">
                  <p style={{ fontSize: 12, margin: "12px 0 0" }}>
                    Ultima inspeccion guardada con ID #{lastInspectionId}.
                  </p>
                </IonText>
              )}

              <IonButton expand="block" style={{ marginTop: 16 }} onClick={handleSaveInspection} disabled={savingInspection}>
                <IonIcon icon={save} slot="start" />
                {savingInspection ? "Guardando inspeccion..." : "Guardar inspeccion"}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
