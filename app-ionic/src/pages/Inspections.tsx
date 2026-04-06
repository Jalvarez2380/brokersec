import React, { useEffect, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonToast,
} from "@ionic/react";
import { add, locate, refresh, logOut, close, checkmark } from "ionicons/icons";
import { InspectionRecord, listInspections, createInspection } from "../services/inspection.service";
import { authService } from "../services/auth.service";

const statusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed": return "success";
    case "in_progress":
    case "in-progress": return "warning";
    case "cancelled": return "danger";
    default: return "medium";
  }
};

const statusLabel = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed": return "Completada";
    case "in_progress":
    case "in-progress": return "En progreso";
    case "cancelled": return "Cancelada";
    default: return "Pendiente";
  }
};

const Inspections: React.FC = () => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", color: "success" });

  // Formulario nueva inspeccion
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formScheduled, setFormScheduled] = useState("");

  const handleLogout = async () => {
    await authService.signout();
    window.location.href = "/login";
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listInspections();
      setInspections(data);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar las inspecciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      await createInspection({
        vehicleId: formVehicleId ? Number(formVehicleId) : undefined,
        status: formStatus,
        notes: formNotes || undefined,
        scheduledAt: formScheduled || undefined,
      });
      setToast({ show: true, msg: "Inspección creada correctamente", color: "success" });
      setShowModal(false);
      setFormNotes("");
      setFormStatus("pending");
      setFormVehicleId("");
      setFormScheduled("");
      await loadData();
    } catch (err: any) {
      setToast({ show: true, msg: err?.message || "Error al crear inspección", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Inspecciones</IonTitle>
          <IonButtons slot="end">
            <IonButton color="light" onClick={() => setShowModal(true)}>
              <IonIcon icon={add} slot="icon-only" />
            </IonButton>
            <IonButton color="light" onClick={handleLogout}>
              <IonIcon icon={logOut} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={async (event) => { await loadData(); event.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <IonButton expand="block" fill="outline" onClick={loadData} disabled={loading} style={{ marginBottom: 12 }}>
          <IonIcon icon={refresh} slot="start" />
          {loading ? "Actualizando..." : "Actualizar listado"}
        </IonButton>

        <IonButton expand="block" color="primary" onClick={() => setShowModal(true)} style={{ marginBottom: 16 }}>
          <IonIcon icon={add} slot="start" />
          Nueva Inspección
        </IonButton>

        {error && (
          <IonText color="danger">
            <p style={{ textAlign: "center" }}>{error}</p>
          </IonText>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 32 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {!loading && inspections.length === 0 && !error && (
          <IonCard>
            <IonCardContent style={{ textAlign: "center", color: "#888" }}>
              No hay inspecciones registradas todavía.
              <br />
              <small>Pulsa "Nueva Inspección" para crear una.</small>
            </IonCardContent>
          </IonCard>
        )}

        {inspections.map((inspection) => {
          const hasLocation =
            inspection.location &&
            inspection.location.latitude != null &&
            inspection.location.longitude != null;

          const mapsUrl = hasLocation
            ? `https://www.google.com/maps?q=${inspection.location!.latitude},${inspection.location!.longitude}`
            : "";

          return (
            <IonCard key={inspection.id}>
              <IonCardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <IonCardTitle style={{ fontSize: 16 }}>
                    Inspección #{inspection.id}
                  </IonCardTitle>
                  <IonBadge color={statusColor(inspection.status)}>
                    {statusLabel(inspection.status)}
                  </IonBadge>
                </div>
              </IonCardHeader>
              <IonCardContent>
                {inspection.customer?.name && (
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Cliente:</strong> {inspection.customer.name}
                  </p>
                )}
                {(inspection.vehicle?.brand || inspection.vehicle?.model) && (
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Vehículo:</strong> {inspection.vehicle?.brand} {inspection.vehicle?.model} {inspection.vehicle?.year}
                  </p>
                )}
                {inspection.notes && (
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Notas:</strong> {inspection.notes}
                  </p>
                )}
                {inspection.scheduledAt && (
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Programada:</strong> {new Date(inspection.scheduledAt).toLocaleString()}
                  </p>
                )}
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "#888" }}>
                  <strong>Evidencias:</strong> {inspection.evidences?.length || 0}
                </p>
                {hasLocation && (
                  <>
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>Ubicación:</strong>{" "}
                      {inspection.location!.latitude!.toFixed(6)},{" "}
                      {inspection.location!.longitude!.toFixed(6)}
                    </p>
                    <IonButton size="small" fill="outline" href={mapsUrl} target="_blank" rel="noreferrer">
                      <IonIcon icon={locate} slot="start" />
                      Ver mapa
                    </IonButton>
                  </>
                )}

                {!!inspection.evidences?.length && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: "0 0 8px", fontWeight: "bold", fontSize: 12 }}>Fotos</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
                      {inspection.evidences.slice(0, 6).map((evidence, index) => (
                        <div key={`${inspection.id}-${index}`}>
                          {evidence.dataUrl ? (
                            <img
                              src={evidence.dataUrl}
                              alt={evidence.label}
                              style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #dbe3ef" }}
                            />
                          ) : (
                            <div style={{ height: 80, borderRadius: 8, border: "1px dashed #dbe3ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666" }}>
                              Sin vista previa
                            </div>
                          )}
                          <p style={{ margin: "4px 0 0", fontSize: 10 }}>{evidence.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          );
        })}
      </IonContent>

      {/* Modal: Nueva Inspección */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Nueva Inspección</IonTitle>
            <IonButtons slot="end">
              <IonButton color="light" onClick={() => setShowModal(false)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem lines="full" style={{ marginBottom: 12 }}>
            <IonLabel position="stacked">ID Vehículo (opcional)</IonLabel>
            <IonInput
              type="number"
              placeholder="Ej: 1"
              value={formVehicleId}
              onIonInput={(e) => setFormVehicleId(e.detail.value as string)}
            />
          </IonItem>

          <IonItem lines="full" style={{ marginBottom: 12 }}>
            <IonLabel position="stacked">Estado</IonLabel>
            <IonSelect value={formStatus} onIonChange={(e) => setFormStatus(e.detail.value)}>
              <IonSelectOption value="pending">Pendiente</IonSelectOption>
              <IonSelectOption value="in_progress">En progreso</IonSelectOption>
              <IonSelectOption value="completed">Completada</IonSelectOption>
              <IonSelectOption value="cancelled">Cancelada</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem lines="full" style={{ marginBottom: 12 }}>
            <IonLabel position="stacked">Fecha programada (opcional)</IonLabel>
            <IonInput
              type="datetime-local"
              value={formScheduled}
              onIonInput={(e) => setFormScheduled(e.detail.value as string)}
            />
          </IonItem>

          <IonItem lines="full" style={{ marginBottom: 20 }}>
            <IonLabel position="stacked">Notas</IonLabel>
            <IonTextarea
              rows={4}
              placeholder="Observaciones de la inspección..."
              value={formNotes}
              onIonInput={(e) => setFormNotes(e.detail.value as string)}
            />
          </IonItem>

          <IonButton expand="block" color="primary" onClick={handleCreate} disabled={saving}>
            {saving ? <IonSpinner name="crescent" /> : (
              <>
                <IonIcon icon={checkmark} slot="start" />
                Guardar Inspección
              </>
            )}
          </IonButton>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={toast.show}
        onDidDismiss={() => setToast({ ...toast, show: false })}
        message={toast.msg}
        duration={2500}
        color={toast.color}
        position="top"
      />
    </IonPage>
  );
};

export default Inspections;
