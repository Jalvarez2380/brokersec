import React, { useState, useEffect, useRef } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonText, IonToast, IonBadge, IonSpinner,
} from "@ionic/react";
import {
  documentText, mail, print, calculator,
  checkmarkCircle, download, camera, trash, locate, navigate,
} from "ionicons/icons";
import { cameraService, EvidencePhoto } from "../services/camera.service";
import { evidenceData } from "../storage";
import { authService } from "../services/auth.service";
import { createVehicleAndQuote, listMyQuotes, QuoteRecord } from "../services/quote.service";
import { createInspection } from "../services/inspection.service";

interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedula: string;
  usuario: string;
}

interface Vehiculo {
  marca: string;
  modelo: string;
  anio: string;
  valorCasco: string;
  valorExtras: string;
}

const TASA_BASE = 0.0339; // 3.39% del valor asegurado

interface EvidenceState {
  vehicle?: EvidencePhoto;
  document?: EvidencePhoto;
  front?: EvidencePhoto;
  rear?: EvidencePhoto;
  left?: EvidencePhoto;
  right?: EvidencePhoto;
  odometer?: EvidencePhoto;
  extra1?: EvidencePhoto;
  extra2?: EvidencePhoto;
}

interface VehicleLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

type EvidenceGroup = "base" | "inspection" | "extras";

const EVIDENCE_FIELDS: Array<{
  key: keyof EvidenceState;
  title: string;
  subtitle: string;
  group: EvidenceGroup;
}> = [
  { key: "vehicle", title: "Foto del vehiculo", subtitle: "Vista general del auto", group: "base" },
  { key: "document", title: "Foto de la cedula", subtitle: "Documento del titular", group: "base" },
  { key: "front", title: "Vehiculo delantero", subtitle: "Parte frontal", group: "inspection" },
  { key: "rear", title: "Vehiculo trasero", subtitle: "Parte posterior", group: "inspection" },
  { key: "left", title: "Lado izquierdo", subtitle: "Costado izquierdo del vehiculo", group: "inspection" },
  { key: "right", title: "Lado derecho", subtitle: "Costado derecho del vehiculo", group: "inspection" },
  { key: "odometer", title: "Panel kilometraje", subtitle: "Tablero y kilometraje actual", group: "extras" },
  { key: "extra1", title: "Foto extra 1", subtitle: "Accesorio o detalle adicional", group: "extras" },
  { key: "extra2", title: "Foto extra 2", subtitle: "Segunda evidencia extra si aplica", group: "extras" },
];

const EVIDENCE_SECTIONS: Array<{
  group: EvidenceGroup;
  title: string;
  subtitle: string;
}> = [
  { group: "base", title: "Documentos principales", subtitle: "Fotos basicas para identificar el vehiculo y al titular" },
  { group: "inspection", title: "Vistas del vehiculo", subtitle: "Captura los cuatro lados para la inspeccion" },
  { group: "extras", title: "Detalles adicionales", subtitle: "Kilometraje y extras si aplica" },
];

const Profile: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const locationWatchRef = useRef<number | null>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehiculo>({
    marca: "", modelo: "", anio: "", valorCasco: "", valorExtras: "0",
  });
  const [cotizacion, setCotizacion] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<EvidenceState>({});
  const [capturingType, setCapturingType] = useState<keyof EvidenceState | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [locationInfo, setLocationInfo] = useState<VehicleLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [latestQuote, setLatestQuote] = useState<QuoteRecord | null>(null);
  const [savingInspection, setSavingInspection] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.user();
      if (currentUser) {
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
        });
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadEvidence = async () => {
      try {
        const storedEvidence = await evidenceData.get();
        setEvidence(storedEvidence);
      } catch (storageError) {
        console.error("Error cargando evidencia:", storageError);
      }
    };

    const loadLatestQuote = async () => {
      try {
        const quotes = await listMyQuotes();
        setLatestQuote(quotes[0] || null);
      } catch (quoteError) {
        console.warn("No se pudo cargar la ultima cotizacion:", quoteError);
      }
    };

    loadEvidence();
    loadLatestQuote();

    return () => {
      if (locationWatchRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

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
    } catch (storageError) {
      showFeedback("No se pudo eliminar la evidencia.", "danger");
    }
  };

  const updateLocationFromPosition = (position: GeolocationPosition) => {
    setLocationInfo({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp).toLocaleString("es-EC"),
    });
    setLocationError("");
  };

  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Este dispositivo no soporta geolocalizacion.");
      showFeedback("Geolocalizacion no disponible en este dispositivo.", "warning");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationFromPosition(position);
        setLocationLoading(false);
        showFeedback("Ubicacion actual obtenida.", "primary");
      },
      (geoError) => {
        setLocationLoading(false);
        setLocationError("No se pudo obtener la ubicacion. Revisa los permisos de GPS.");
        showFeedback(geoError.message || "No se pudo obtener la ubicacion.", "danger");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleToggleLocationTracking = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Este dispositivo no soporta geolocalizacion.");
      return;
    }

    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
      setLocationTracking(false);
      showFeedback("Seguimiento de ubicacion detenido.", "medium");
      return;
    }

    setLocationTracking(true);
    setLocationLoading(true);
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocationFromPosition(position);
        setLocationLoading(false);
      },
      (geoError) => {
        setLocationLoading(false);
        setLocationTracking(false);
        setLocationError("No se pudo iniciar el seguimiento de ubicacion.");
        if (locationWatchRef.current !== null) {
          navigator.geolocation.clearWatch(locationWatchRef.current);
          locationWatchRef.current = null;
        }
        showFeedback(geoError.message || "No se pudo iniciar el seguimiento.", "danger");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
    showFeedback("Seguimiento de ubicacion activado.", "primary");
  };

  const calcularPrima = async () => {
    setError("");
    if (!vehiculo.marca || !vehiculo.modelo || !vehiculo.anio || !vehiculo.valorCasco) {
      setError("Completa todos los datos del vehiculo.");
      return;
    }
    const casco = parseFloat(vehiculo.valorCasco);
    const extras = parseFloat(vehiculo.valorExtras) || 0;
    if (isNaN(casco) || casco <= 0) {
      setError("Ingresa un valor de casco valido.");
      return;
    }
    const valorAsegurado = casco + extras;
    const primaNeta = valorAsegurado * TASA_BASE;
    const iva = primaNeta * 0.15;
    const primaTotal = primaNeta + iva;
    const cuotaMensual = primaTotal / 6;
    const capturedEvidence = Object.fromEntries(
      EVIDENCE_FIELDS.map((item) => [item.key, !!evidence[item.key]])
    ) as Record<keyof EvidenceState, boolean>;

    try {
      setSavingQuote(true);
      const persisted = await createVehicleAndQuote({
        brand: vehiculo.marca,
        model: vehiculo.modelo,
        year: Number(vehiculo.anio),
        insuredValue: valorAsegurado,
        extrasValue: extras,
        premiumNet: primaNeta,
        taxes: iva,
        totalPremium: primaTotal,
        coveragePlan: "todo-riesgo",
        payload: {
          vehicleMetadata: {
            source: "profile",
            evidenceCaptured: capturedEvidence,
          },
          evidence,
          summary: {
            cuotaMensual,
          },
        },
      });

      setCotizacion({
        id: persisted.quote?.id,
        vehicleId: persisted.vehicle?.id,
        fecha: new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" }),
        usuario,
        vehiculo: { ...vehiculo },
        evidencia: capturedEvidence,
        valorCasco: casco,
        valorExtras: extras,
        valorAsegurado,
        primaNeta: primaNeta.toFixed(2),
        iva: iva.toFixed(2),
        primaTotal: primaTotal.toFixed(2),
        cuotaMensual: cuotaMensual.toFixed(2),
      });
      showFeedback("Cotizacion guardada en PostgreSQL.");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la cotizacion.");
    } finally {
      setSavingQuote(false);
    }
  };

  const handleImprimir = () => {
    const contenido = document.getElementById("cotizacion-print");
    if (!contenido) return;
    const ventana = window.open("", "_blank", "width=900,height=700");
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Cotizacion BROKERSEC</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          body { padding: 30px; color: #000; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center;
            border-bottom: 3px solid #1a73e8; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { color: #1a73e8; font-size: 22px; }
          .header .sub { font-size: 11px; color: #666; }
          .fecha { text-align: right; margin-bottom: 16px; font-size: 12px; }
          .seccion { margin-bottom: 14px; }
          .seccion h3 { background: #1a73e8; color: white; padding: 5px 10px;
            font-size: 12px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          td, th { padding: 5px 8px; border: 1px solid #ddd; font-size: 12px; }
          th { background: #e8f0fe; font-weight: bold; }
          .cobertura-item { padding: 3px 0; font-size: 11px; }
          .cobertura-item::before { content: "✓ "; color: #1a73e8; font-weight: bold; }
          .prima-box { background: #1a73e8; color: white; padding: 12px 16px;
            border-radius: 8px; margin-top: 16px; }
          .prima-box h2 { font-size: 20px; margin-bottom: 4px; }
          .prima-box p { font-size: 12px; opacity: 0.9; }
          .nota { font-size: 10px; color: #888; margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; }
          .pie { text-align: center; margin-top: 20px; font-size: 11px; color: #1a73e8; font-weight: bold; }
        </style>
      </head>
      <body>
        ${contenido.innerHTML}
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); }, 500);
  };

  const handleEmail = () => {
    if (!cotizacion) return;
    const emailDestino = cotizacion.usuario?.email || "";
    const asunto = encodeURIComponent("Cotizacion de Seguro Vehicular - BROKERSEC");
    const cuerpo = encodeURIComponent(
      `Estimado/a ${cotizacion.usuario?.nombre} ${cotizacion.usuario?.apellido},\n\n` +
      `Adjunto el resumen de tu cotizacion de seguro vehicular:\n\n` +
      `DATOS DEL VEHICULO\n` +
      `Marca: ${cotizacion.vehiculo.marca}\n` +
      `Modelo: ${cotizacion.vehiculo.modelo}\n` +
      `Anio: ${cotizacion.vehiculo.anio}\n` +
      `Valor Casco: $${cotizacion.valorCasco.toLocaleString()}\n` +
      `Valor Extras: $${cotizacion.valorExtras.toLocaleString()}\n` +
      `Valor Asegurado: $${cotizacion.valorAsegurado.toLocaleString()}\n\n` +
      `PRIMA\n` +
      `Prima Neta: $${cotizacion.primaNeta}\n` +
      `IVA (15%): $${cotizacion.iva}\n` +
      `PRIMA TOTAL: $${cotizacion.primaTotal}\n` +
      `6 cuotas de: $${cotizacion.cuotaMensual}\n\n` +
      `Cobertura: TODO RIESGO segun condiciones de la poliza\n` +
      `Vigencia: Esta cotizacion es valida por 15 dias.\n\n` +
      `BROKERSEC - Seguros Vehiculares Ecuador\n` +
      `Tel: 02 500 8000\n`
    );
    window.location.href = `mailto:${emailDestino}?subject=${asunto}&body=${cuerpo}`;
    showFeedback("Abriendo cliente de correo...", "primary");
  };

  const handleSaveInspection = async () => {
    if (!latestQuote?.id || !latestQuote.vehicleId) {
      showFeedback("Primero genera una cotizacion en la pestaña Cotizador.", "warning");
      return;
    }

    const evidences = EVIDENCE_FIELDS
      .map((item) => evidence[item.key])
      .filter(Boolean)
      .map((photo) => ({
        type: photo!.type,
        label: photo!.label,
        dataUrl: photo!.dataUrl,
        metadata: {
          createdAt: photo!.createdAt,
        },
      }));

    if (evidences.length === 0) {
      showFeedback("Adjunta al menos una foto antes de guardar la inspeccion.", "warning");
      return;
    }

    try {
      setSavingInspection(true);
      const inspection = await createInspection({
        quoteId: latestQuote.id,
        vehicleId: latestQuote.vehicleId,
        status: "pending",
        notes: "Inspeccion enviada desde la pestaña Perfil para revision del inspector.",
        location: locationInfo
          ? {
              latitude: locationInfo.latitude,
              longitude: locationInfo.longitude,
              accuracy: locationInfo.accuracy,
              timestamp: locationInfo.timestamp,
            }
          : undefined,
        evidences,
      });

      showFeedback(`Inspeccion #${inspection.id} guardada correctamente.`, "success");
    } catch (inspectionError: any) {
      showFeedback(inspectionError?.message || "No se pudo guardar la inspeccion.", "danger");
    } finally {
      setSavingInspection(false);
    }
  };

  const mapEmbedUrl = locationInfo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${locationInfo.longitude - 0.01}%2C${locationInfo.latitude - 0.01}%2C${locationInfo.longitude + 0.01}%2C${locationInfo.latitude + 0.01}&layer=mapnik&marker=${locationInfo.latitude}%2C${locationInfo.longitude}`
    : "";

  const googleMapsUrl = locationInfo
    ? `https://www.google.com/maps?q=${locationInfo.latitude},${locationInfo.longitude}`
    : "";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Cotizador BROKERSEC</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)}
          message={toastMsg} duration={3000} color={toastColor} position="top" />

        {/* Info usuario */}
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
                  <IonBadge color="success" style={{ fontSize: 11 }}>Cliente Activo</IonBadge>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Formulario vehiculo */}
        <div style={{ padding: "14px 16px 0" }}>
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
                Captura evidencia visual para respaldar la cotizacion y facilitar la inspeccion del cliente.
              </p>

              {EVIDENCE_SECTIONS.map((section) => (
                <div key={section.group} style={{ marginBottom: 18 }}>
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontWeight: "bold", fontSize: 13, color: "#137333", margin: "0 0 2px" }}>
                      {section.title}
                    </p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{section.subtitle}</p>
                  </div>

                  <IonGrid style={{ padding: 0 }}>
                    <IonRow>
                      {EVIDENCE_FIELDS.filter((item) => item.group === section.group).map((item) => {
                        const photo = evidence[item.key];

                        return (
                          <IonCol
                            size="12"
                            sizeMd="6"
                            sizeLg={section.group === "inspection" ? "3" : "4"}
                            key={item.key}
                          >
                            <div
                              style={{
                                background: "#f8fff9",
                                border: "1px solid #d2f0d9",
                                borderRadius: 12,
                                padding: 12,
                                minHeight: 240,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: 10,
                                boxShadow: "0 4px 12px rgba(19,115,51,0.06)",
                              }}
                            >
                              <div>
                                <p style={{ fontWeight: "bold", margin: "0 0 4px", color: "#137333" }}>
                                  {item.title}
                                </p>
                                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{item.subtitle}</p>
                              </div>

                              {photo ? (
                                <img
                                  src={photo.dataUrl}
                                  alt={item.title}
                                  style={{
                                    width: "100%",
                                    height: 130,
                                    objectFit: "cover",
                                    borderRadius: 10,
                                    border: "1px solid #cde7d1",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    height: 130,
                                    borderRadius: 10,
                                    border: "1px dashed #b7dabb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#7a7a7a",
                                    fontSize: 12,
                                    textAlign: "center",
                                    padding: 12,
                                    background: "#ffffff",
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
                                  size="small"
                                >
                                  {capturingType === item.key ? <IonSpinner name="crescent" /> : <IonIcon icon={camera} slot="start" />}
                                  {photo ? "Repetir foto" : "Tomar foto"}
                                </IonButton>
                                {photo && (
                                  <IonButton
                                    color="medium"
                                    fill="outline"
                                    onClick={() => handleRemoveEvidence(item.key)}
                                    disabled={capturingType !== null}
                                    style={{ margin: 0 }}
                                    size="small"
                                  >
                                    <IonIcon icon={trash} />
                                  </IonButton>
                                )}
                              </div>
                            </div>
                          </IonCol>
                        );
                      })}
                    </IonRow>
                  </IonGrid>
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        </div>

        <div style={{ padding: "14px 16px 0" }}>
          <IonCard style={{ margin: 0, border: "2px solid #1a73e8", borderRadius: 12, background: "#f8fbff" }}>
            <IonCardHeader style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonIcon icon={locate} color="primary" style={{ fontSize: 20 }} />
                <IonCardTitle style={{ fontSize: 16, color: "#1a73e8" }}>
                  Ubicacion del vehiculo
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ fontSize: 12, color: "#555", marginTop: 0 }}>
                Permite al inspector ver en tiempo real donde se encuentra el vehiculo y abrir la ubicacion en mapa.
              </p>

              <div
                style={{
                  background: "#eef5ff",
                  border: "1px solid #d5e4ff",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                {locationInfo ? (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 12 }}>
                      <strong>Latitud:</strong> {locationInfo.latitude.toFixed(6)}
                    </p>
                    <p style={{ margin: "0 0 4px", fontSize: 12 }}>
                      <strong>Longitud:</strong> {locationInfo.longitude.toFixed(6)}
                    </p>
                    <p style={{ margin: "0 0 4px", fontSize: 12 }}>
                      <strong>Precision:</strong> {Math.round(locationInfo.accuracy)} m
                    </p>
                    <p style={{ margin: 0, fontSize: 12 }}>
                      <strong>Actualizado:</strong> {locationInfo.timestamp}
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                    Aun no se ha capturado la ubicacion del vehiculo.
                  </p>
                )}
              </div>

              {locationError && (
                <IonText color="danger">
                  <p style={{ fontSize: 12, margin: "0 0 10px" }}>{locationError}</p>
                </IonText>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <IonButton onClick={handleGetLocation} disabled={locationLoading}>
                  {locationLoading ? <IonSpinner name="crescent" /> : <IonIcon icon={locate} slot="start" />}
                  {locationInfo ? "Actualizar ubicacion" : "Obtener ubicacion"}
                </IonButton>
                <IonButton fill="outline" color={locationTracking ? "danger" : "secondary"} onClick={handleToggleLocationTracking}>
                  <IonIcon icon={navigate} slot="start" />
                  {locationTracking ? "Detener seguimiento" : "Seguimiento en tiempo real"}
                </IonButton>
                {locationInfo && (
                  <IonButton fill="outline" color="primary" href={googleMapsUrl} target="_blank" rel="noreferrer">
                    <IonIcon icon={navigate} slot="start" />
                    Abrir en Google Maps
                  </IonButton>
                )}
              </div>

              {locationInfo ? (
                <iframe
                  title="Mapa de ubicacion del vehiculo"
                  src={mapEmbedUrl}
                  style={{
                    width: "100%",
                    height: 240,
                    border: "1px solid #d5e4ff",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    height: 180,
                    borderRadius: 12,
                    border: "1px dashed #c7d8f7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: 12,
                    padding: 16,
                  }}
                >
                  Usa el boton "Obtener ubicacion" para mostrar el mapa del vehiculo.
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <div style={{ padding: "14px 16px 0" }}>
          <IonCard style={{ margin: 0, borderRadius: 12, border: "2px solid #fbbc04" }}>
            <IonCardHeader style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonIcon icon={documentText} style={{ color: "#b06000", fontSize: 20 }} />
                <IonCardTitle style={{ fontSize: 16, color: "#8a5300" }}>
                  Enviar inspeccion al sistema
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              {latestQuote ? (
                <div style={{ background: "#fff8e1", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12 }}><strong>Cotizacion:</strong> #{latestQuote.id}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 12 }}><strong>Vehiculo:</strong> ID {latestQuote.vehicleId}</p>
                  <p style={{ margin: 0, fontSize: 12 }}><strong>Estado:</strong> {latestQuote.status || "draft"}</p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#666" }}>
                  Primero genera una cotizacion en la pestaña Cotizador para poder enviar la inspeccion al inspector.
                </p>
              )}

              <IonButton
                expand="block"
                onClick={handleSaveInspection}
                disabled={!latestQuote || savingInspection}
              >
                {savingInspection ? <IonSpinner name="crescent" /> : <IonIcon icon={documentText} slot="start" />}
                {savingInspection ? "Guardando inspeccion..." : "Guardar inspeccion para revision"}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        {/* ===== COTIZACION GENERADA ===== */}
        {cotizacion && (
          <div style={{ padding: "14px 16px 0" }}>

            {/* Botones accion */}
            <IonGrid style={{ padding: "0 0 8px" }}>
              <IonRow>
                <IonCol size="4" style={{ paddingLeft: 0, paddingRight: 4 }}>
                  <IonButton expand="block" color="success" onClick={handleImprimir}>
                    <IonIcon icon={print} slot="start" />
                    Imprimir
                  </IonButton>
                </IonCol>
                <IonCol size="4" style={{ paddingRight: 4, paddingLeft: 4 }}>
                  <IonButton expand="block" color="tertiary" onClick={handleImprimir}>
                    <IonIcon icon={download} slot="start" />
                    PDF
                  </IonButton>
                </IonCol>
                <IonCol size="4" style={{ paddingRight: 0, paddingLeft: 4 }}>
                  <IonButton expand="block" color="warning" onClick={handleEmail}>
                    <IonIcon icon={mail} slot="start" />
                    Email
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Preview de la cotizacion */}
            <IonCard style={{ margin: 0, border: "1px solid #ddd", borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <div id="cotizacion-print" ref={printRef}>

                  {/* Header */}
                  <div style={{
                    background: "#1a73e8", color: "white",
                    padding: "14px 16px", borderRadius: "10px 10px 0 0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>BROKERSEC</h2>
                        <p style={{ margin: 0, fontSize: 11, opacity: 0.85 }}>Seguros Vehiculares Ecuador</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 11 }}>Quito, {cotizacion.fecha}</p>
                        <p style={{ margin: 0, fontSize: 10, opacity: 0.8 }}>Valida por 15 dias</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px" }}>

                    {/* Datos cliente */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "#888", margin: "0 0 2px" }}>ASEGURADO</p>
                      <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>
                        {cotizacion.usuario?.nombre} {cotizacion.usuario?.apellido}
                      </p>
                      <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>
                        {cotizacion.usuario?.email} | {cotizacion.usuario?.telefono}
                      </p>
                      {cotizacion.usuario?.cedula && (
                        <p style={{ fontSize: 12, color: "#555", margin: "1px 0 0" }}>
                          CI: {cotizacion.usuario.cedula}
                        </p>
                      )}
                    </div>

                    <div style={{ background: "#f8fff9", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "#137333", fontWeight: "bold", margin: "0 0 8px" }}>
                        EVIDENCIA NATIVA CAPTURADA
                      </p>
                      <p style={{ fontSize: 12, margin: "0 0 8px" }}>
                        Fotos capturadas: <strong>{Object.values(cotizacion.evidencia || {}).filter(Boolean).length}</strong>
                      </p>
                      {EVIDENCE_FIELDS.map((item) => (
                        <p key={item.key} style={{ fontSize: 12, margin: "0 0 4px" }}>
                          {item.title}: <strong>{cotizacion.evidencia?.[item.key] ? "Adjunta" : "Pendiente"}</strong>
                        </p>
                      ))}
                    </div>

                    {/* Datos vehiculo */}
                    <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "#1a73e8", fontWeight: "bold", margin: "0 0 8px" }}>
                        DATOS DEL VEHICULO
                      </p>
                      <IonGrid style={{ padding: 0 }}>
                        <IonRow>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Marca</p>
                            <p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{cotizacion.vehiculo.marca}</p>
                          </IonCol>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Modelo</p>
                            <p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{cotizacion.vehiculo.modelo}</p>
                          </IonCol>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Año</p>
                            <p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{cotizacion.vehiculo.anio}</p>
                          </IonCol>
                        </IonRow>
                        <IonRow style={{ marginTop: 6 }}>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Valor Casco</p>
                            <p style={{ fontWeight: "bold", fontSize: 12, margin: 0 }}>
                              ${cotizacion.valorCasco.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                            </p>
                          </IonCol>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Valor Extras</p>
                            <p style={{ fontWeight: "bold", fontSize: 12, margin: 0 }}>
                              ${cotizacion.valorExtras.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                            </p>
                          </IonCol>
                          <IonCol size="4">
                            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>Valor Asegurado</p>
                            <p style={{ fontWeight: "bold", fontSize: 12, color: "#1a73e8", margin: 0 }}>
                              ${cotizacion.valorAsegurado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                            </p>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>

                    {/* Coberturas resumidas */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "#1a73e8", fontWeight: "bold", margin: "0 0 6px" }}>
                        COBERTURAS INCLUIDAS
                      </p>
                      {[
                        "Todo riesgo segun condiciones generales de la poliza",
                        "RC como LUC hasta USD 25,000",
                        "Muerte Accidental hasta USD 5,000 por ocupante",
                        "Gastos Medicos hasta USD 2,000 por ocupante",
                        "Muerte accidental titular hasta USD 10,000",
                        "Asistencia QBE 24/7 (remolque, mecanico, llaves)",
                        "Auto Suplente hasta 20 dias",
                        "Air Bag AL 100%",
                        "No Depreciacion de partes y piezas",
                      ].map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: 13, minWidth: 13, marginTop: 1 }} />
                          <span style={{ fontSize: 11 }}>{c}</span>
                        </div>
                      ))}
                    </div>

                    {/* Deducibles */}
                    <div style={{ background: "#fff3e0", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "#e65100", fontWeight: "bold", margin: "0 0 4px" }}>
                        DEDUCIBLES
                      </p>
                      {[
                        "Perdidas Parciales: 10% del siniestro / 1.5% asegurado (min USD 200)",
                        "Perdida Total: 15% del valor asegurado",
                        "Robo con dispositivo: 5% del valor asegurado",
                      ].map((d, i) => (
                        <p key={i} style={{ fontSize: 11, margin: "2px 0" }}>• {d}</p>
                      ))}
                    </div>

                    {/* Prima total */}
                    <div style={{
                      background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                      borderRadius: 10, padding: "14px 16px", color: "white"
                    }}>
                      <p style={{ fontSize: 12, opacity: 0.85, margin: "0 0 4px" }}>PRIMA TOTAL</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>Contado</p>
                          <p style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>
                            ${parseFloat(cotizacion.primaTotal).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>6 cuotas de</p>
                          <p style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
                            ${parseFloat(cotizacion.cuotaMensual).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: 10, paddingTop: 8 }}>
                        <p style={{ fontSize: 10, opacity: 0.75, margin: 0 }}>
                          Prima neta: ${cotizacion.primaNeta} + IVA 15%: ${cotizacion.iva}
                        </p>
                        <p style={{ fontSize: 10, opacity: 0.75, margin: "2px 0 0" }}>
                          Forma de pago: Debito bancario. Cuotas no menores a $50.00
                        </p>
                      </div>
                    </div>

                    {/* Notas */}
                    <p style={{ fontSize: 10, color: "#999", marginTop: 10, textAlign: "center" }}>
                      Esta cotizacion no implica aceptacion de riesgo ni otorgamiento de cobertura.
                      Cotizacion valida solo por 15 dias. Aplican restricciones.
                    </p>
                    <p style={{ fontSize: 11, color: "#1a73e8", fontWeight: "bold", textAlign: "center", margin: "6px 0 0" }}>
                      BROKERSEC — QBE Seguros Colonial
                    </p>

                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Botones duplicados abajo para comodidad */}
            <IonGrid style={{ padding: "8px 0 24px" }}>
              <IonRow>
                <IonCol size="6" style={{ paddingLeft: 0, paddingRight: 4 }}>
                  <IonButton expand="block" color="success" onClick={handleImprimir}>
                    <IonIcon icon={print} slot="start" />
                    Imprimir / PDF
                  </IonButton>
                </IonCol>
                <IonCol size="6" style={{ paddingRight: 0, paddingLeft: 4 }}>
                  <IonButton expand="block" color="warning" onClick={handleEmail}>
                    <IonIcon icon={mail} slot="start" />
                    Enviar por Email
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

          </div>
        )}

        {/* Si no hay cotizacion aun */}
        {!cotizacion && (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <IonIcon icon={documentText} style={{ fontSize: 52, color: "#ccc" }} />
            <p style={{ color: "#aaa", fontSize: 13, marginTop: 8 }}>
              Desde esta pantalla puedes adjuntar fotos, compartir la ubicacion actual y guardar la inspeccion para el rol inspector.
            </p>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Profile;
