import React, { useState } from "react";
import {
  IonPage, IonContent, IonButton, IonIcon,
  IonInput, IonItem, IonLabel, IonText, IonToast,
} from "@ionic/react";
import { eye, eyeOff, logIn, personAdd } from "ionicons/icons";
import { authService } from "../services/auth.service";

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle = { "--background": "#f0f4ff" } as any;

  const handleLogin = async () => {
    setError("");

    if (!usuario.trim() || !password.trim()) {
      setError("Ingresa tu usuario y contrasena.");
      return;
    }
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await authService.signin({
        username: usuario.trim(),
        password,
      });

      setShowToast(true);
      setTimeout(() => {
        window.location.href = "/tabs/inicio";
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesion. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "32px 24px",
          background: "linear-gradient(180deg, #e8f0fe 0%, #ffffff 100%)",
        }}>

          {/* Logo y titulo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src="/logo.png"
              alt="BROKERSEC"
              style={{ width: 80, marginBottom: 12 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <h1 style={{ fontSize: 26, fontWeight: "bold", color: "#1a73e8", margin: "0 0 6px" }}>
              Bienvenido
            </h1>
            <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Tarjeta formulario */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "24px 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>

            {/* Campo Usuario */}
            <IonItem lines="full" style={{ ...inputStyle, marginBottom: 12, borderRadius: 8 }}>
              <IonLabel position="stacked" style={{ color: "#1a73e8", fontWeight: "bold" }}>
                Usuario *
              </IonLabel>
              <IonInput
                value={usuario}
                placeholder="Tu usuario o email"
                onIonInput={(e) => setUsuario(e.detail.value as string)}
                onKeyUp={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
            </IonItem>

            {/* Campo Contrasena */}
            <IonItem lines="full" style={{ ...inputStyle, borderRadius: 8 }}>
              <IonLabel position="stacked" style={{ color: "#1a73e8", fontWeight: "bold" }}>
                Contrasena *
              </IonLabel>
              <IonInput
                type={showPass ? "text" : "password"}
                value={password}
                placeholder="Tu contrasena"
                onIonInput={(e) => setPassword(e.detail.value as string)}
                onKeyUp={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
              <IonIcon
                icon={showPass ? eyeOff : eye}
                slot="end"
                style={{ cursor: "pointer", color: "#888", marginTop: 16 }}
                onClick={() => setShowPass(!showPass)}
              />
            </IonItem>

            {/* Error */}
            {error && (
              <IonText color="danger">
                <p style={{ fontSize: 12, margin: "10px 0 0", textAlign: "center" }}>
                  {error}
                </p>
              </IonText>
            )}

            {/* Boton login */}
            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={loading}
              style={{ marginTop: 20, height: 48, borderRadius: 10 }}
            >
              <IonIcon icon={logIn} slot="start" />
              {loading ? "Ingresando..." : "Iniciar Sesion"}
            </IonButton>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center",
              margin: "16px 0", gap: 8
            }}>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
              <span style={{ fontSize: 12, color: "#aaa" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
            </div>

            {/* Boton registro */}
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={() => { window.location.href = "/register"; }}
              style={{ borderRadius: 10 }}
            >
              <IonIcon icon={personAdd} slot="start" />
              Crear Cuenta
            </IonButton>

            {/* Nota de ayuda */}
            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "14px 0 0" }}>
              Puedes ingresar con tu <strong>usuario</strong> o <strong>email</strong>
            </p>
          </div>

        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Sesion iniciada correctamente! Bienvenido."
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
