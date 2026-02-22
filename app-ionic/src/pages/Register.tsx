import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from "@ionic/react";
import { authService } from "../services/auth.service";
import { RefresherEventDetail } from "@ionic/core";
import { useRefreshData } from "../hooks/useRealtimeData";
import { registerSchema, RegisterFormData } from "../schemas/auth.schemas";
import { FormInput } from "../components/FormInput";

const Register: React.FC = () => {
  const { refreshProfile } = useRefreshData();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      dni: "",
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      mobile: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);

    try {
      const registerData = {
        dni: data.dni,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        mobile: data.mobile || undefined,
      };

      await authService.signup(registerData);

      setSuccess("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Error al conectar con el servidor 3001");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Registrarse</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Desliza para actualizar" refreshingSpinner="circles" />
        </IonRefresher>

        <div style={{ maxWidth: "450px", margin: "0 auto", padding: "10px" }}>
          
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <img 
              src="/assets/logo-brokersec.png" 
              style={{ width: '180px', height: 'auto' }} 
              alt="Logo BROKERSEC" 
            />
            <h2 style={{ color: '#005495', fontWeight: 'bold' }}>BROKERSEC</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormInput name="dni" control={control} label="DNI / Cédula" placeholder="Ej: 0999999999" error={errors.dni?.message} />

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <FormInput name="firstName" control={control} label="Nombre" placeholder="Tu nombre" error={errors.firstName?.message} />
              </div>
              <div style={{ flex: 1 }}>
                <FormInput name="lastName" control={control} label="Apellido" placeholder="Tu apellido" error={errors.lastName?.message} />
              </div>
            </div>

            <FormInput name="email" control={control} label="Email" type="email" placeholder="correo@ejemplo.com" error={errors.email?.message} />
            <FormInput name="username" control={control} label="Usuario" placeholder="jose.antonio" error={errors.username?.message} />
            <FormInput name="mobile" control={control} label="Teléfono" type="tel" placeholder="0999772225" error={errors.mobile?.message} />
            <FormInput name="password" control={control} label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password?.message} />
            <FormInput name="confirmPassword" control={control} label="Confirmar" type="password" placeholder="Repite contraseña" error={errors.confirmPassword?.message} />

            {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: 'green', textAlign: 'center', marginBottom: '10px' }}>{success}</div>}

            <IonButton type="submit" expand="block" disabled={isSubmitting} style={{ height: "50px", "--background": "#005495" }}>
              {isSubmitting ? <IonSpinner name="crescent" /> : "Crear Cuenta"}
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;