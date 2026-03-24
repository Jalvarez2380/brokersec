import React, { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { close, paperPlane, sparkles } from "ionicons/icons";
import { sendAssistantMessage } from "../services/assistant.service";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hola, soy el asistente de BROKERSEC. Puedo ayudarte con cotizaciones, registro, coberturas y uso de la app.",
    },
  ]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendAssistantMessage(trimmed, previousResponseId);
      setPreviousResponseId(reply.previousResponseId);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: reply.response,
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error?.message || "No pude responder en este momento. Intenta de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Asistente BROKERSEC</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonNote color="medium">
          Responde dudas sobre seguros, cotizacion, registro e inspecciones desde la app.
        </IonNote>

        <IonList inset style={{ marginTop: 16 }}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: message.role === "user" ? "#dbeafe" : "#f3f4f6",
                  color: "#111827",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  {message.role === "user" ? "Tu" : "Asistente"}
                </div>
                <IonText>{message.text}</IonText>
              </div>
            </div>
          ))}
        </IonList>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <IonSpinner name="dots" />
            <IonText color="medium">Pensando respuesta...</IonText>
          </div>
        )}

        <IonItem lines="inset">
          <IonLabel position="stacked">Escribe tu duda</IonLabel>
          <IonInput
            value={input}
            placeholder="Ej. Que cubre una poliza todo riesgo?"
            onIonInput={(event) => setInput(event.detail.value ?? "")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
          />
        </IonItem>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <IonButton expand="block" fill="outline" onClick={onClose}>
            Cerrar
          </IonButton>
          <IonButton expand="block" onClick={handleSend} disabled={loading || !input.trim()}>
            <IonIcon icon={paperPlane} slot="start" />
            Enviar
          </IonButton>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 12,
            background: "#eff6ff",
            color: "#1d4ed8",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <IonIcon icon={sparkles} style={{ minWidth: 18, marginTop: 2 }} />
          <div style={{ fontSize: 13 }}>
            Este asistente usa OpenAI desde el backend para mantener la clave segura.
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AssistantModal;
