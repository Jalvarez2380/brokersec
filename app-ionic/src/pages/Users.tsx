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
  IonList,
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

const Users: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.dni || !form.firstName || !form.lastName || !form.email || !form.username || !form.password) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setSaving(true);
      await createManagedUser(form);
      setForm(initialForm);
      setToastMessage("Usuario creado correctamente.");
      setToastOpen(true);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Usuarios y Roles</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message={toastMessage}
          duration={2500}
          color="success"
          position="top"
        />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Crear usuario</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="full" style={inputStyle}>
              <IonLabel position="stacked">DNI</IonLabel>
              <IonInput value={form.dni} onIonInput={(e) => handleChange("dni", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Nombre</IonLabel>
              <IonInput value={form.firstName} onIonInput={(e) => handleChange("firstName", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Apellido</IonLabel>
              <IonInput value={form.lastName} onIonInput={(e) => handleChange("lastName", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput type="email" value={form.email} onIonInput={(e) => handleChange("email", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Usuario</IonLabel>
              <IonInput value={form.username} onIonInput={(e) => handleChange("username", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Telefono</IonLabel>
              <IonInput value={form.mobile} onIonInput={(e) => handleChange("mobile", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Contrasena</IonLabel>
              <IonInput type="password" value={form.password} onIonInput={(e) => handleChange("password", e.detail.value || "")} />
            </IonItem>
            <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
              <IonLabel position="stacked">Rol</IonLabel>
              <IonSelect value={form.role} onIonChange={(e) => handleChange("role", e.detail.value)}>
                <IonSelectOption value={USER_ROLES.ADMIN}>{ROLE_LABELS[USER_ROLES.ADMIN]}</IonSelectOption>
                <IonSelectOption value={USER_ROLES.SALES}>{ROLE_LABELS[USER_ROLES.SALES]}</IonSelectOption>
                <IonSelectOption value={USER_ROLES.USER}>{ROLE_LABELS[USER_ROLES.USER]}</IonSelectOption>
              </IonSelect>
            </IonItem>

            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 12 }}>{error}</p>
              </IonText>
            )}

            <IonButton expand="block" style={{ marginTop: 16 }} onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : "Crear usuario"}
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Listado de usuarios</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <p>Cargando usuarios...</p>
            ) : (
              <IonList>
                {users.map((user) => (
                  <IonItem key={user.id}>
                    <IonLabel>
                      <h2>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}</h2>
                      <p>{user.email}</p>
                      <p>{user.username}</p>
                    </IonLabel>
                    <IonBadge color={user.role === USER_ROLES.ADMIN ? "danger" : user.role === USER_ROLES.SALES ? "warning" : "primary"}>
                      {ROLE_LABELS[user.role || USER_ROLES.USER] || user.role}
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Users;
