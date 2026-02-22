import React, { useState, useEffect, useRef } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonText, IonToast, IonBadge,
} from "@ionic/react";
import {
  documentText, mail, print, calculator,
  car, checkmarkCircle, alertCircle, download,
} from "ionicons/icons";

interface Usuario {
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

const Profile: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehiculo>({
    marca: "", modelo: "", anio: "", valorCasco: "", valorExtras: "0",
  });
  const [cotizacion, setCotizacion] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("brokersec_usuario") || localStorage.getItem("app_kickoff_user");
    if (raw) {
      try { setUsuario(JSON.parse(raw)); } catch {}
    }
  }, []);

  const calcularPrima = () => {
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

    setCotizacion({
      fecha: new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" }),
      usuario,
      vehiculo: { ...vehiculo },
      valorCasco: casco,
      valorExtras: extras,
      valorAsegurado,
      primaNeta: primaNeta.toFixed(2),
      iva: iva.toFixed(2),
      primaTotal: primaTotal.toFixed(2),
      cuotaMensual: cuotaMensual.toFixed(2),
    });
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
    setToastMsg("Abriendo cliente de correo...");
    setToastColor("primary");
    setShowToast(true);
  };

  const inputStyle = { "--background": "#f0f4ff" } as any;

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
          <IonCard style={{ margin: 0, border: "2px solid #1a73e8", borderRadius: 12 }}>
            <IonCardHeader style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonIcon icon={car} color="primary" style={{ fontSize: 20 }} />
                <IonCardTitle style={{ fontSize: 16, color: "#1a73e8" }}>Datos del Vehiculo</IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="6" style={{ paddingLeft: 0, paddingRight: 4 }}>
                    <IonItem lines="full" style={inputStyle}>
                      <IonLabel position="stacked">Marca *</IonLabel>
                      <IonInput value={vehiculo.marca} placeholder="Ej. FORD"
                        onIonInput={(e) => setVehiculo({ ...vehiculo, marca: e.detail.value as string })} />
                    </IonItem>
                  </IonCol>
                  <IonCol size="6" style={{ paddingRight: 0, paddingLeft: 4 }}>
                    <IonItem lines="full" style={inputStyle}>
                      <IonLabel position="stacked">Modelo *</IonLabel>
                      <IonInput value={vehiculo.modelo} placeholder="Ej. F150"
                        onIonInput={(e) => setVehiculo({ ...vehiculo, modelo: e.detail.value as string })} />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="4" style={{ paddingLeft: 0, paddingRight: 4 }}>
                    <IonItem lines="full" style={inputStyle}>
                      <IonLabel position="stacked">Año *</IonLabel>
                      <IonInput type="number" value={vehiculo.anio} placeholder="2020"
                        onIonInput={(e) => setVehiculo({ ...vehiculo, anio: e.detail.value as string })} />
                    </IonItem>
                  </IonCol>
                  <IonCol size="4" style={{ paddingRight: 4, paddingLeft: 4 }}>
                    <IonItem lines="full" style={inputStyle}>
                      <IonLabel position="stacked">Valor Casco $*</IonLabel>
                      <IonInput type="number" value={vehiculo.valorCasco} placeholder="25000"
                        onIonInput={(e) => setVehiculo({ ...vehiculo, valorCasco: e.detail.value as string })} />
                    </IonItem>
                  </IonCol>
                  <IonCol size="4" style={{ paddingRight: 0, paddingLeft: 4 }}>
                    <IonItem lines="full" style={inputStyle}>
                      <IonLabel position="stacked">Extras $</IonLabel>
                      <IonInput type="number" value={vehiculo.valorExtras} placeholder="500"
                        onIonInput={(e) => setVehiculo({ ...vehiculo, valorExtras: e.detail.value as string })} />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {error && (
                <IonText color="danger">
                  <p style={{ fontSize: 12, margin: "6px 0 0" }}>{error}</p>
                </IonText>
              )}

              <IonButton expand="block" onClick={calcularPrima} style={{ marginTop: 12 }}>
                <IonIcon icon={calculator} slot="start" />
                Calcular Cotizacion
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
              Ingresa los datos del vehiculo y presiona "Calcular Cotizacion" para generar tu presupuesto
            </p>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Profile;
