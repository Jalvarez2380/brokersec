import React, { useState, useEffect } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonAccordion, IonAccordionGroup, IonItem, IonLabel,
  IonBadge, IonChip, IonInput, IonText, IonToast, IonFab, IonFabButton,
} from "@ionic/react";
import {
  calculator, shield, car, call, checkmarkCircle,
  alertCircle, medkit, construct, personAdd, eye, eyeOff,
  person, logOut, chatbubbles, documentText, locate, people,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { authService } from "../services/auth.service";
import { getUserDisplayName, normalizeAppUser, hasRole, normalizeRole } from "../services/user.utils";
import { listMyQuotes, QuoteRecord } from "../services/quote.service";
import { listInspections, InspectionRecord } from "../services/inspection.service";
import { ROLE_LABELS, USER_ROLES } from "../constants/roles";
import AssistantModal from "../components/AssistantModal";

const Home: React.FC = () => {
  const history = useHistory();
  const whatsappUrl = "https://wa.me/593999772225";

  // ——— Detectar si ya hay usuario registrado ———
  const [yaRegistrado, setYaRegistrado] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);

  useEffect(() => {
    const loadRoleData = async (userData: any) => {
      try {
        if (hasRole(userData, [USER_ROLES.INSPECTOR, USER_ROLES.ADMIN])) {
          const inspections = await listInspections();
          setRecentInspections(inspections.slice(0, 5));
        }

        if (hasRole(userData, [USER_ROLES.SALES, USER_ROLES.ADMIN])) {
          const quotes = await listMyQuotes();
          setRecentQuotes(quotes.slice(0, 5));
        }
      } catch (dashboardError) {
        console.warn("No se pudo cargar el tablero por rol:", dashboardError);
      }
    };

    const loadUser = async () => {
      const localUser = normalizeAppUser(authService.getCurrentUser());
      if (localUser) {
        setUsuarioActual(localUser);
        setYaRegistrado(true);
        await loadRoleData(localUser);
      }

      const apiUser = normalizeAppUser(await authService.user());
      if (apiUser) {
        setUsuarioActual(apiUser);
        setYaRegistrado(true);
        await loadRoleData(apiUser);
      }
    };

    loadUser();
  }, []);

  // ——— Estados del formulario ———
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState<QuoteRecord[]>([]);
  const [recentInspections, setRecentInspections] = useState<InspectionRecord[]>([]);

  const inputStyle = { "--background": "#f0f4ff" } as any;

  const currentRole = normalizeRole(usuarioActual?.role);
  const isInspector = hasRole(usuarioActual, [USER_ROLES.INSPECTOR]);
  const isSales = hasRole(usuarioActual, [USER_ROLES.SALES]);
  const isAdmin = hasRole(usuarioActual, [USER_ROLES.ADMIN]);
  const isCustomer = yaRegistrado && !isInspector && !isSales && !isAdmin;

  const primaryAction = isAdmin
    ? { label: "Panel Admin", icon: people, action: () => history.push("/tabs/admin") }
    : isInspector
      ? { label: "Ver Inspecciones", icon: documentText, action: () => history.push("/tabs/inspecciones") }
      : isSales
        ? { label: "Cotizaciones", icon: calculator, action: () => history.push("/tabs/cotizador") }
        : { label: "Ir al Cotizador", icon: calculator, action: () => history.push("/tabs/cotizador") };

  const serviceItems = isAdmin
    ? [
        { icon: people, color: "primary", label: "Usuarios", action: () => history.push("/tabs/admin") },
        { icon: documentText, color: "success", label: "Inspecciones", action: () => history.push("/tabs/inspecciones") },
        { icon: calculator, color: "warning", label: "Cotizaciones", action: () => history.push("/tabs/cotizador") },
        { icon: call, color: "danger", label: "Soporte", action: openWhatsApp },
      ]
    : isInspector
      ? [
          { icon: documentText, color: "primary", label: "Inspecciones", action: () => history.push("/tabs/inspecciones") },
          { icon: locate, color: "success", label: "Ubicaciones", action: () => history.push("/tabs/inspecciones") },
          { icon: car, color: "warning", label: "Vehículos", action: () => history.push("/tabs/inspecciones") },
          { icon: call, color: "danger", label: "Contacto 24/7", action: openWhatsApp },
        ]
      : isSales
        ? [
            { icon: calculator, color: "primary", label: "Cotizar Seguro", action: () => history.push("/tabs/cotizador") },
            { icon: people, color: "success", label: "Clientes", action: () => history.push("/tabs/cotizador") },
            { icon: car, color: "warning", label: "Vehículos", action: () => history.push("/tabs/cotizador") },
            { icon: call, color: "danger", label: "Contacto 24/7", action: openWhatsApp },
          ]
        : [
            { icon: calculator, color: "primary", label: "Cotizar Seguro", action: () => history.push("/tabs/cotizador") },
            { icon: shield, color: "success", label: "Mis Polizas", action: () => {} },
            { icon: car, color: "warning", label: "Mis Vehiculos", action: () => {} },
            { icon: call, color: "danger", label: "Contacto 24/7", action: openWhatsApp },
          ];

  // ——— Cerrar sesion ———
  const handleLogout = async () => {
    await authService.signout();
    window.location.href = "/login";
  };

  function openWhatsApp() {
    const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = whatsappUrl;
    }
  }

  // ——— Registro ———
  const handleRegistro = async () => {
    setRegError("");

    if (!cedula || !telefono || !nombre || !apellido || !email || !usuario || !password || !confirmar) {
      setRegError("Por favor completa todos los campos obligatorios.");
      return;
    }
    if (!/^\d{10}$/.test(cedula)) {
      setRegError("La cedula debe tener exactamente 10 digitos numericos.");
      return;
    }
    if (!/^0\d{9}$/.test(telefono)) {
      setRegError("El telefono debe tener 10 digitos y comenzar con 0.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setRegError("Ingresa un correo electronico valido.");
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      setRegError("Nombre y apellido solo pueden contener letras.");
      return;
    }
    if (usuario.length < 4 || usuario.includes(" ")) {
      setRegError("El usuario debe tener al menos 4 caracteres y sin espacios.");
      return;
    }
    if (password.length < 6) {
      setRegError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setRegError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authService.signup({
        dni: cedula,
        firstName: nombre,
        lastName: apellido,
        email,
        username: usuario,
        password,
        mobile: telefono,
      });

      setRegSuccess("Registro exitoso! Ahora puedes iniciar sesion.");
      setToastMsg("Usuario registrado en PostgreSQL correctamente.");
      setShowToast(true);

      setTimeout(() => {
        setLoading(false);
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setRegError(err?.message || "No se pudo registrar el usuario.");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>BROKERSEC</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <AssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3000}
          color="success"
          position="top"
        />

        {/* ===== HERO BANNER ===== */}
        <div style={{
          background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)",
          padding: "28px 20px 20px", textAlign: "center", color: "white"
        }}>
          <img src="/logo.png" alt="BROKERSEC"
            style={{ width: 72, marginBottom: 10 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: "bold" }}>BROKERSEC</h1>
          <p style={{ margin: "0 0 14px", fontSize: 13, opacity: 0.9 }}>
            Seguro Inteligente para tu vehiculo en Ecuador
          </p>
          <IonButton color="light" size="small" onClick={primaryAction.action}>
            <IonIcon icon={primaryAction.icon} slot="start" />
            {primaryAction.label}
          </IonButton>
        </div>

        {/* ===== VIDEO CORPORATIVO ===== */}
        <div style={{ padding: "16px 16px 0" }}>
          <h3 style={{ color: "#1a73e8", fontWeight: "bold", margin: "0 0 8px" }}>
            Nuestra Empresa
          </h3>
          <div style={{ borderRadius: 12, overflow: "hidden", background: "#000" }}>
            <video controls loop autoPlay muted width="100%"
              style={{ display: "block", maxHeight: 200 }}
              poster="/logo.png">
              <source src="/brokersec.mp4" type="video/mp4" />
              Tu navegador no soporta video HTML5.
            </video>
          </div>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            BROKERSEC opera como broker de seguros vehiculares en Ecuador,
            trabajando con aseguradoras de primer nivel para proteger tu patrimonio.
          </p>
        </div>

        {/* ===== REGISTRO O BIENVENIDA ===== */}
        <div style={{ padding: "16px 16px 0" }}>

          {/* — Si YA está registrado: mostrar tarjeta de bienvenida — */}
          {yaRegistrado && usuarioActual ? (
            <IonCard style={{ margin: 0, border: "2px solid #34a853", borderRadius: 12 }}>
              <IonCardContent style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "#1a73e8", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "bold", fontSize: 18
                  }}>
                    {(usuarioActual.firstName || usuarioActual.nombre || "U")[0].toUpperCase()}
                    {(usuarioActual.lastName || usuarioActual.apellido || "")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: 16, margin: 0 }}>
                      {getUserDisplayName(usuarioActual)}
                    </p>
                    <IonBadge color={isAdmin ? "warning" : isInspector ? "success" : isSales ? "tertiary" : "primary"} style={{ fontSize: 10 }}>
                      {ROLE_LABELS[currentRole] || currentRole}
                    </IonBadge>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {[
                    { label: "Email", value: usuarioActual.email },
                    { label: "Telefono", value: usuarioActual.mobile || usuarioActual.telefono },
                    { label: "Cedula", value: usuarioActual.dni || usuarioActual.cedula },
                    { label: "Usuario", value: usuarioActual.username || usuarioActual.usuario },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0", borderBottom: "1px solid #f0f0f0"
                    }}>
                      <span style={{ fontSize: 12, color: "#888" }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: "bold" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    <IonCol size="8" style={{ paddingLeft: 0, paddingRight: 4 }}>
                      <IonButton expand="block" onClick={primaryAction.action}>
                        <IonIcon icon={primaryAction.icon} slot="start" />
                        {primaryAction.label}
                      </IonButton>
                    </IonCol>
                    <IonCol size="4" style={{ paddingRight: 0, paddingLeft: 4 }}>
                      <IonButton expand="block" color="medium" fill="outline" onClick={handleLogout}>
                        <IonIcon icon={logOut} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

          ) : (

            /* — Si NO está registrado: mostrar formulario — */
            <IonCard style={{ border: "2px solid #1a73e8", borderRadius: 12, margin: 0 }}>
              <IonCardHeader style={{ paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IonIcon icon={personAdd} color="primary" style={{ fontSize: 22 }} />
                  <IonCardTitle style={{ fontSize: 17, color: "#1a73e8" }}>
                    Registrarse
                  </IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>

                {/* Cedula */}
                <IonItem lines="full" style={inputStyle}>
                  <IonLabel position="stacked">Cedula de Identidad * (10 digitos)</IonLabel>
                  <IonInput
                    type="number" value={cedula}
                    placeholder="Ej. 1712345678"
                    onIonInput={(e) => {
                      const val = (e.detail.value as string).replace(/\D/g, "").slice(0, 10);
                      setCedula(val);
                    }}
                  />
                  {cedula.length > 0 && cedula.length < 10 && (
                    <IonText color="danger" slot="end">
                      <small style={{ marginTop: 16 }}>{cedula.length}/10</small>
                    </IonText>
                  )}
                  {cedula.length === 10 && (
                    <IonIcon icon={checkmarkCircle} color="success" slot="end" style={{ marginTop: 16 }} />
                  )}
                </IonItem>

                {/* Telefono */}
                <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
                  <IonLabel position="stacked">Telefono * (10 digitos, empieza en 0)</IonLabel>
                  <IonInput
                    type="tel" value={telefono}
                    placeholder="Ej. 0999772226"
                    onIonInput={(e) => {
                      const val = (e.detail.value as string).replace(/\D/g, "").slice(0, 10);
                      setTelefono(val);
                    }}
                  />
                  {/^0\d{9}$/.test(telefono) && (
                    <IonIcon icon={checkmarkCircle} color="success" slot="end" style={{ marginTop: 16 }} />
                  )}
                </IonItem>

                {/* Nombre y Apellido */}
                <IonGrid style={{ padding: "8px 0 0" }}>
                  <IonRow>
                    <IonCol size="6" style={{ paddingLeft: 0, paddingRight: 4 }}>
                      <IonItem lines="full" style={inputStyle}>
                        <IonLabel position="stacked">Nombre *</IonLabel>
                        <IonInput value={nombre} placeholder="Ej. Luis"
                          onIonInput={(e) => setNombre(e.detail.value as string)} />
                      </IonItem>
                    </IonCol>
                    <IonCol size="6" style={{ paddingRight: 0, paddingLeft: 4 }}>
                      <IonItem lines="full" style={inputStyle}>
                        <IonLabel position="stacked">Apellido *</IonLabel>
                        <IonInput value={apellido} placeholder="Ej. Calle"
                          onIonInput={(e) => setApellido(e.detail.value as string)} />
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                {/* Email */}
                <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
                  <IonLabel position="stacked">Email *</IonLabel>
                  <IonInput type="email" value={email}
                    placeholder="Ej. correo@gmail.com"
                    onIonInput={(e) => setEmail(e.detail.value as string)} />
                  {email.includes("@") && email.includes(".") && (
                    <IonIcon icon={checkmarkCircle} color="success" slot="end" style={{ marginTop: 16 }} />
                  )}
                </IonItem>

                {/* Usuario */}
                <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
                  <IonLabel position="stacked">Usuario * (min. 4 caracteres, sin espacios)</IonLabel>
                  <IonInput value={usuario} placeholder="Ej. luis.calle"
                    onIonInput={(e) => setUsuario(e.detail.value as string)} />
                  {usuario.length >= 4 && !usuario.includes(" ") && (
                    <IonIcon icon={checkmarkCircle} color="success" slot="end" style={{ marginTop: 16 }} />
                  )}
                </IonItem>

                {/* Contrasena */}
                <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
                  <IonLabel position="stacked">Contrasena * (min. 6 caracteres)</IonLabel>
                  <IonInput
                    type={showPass ? "text" : "password"}
                    value={password} placeholder="Minimo 6 caracteres"
                    onIonInput={(e) => setPassword(e.detail.value as string)} />
                  <IonIcon icon={showPass ? eyeOff : eye} slot="end"
                    style={{ cursor: "pointer", color: "#888", marginTop: 16 }}
                    onClick={() => setShowPass(!showPass)} />
                </IonItem>

                {/* Confirmar */}
                <IonItem lines="full" style={{ ...inputStyle, marginTop: 8 }}>
                  <IonLabel position="stacked">Confirmar Contrasena *</IonLabel>
                  <IonInput
                    type={showConfirm ? "text" : "password"}
                    value={confirmar} placeholder="Repite tu contrasena"
                    onIonInput={(e) => setConfirmar(e.detail.value as string)} />
                  <IonIcon icon={showConfirm ? eyeOff : eye} slot="end"
                    style={{ cursor: "pointer", color: "#888", marginTop: 16 }}
                    onClick={() => setShowConfirm(!showConfirm)} />
                </IonItem>

                {regError && (
                  <IonText color="danger">
                    <p style={{ fontSize: 12, margin: "8px 0 0" }}>{regError}</p>
                  </IonText>
                )}
                {regSuccess && (
                  <IonText color="success">
                    <p style={{ fontSize: 13, margin: "8px 0 0", fontWeight: "bold" }}>{regSuccess}</p>
                  </IonText>
                )}

                <IonButton expand="block" onClick={handleRegistro}
                  disabled={loading} style={{ marginTop: 14 }}>
                  <IonIcon icon={personAdd} slot="start" />
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </IonButton>

                <p style={{ fontSize: 12, color: "#999", textAlign: "center", margin: "10px 0 0" }}>
                  Ya tienes cuenta?{" "}
                  <span
                    style={{ color: "#1a73e8", cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => window.location.href = "/login"}
                  >
                    Inicia Sesion
                  </span>
                </p>

              </IonCardContent>
            </IonCard>
          )}
        </div>

        {yaRegistrado && usuarioActual && (isInspector || isSales || isAdmin) && (
          <div style={{ padding: "16px 16px 0" }}>
            <h3 style={{ color: "#1a73e8", fontWeight: "bold", margin: "0 0 8px" }}>
              Panel de {ROLE_LABELS[currentRole] || currentRole}
            </h3>

            {(isInspector || isAdmin) && (
              <IonCard style={{ margin: 0, borderRadius: 12 }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: 16 }}>Inspecciones cargadas</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {recentInspections.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                      Aun no hay inspecciones registradas en la base de datos.
                    </p>
                  ) : (
                    recentInspections.slice(0, 3).map((inspection) => (
                      <div key={inspection.id} style={{ padding: "8px 0", borderBottom: "1px solid #eef2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <strong>Inspección #{inspection.id}</strong>
                          <IonBadge color="success">{inspection.status || "pending"}</IonBadge>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                          {inspection.customer?.name || "Cliente"} · {inspection.vehicle?.brand || "Vehículo"} {inspection.vehicle?.model || ""}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#555" }}>
                          Fotos: {inspection.evidences?.length || 0}
                          {inspection.location?.latitude ? ` · Ubicación: ${inspection.location.latitude.toFixed(4)}, ${inspection.location.longitude.toFixed(4)}` : " · Sin ubicación"}
                        </p>
                      </div>
                    ))
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {(isSales || isAdmin) && (
              <IonCard style={{ marginTop: 12, borderRadius: 12 }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: 16 }}>Cotizaciones recientes</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {recentQuotes.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                      Aun no hay cotizaciones para mostrar.
                    </p>
                  ) : (
                    recentQuotes.slice(0, 4).map((quote) => (
                      <div key={quote.id} style={{ padding: "8px 0", borderBottom: "1px solid #eef2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <strong>Cotización #{quote.id}</strong>
                          <IonBadge color="primary">{quote.status || "draft"}</IonBadge>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                          {quote.city || "Quito"} · ${Number(quote.totalPremium || 0).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </div>
        )}

        {/* ===== ACCESOS RAPIDOS ===== */}
        <div style={{ padding: "16px 16px 0" }}>
          <h3 style={{ color: "#1a73e8", fontWeight: "bold", margin: "0 0 8px" }}>Servicios</h3>
          <IonGrid style={{ padding: 0 }}>
            <IonRow>
              {serviceItems.map((item, i) => (
                <IonCol size="6" key={i}>
                  <IonCard button onClick={item.action} style={{ margin: 0 }}>
                    <IonCardContent style={{ textAlign: "center", padding: 12 }}>
                      <IonIcon icon={item.icon} color={item.color} style={{ fontSize: 26 }} />
                      <p style={{ fontSize: 11, margin: "6px 0 0", fontWeight: "bold" }}>{item.label}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {isCustomer && (
        <>
        {/* ===== COBERTURAS ===== */}
        <div style={{ padding: "16px 16px 0" }}>
          <h3 style={{ color: "#1a73e8", fontWeight: "bold", margin: "0 0 8px" }}>
            Coberturas Incluidas
          </h3>
          <IonAccordionGroup>

            <IonAccordion value="cobertura">
              <IonItem slot="header" color="light">
                <IonIcon icon={shield} color="primary" slot="start" />
                <IonLabel><strong>Cobertura Todo Riesgo</strong></IonLabel>
                <IonBadge color="success" slot="end">Incluido</IonBadge>
              </IonItem>
              <div slot="content" style={{ padding: "12px 16px", background: "#f9f9f9" }}>
                {[
                  "Responsabilidad Civil (LUC) hasta USD 25,000",
                  "Muerte Accidental hasta USD 5,000 por ocupante",
                  "Gastos Medicos hasta USD 2,000 por ocupante",
                  "Muerte accidental del titular hasta USD 10,000",
                  "Gastos de remolque hasta USD 200",
                  "Transito por caminos no oficiales",
                  "Gastos de sepelio hasta USD 200",
                  "Ambulancia por accidente hasta USD 100",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: 15, minWidth: 15, marginTop: 2 }} />
                    <span style={{ fontSize: 12 }}>{item}</span>
                  </div>
                ))}
              </div>
            </IonAccordion>

            <IonAccordion value="qbe">
              <IonItem slot="header" color="light">
                <IonIcon icon={construct} color="warning" slot="start" />
                <IonLabel><strong>Asistencia QBE 24/7</strong></IonLabel>
                <IonBadge color="warning" slot="end">24 horas</IonBadge>
              </IonItem>
              <div slot="content" style={{ padding: "12px 16px", background: "#f9f9f9" }}>
                {[
                  "Asistencia mecanica en carretera",
                  "Remolque y transporte del vehiculo",
                  "Servicio de llanta baja",
                  "Recuperacion de llaves dentro del auto",
                  "Conductor profesional",
                  "Asistencia legal IN SITU",
                  "Accesorios: herramientas, limpiaparabrisas, llanta emergencia",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <IonIcon icon={checkmarkCircle} color="warning" style={{ fontSize: 15, minWidth: 15, marginTop: 2 }} />
                    <span style={{ fontSize: 12 }}>{item}</span>
                  </div>
                ))}
              </div>
            </IonAccordion>

            <IonAccordion value="autosuplente">
              <IonItem slot="header" color="light">
                <IonIcon icon={car} color="tertiary" slot="start" />
                <IonLabel><strong>Auto Suplente</strong></IonLabel>
                <IonBadge color="tertiary" slot="end">Hasta 20 dias</IonBadge>
              </IonItem>
              <div slot="content" style={{ padding: "12px 16px", background: "#f9f9f9" }}>
                <p style={{ fontSize: 12, margin: "0 0 6px" }}>
                  <strong>Danos parciales:</strong> 10 dias si la reparacion es mayor a USD 1,000
                </p>
                <p style={{ fontSize: 12, margin: 0 }}>
                  <strong>Perdida total:</strong> 20 dias una vez documentado el reclamo
                </p>
              </div>
            </IonAccordion>

            <IonAccordion value="deducibles">
              <IonItem slot="header" color="light">
                <IonIcon icon={alertCircle} color="danger" slot="start" />
                <IonLabel><strong>Deducibles</strong></IonLabel>
              </IonItem>
              <div slot="content" style={{ padding: "12px 16px", background: "#f9f9f9" }}>
                {[
                  { label: "Perdidas Parciales",   value: "10% siniestro / 1.5% asegurado (min USD 200)" },
                  { label: "Perdida Total",         value: "15% del valor asegurado" },
                  { label: "Robo con dispositivo",  value: "5% del valor asegurado" },
                ].map((d, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <IonChip color="danger" style={{ margin: 0 }}>
                      <IonLabel style={{ fontSize: 11 }}>{d.label}</IonLabel>
                    </IonChip>
                    <p style={{ fontSize: 12, margin: "2px 0 0 8px" }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </IonAccordion>

            <IonAccordion value="garantia">
              <IonItem slot="header" color="light">
                <IonIcon icon={medkit} color="medium" slot="start" />
                <IonLabel><strong>Garantia de la Poliza</strong></IonLabel>
              </IonItem>
              <div slot="content" style={{ padding: "12px 16px", background: "#f9f9f9" }}>
                <p style={{ fontSize: 12, margin: "0 0 6px" }}>
                  Vehiculos mayores a <strong>USD 20,000</strong> requieren Rastreo Satelital activado.
                  Sin este, no aplica cobertura por robo/asalto.
                </p>
                <p style={{ fontSize: 12, margin: 0 }}>
                  Si el vehiculo recorre mas de <strong>3,200 km/mes</strong>,
                  el deducible sera 10% (minimo USD 500).
                </p>
              </div>
            </IonAccordion>

          </IonAccordionGroup>
        </div>

        {/* ===== EMERGENCIAS ===== */}
        <div style={{ padding: "16px 16px 24px" }}>
          <IonCard color="danger">
            <IonCardHeader>
              <IonCardTitle style={{ color: "white", fontSize: 15 }}>
                Emergencias y Siniestros 24/7
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ color: "white", fontSize: 13, margin: "0 0 10px" }}>
                Reporta tu siniestro en cualquier momento
              </p>
              <IonButton color="light" expand="block" href="tel:025008000" style={{ marginBottom: 6 }}>
                Oficina: 02 500 8000
              </IonButton>
              <IonButton color="light" fill="outline" expand="block" onClick={openWhatsApp}>
                Chat WhatsApp 24/7
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
        </>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton color="tertiary" onClick={() => setAssistantOpen(true)}>
            <IonIcon icon={chatbubbles} />
          </IonFabButton>
        </IonFab>

      </IonContent>
    </IonPage>
  );
};

export default Home;
