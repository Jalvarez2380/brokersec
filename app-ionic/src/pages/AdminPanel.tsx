import React, { useEffect, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/react";
import { createManagedUser, listUsers, ManagedUser } from "../services/users.service";
import { ROLE_LABELS, USER_ROLES } from "../constants/roles";

const inputStyle = { "--background": "#f0f4ff" } as any;

const initialForm = {
  dni: "",
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  mobile: "",
  role: USER_ROLES.USER,
};

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUsersData = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar usuarios.");
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.dni || !form.firstName || !form.lastName || !form.email || !form.username || !form.password) {
      setError("Completa los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await createManagedUser(form);
      setToast("Usuario creado correctamente.");
      setForm(initialForm);
      await loadUsersData();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Administración</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonToast isOpen={!!toast} onDidDismiss={() => setToast("")} message={toast} duration={2500} color="success" />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: 16 }}>Crear usuario por rol</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Cédula</IonLabel><IonInput value={form.dni} onIonInput={(e) => handleChange("dni", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Nombre</IonLabel><IonInput value={form.firstName} onIonInput={(e) => handleChange("firstName", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Apellido</IonLabel><IonInput value={form.lastName} onIonInput={(e) => handleChange("lastName", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Email</IonLabel><IonInput value={form.email} onIonInput={(e) => handleChange("email", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Usuario</IonLabel><IonInput value={form.username} onIonInput={(e) => handleChange("username", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Contraseña</IonLabel><IonInput type="password" value={form.password} onIonInput={(e) => handleChange("password", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Teléfono</IonLabel><IonInput value={form.mobile} onIonInput={(e) => handleChange("mobile", e.detail.value || "")} /></IonItem>
            <IonItem lines="full" style={inputStyle}><IonLabel position="stacked">Rol</IonLabel>
              <IonSelect value={form.role} onIonChange={(e) => handleChange("role", e.detail.value)}>
                <IonSelectOption value={USER_ROLES.USER}>Usuario</IonSelectOption>
                <IonSelectOption value={USER_ROLES.INSPECTOR}>Inspector</IonSelectOption>
                <IonSelectOption value={USER_ROLES.SALES}>Ventas</IonSelectOption>
                <IonSelectOption value={USER_ROLES.ADMIN}>Administrador</IonSelectOption>
              </IonSelect>
            </IonItem>

            {error && <IonText color="danger"><p>{error}</p></IonText>}

            <IonButton expand="block" onClick={handleSubmit} disabled={loading} style={{ marginTop: 12 }}>
              {loading ? "Guardando..." : "Crear usuario"}
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: 16 }}>Usuarios del sistema</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {users.map((user) => (
              <div key={user.id} style={{ padding: "8px 0", borderBottom: "1px solid #eef2f7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <strong>{user.firstName} {user.lastName}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 12 }}>{user.email}</p>
                  </div>
                  <IonBadge color="primary">{ROLE_LABELS[user.role || "user"] || user.role}</IonBadge>
                </div>
              </div>
            ))}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default AdminPanel;
