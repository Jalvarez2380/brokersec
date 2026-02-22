import React, { useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonList,
  IonListHeader, IonText, IonSelect, IonSelectOption, IonAlert,
} from "@ionic/react";

const ANO_ACTUAL = 2026;
const MARCAS = ["Toyota", "Chevrolet", "Hyundai", "Kia", "Mazda", "Nissan", "Ford", "Volkswagen", "Honda", "Otro"];

const Cotizador: React.FC = () => {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [valor, setValor] = useState("");
  const [extras, setExtras] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [errorAnio, setErrorAnio] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const calcular = () => {
    const anioNum = parseInt(anio);
    const valorNum = parseFloat(valor) || 0;
    const extrasNum = parseFloat(extras) || 0;

    if (!anio || isNaN(anioNum) || anioNum < 1900 || anioNum > ANO_ACTUAL) {
      setErrorAnio("Ingresa un año válido.");
      return;
    }
    if (ANO_ACTUAL - anioNum > 10) {
      setErrorAnio("");
      setShowAlert(true);
      return;
    }
    if (!marca || !modelo || valorNum <= 0) {
      setErrorAnio("Completa todos los campos obligatorios.");
      return;
    }

    setErrorAnio("");
    const valorTotal = valorNum + extrasNum;
    const primaNeta = valorTotal * 0.035;
    const superBancos = primaNeta * 0.035;
    const seguroCampesino = primaNeta * 0.005;
    const derechoEmision = 5.0;
    const subtotal = primaNeta + superBancos + seguroCampesino + derechoEmision;
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    setResultado({
      marca, modelo, anio: anioNum,
      valorVehiculo: valorNum,
      extrasValor: extrasNum,
      valorTotal, primaNeta, superBancos,
      seguroCampesino, derechoEmision, subtotal, iva, total,
    });
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Cotizador BROKERSEC</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Vehiculo no cotizable"
          message={`Los vehiculos fabricados antes de ${ANO_ACTUAL - 10} (mas de 10 anos) no son elegibles para cotizacion en BROKERSEC.`}
          buttons={["Aceptar"]}
        />

        <IonList>
          <IonListHeader><IonLabel><h2>Datos del Vehiculo</h2></IonLabel></IonListHeader>

          <IonItem>
            <IonLabel position="stacked">Marca *</IonLabel>
            <IonSelect value={marca} placeholder="Selecciona la marca"
              onIonChange={(e) => setMarca(e.detail.value)}>
              {MARCAS.map((m) => (
                <IonSelectOption key={m} value={m}>{m}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Modelo *</IonLabel>
            <IonInput value={modelo} placeholder="Ej. Corolla, Aveo, Tucson"
              onIonInput={(e) => setModelo(e.detail.value as string)} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Ano de Fabricacion *</IonLabel>
            <IonInput type="number" value={anio} placeholder={`Ej. ${ANO_ACTUAL - 5}`}
              onIonInput={(e) => setAnio(e.detail.value as string)} />
          </IonItem>
          {errorAnio ? (
            <IonItem lines="none">
              <IonText color="danger"><p>{errorAnio}</p></IonText>
            </IonItem>
          ) : null}

          <IonItem>
            <IonLabel position="stacked">Valor del Vehiculo ($) *</IonLabel>
            <IonInput type="number" value={valor} placeholder="Ej. 45000"
              onIonInput={(e) => setValor(e.detail.value as string)} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Valor de Extras ($)</IonLabel>
            <IonInput type="number" value={extras} placeholder="Ej. 2000 (GPS, alarma, etc.)"
              onIonInput={(e) => setExtras(e.detail.value as string)} />
          </IonItem>
        </IonList>

        <IonButton expand="block" onClick={calcular} style={{ marginTop: 16 }}>
          Calcular Cotizacion
        </IonButton>

        {resultado && (
          <>
            {/* DESGLOSE */}
            <IonList style={{ marginTop: 24 }}>
              <IonListHeader color="light">
                <IonLabel><h2>Desglose de Cotizacion</h2></IonLabel>
              </IonListHeader>
              <IonItem>
                <IonLabel>Vehiculo</IonLabel>
                <IonText slot="end">{resultado.marca} {resultado.modelo} {resultado.anio}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Valor del Vehiculo</IonLabel>
                <IonText slot="end">{fmt(resultado.valorVehiculo)}</IonText>
              </IonItem>
              {resultado.extrasValor > 0 && (
                <IonItem>
                  <IonLabel>Extras</IonLabel>
                  <IonText slot="end">{fmt(resultado.extrasValor)}</IonText>
                </IonItem>
              )}
              <IonItem>
                <IonLabel>Valor Total Asegurado</IonLabel>
                <IonText slot="end"><strong>{fmt(resultado.valorTotal)}</strong></IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Prima Neta (3.5%)</IonLabel>
                <IonText slot="end">{fmt(resultado.primaNeta)}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Super de Bancos (3.5%)</IonLabel>
                <IonText slot="end">{fmt(resultado.superBancos)}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Seguro Campesino (0.5%)</IonLabel>
                <IonText slot="end">{fmt(resultado.seguroCampesino)}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Derecho de Emision</IonLabel>
                <IonText slot="end">{fmt(resultado.derechoEmision)}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel><strong>Subtotal</strong></IonLabel>
                <IonText slot="end"><strong>{fmt(resultado.subtotal)}</strong></IonText>
              </IonItem>
              <IonItem>
                <IonLabel>IVA (15%)</IonLabel>
                <IonText slot="end">{fmt(resultado.iva)}</IonText>
              </IonItem>
              <IonItem color="primary">
                <IonLabel><strong>TOTAL A PAGAR</strong></IonLabel>
                <IonText slot="end"><strong>{fmt(resultado.total)}</strong></IonText>
              </IonItem>
            </IonList>

            {/* FORMAS DE PAGO */}
            <IonList style={{ marginTop: 16 }}>
              <IonListHeader color="light">
                <IonLabel><h2>Forma de Pago</h2></IonLabel>
              </IonListHeader>

              <IonItem button detail
                onClick={() => alert(`Pago de contado seleccionado.\nTotal: ${fmt(resultado.total)}\nUn asesor se contactara contigo.`)}>
                <IonLabel>
                  <h3>💵 Pago de Contado</h3>
                  <p>Pago unico — Sin recargo adicional</p>
                </IonLabel>
                <IonText slot="end" color="success"><strong>{fmt(resultado.total)}</strong></IonText>
              </IonItem>

              <IonItem button detail
                onClick={() => alert(`Debito Automatico Mensual\n\nBancos disponibles:\n- Banco Pichincha\n- Banco Guayaquil\n- Banco Pacifico\n- Banco Internacional\n- Produbanco\n- Banco del Austro\n\nCuota mensual: ${fmt(resultado.total / 12)}/mes`)}>
                <IonLabel>
                  <h3>🏦 Debito Automatico Mensual</h3>
                  <p>Pichincha · Guayaquil · Pacifico · Internacional · Produbanco · Austro</p>
                </IonLabel>
                <IonText slot="end" color="primary"><strong>{fmt(resultado.total / 12)}/mes</strong></IonText>
              </IonItem>

              <IonItem button detail
                onClick={() => alert(`Tarjeta de Credito\n\nTarjetas aceptadas:\n- Visa\n- Mastercard\n- American Express\n- Diners Club\n\nHasta 12 meses sin intereses.\nCuota: ${fmt(resultado.total / 12)}/mes`)}>
                <IonLabel>
                  <h3>💳 Tarjeta de Credito</h3>
                  <p>Visa · Mastercard · Amex · Diners — Hasta 12 meses sin intereses</p>
                </IonLabel>
                <IonText slot="end" color="tertiary"><strong>{fmt(resultado.total / 12)}/mes</strong></IonText>
              </IonItem>
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Cotizador;
