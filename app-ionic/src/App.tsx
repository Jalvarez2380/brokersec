import React, { useEffect, useState } from "react";
import {
  IonApp,
  IonRouterOutlet,
  IonPage,
  IonContent,
  IonSpinner,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonAlert,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

const RouteComp: any = Route as any;
const RedirectComp: any = Redirect as any;
import { home, person, calculator, documentText, people } from "ionicons/icons";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { App as CapApp } from "@capacitor/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Cotizador from "./pages/Cotizador";
import Inspections from "./pages/Inspections";
import AdminPanel from "./pages/AdminPanel";
import { authService } from "./services/auth.service";
import { initStorage } from "./storage";
import { updateService } from "./services/update.service";
import { USE_MOCK_FALLBACK } from "./config";
import { normalizeAppUser, hasRole } from "./services/user.utils";
import { ADMIN_ROLES, COTIZADOR_ROLES, INSPECTION_ROLES } from "./constants/roles";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 10,
      retry: 2,
    },
  },
});

setupIonicReact({
  mode: "md",
  swipeBackEnabled: true,
});

const App: React.FC = () => {
  useEffect(() => {
    const handleTabChange = async () => {
      await queryClient.invalidateQueries();
    };
    document.addEventListener("ionTabsWillChange", handleTabChange);
    return () => {
      document.removeEventListener("ionTabsWillChange", handleTabChange);
    };
  }, []);

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | undefined>();

  const setupStatusBar = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        const platform = Capacitor.getPlatform();
        if (platform === "android") {
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setOverlaysWebView({ overlay: true });
        } else if (platform === "ios") {
          await StatusBar.setOverlaysWebView({ overlay: true });
        }
      } catch (error) {
        console.error("Error configurando StatusBar:", error);
      }
    }
  };

  const checkForUpdates = async () => {
    try {
      const updateInfo = await updateService.checkForUpdate();
      if (updateInfo.updateAvailable) {
        setUpdateAvailable(true);
        setUpdateVersion(updateInfo.latestVersion);
      }
      await updateService.ready();
    } catch (error) {
      console.error("Error verificando actualizaciones:", error);
    }
  };

  const setupBackButton = () => {
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await setupStatusBar();
        await initStorage();

        try {
          const auth = await Preferences.get({ key: "app_kickoff_authenticated" });
          const token = await Preferences.get({ key: "app_kickoff_token" });
          const user = await Preferences.get({ key: "app_kickoff_user" });
          if (auth?.value) localStorage.setItem("app_kickoff_authenticated", auth.value);
          if (token?.value) localStorage.setItem("app_kickoff_token", token.value);
          if (user?.value) localStorage.setItem("app_kickoff_user", user.value);
        } catch (e) {
          console.warn("Error sincronizando Preferences -> localStorage", e);
        }

        const authenticated = USE_MOCK_FALLBACK
          ? true
          : await authService.isAuthenticatedAsync();

        console.log("Auth check (MOCK:", USE_MOCK_FALLBACK, "):", authenticated);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const localUser = normalizeAppUser(authService.getCurrentUser());
          if (localUser) {
            setCurrentUser(localUser);
          }

          const remoteUser = normalizeAppUser(await authService.user());
          if (remoteUser) {
            setCurrentUser(remoteUser);
          }
        }

        setupBackButton();
        checkForUpdates();
        setIsReady(true);

        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
        }
      } catch (error) {
        console.error("Error inicializando:", error);
        setIsReady(true);
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
        }
      }
    };
    initialize();
    return () => { CapApp.removeAllListeners(); };
  }, []);

  const handleUpdateInstall = async () => {
    try {
      const result = await updateService.sync();
      if (result.updated) console.log("Actualización aplicada:", result.version);
    } catch (error) {
      console.error("Error instalando actualización:", error);
    }
    setUpdateAvailable(false);
  };

  if (!isReady) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding ion-text-center">
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <IonSpinner name="crescent" />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  const canUseCotizador = hasRole(currentUser, COTIZADOR_ROLES);
  const canViewInspections = hasRole(currentUser, INSPECTION_ROLES);
  const canManageUsers = hasRole(currentUser, ADMIN_ROLES);
  const canViewHome = !hasRole(currentUser, ["inspector"]);
  const canViewProfile = !hasRole(currentUser, ["inspector", "ventas"]);
  const defaultAuthenticatedRoute = canManageUsers
    ? "/tabs/admin"
    : canViewInspections
      ? "/tabs/inspecciones"
      : canUseCotizador
        ? "/tabs/cotizador"
        : "/tabs/inicio";

  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <IonAlert
          isOpen={updateAvailable}
          onDidDismiss={() => setUpdateAvailable(false)}
          header="Actualización Disponible"
          message={`Una nueva versión${updateVersion ? ` (${updateVersion})` : ""} está disponible. ¿Deseas actualizar ahora?`}
          buttons={[
            { text: "Más tarde", role: "cancel", handler: () => setUpdateAvailable(false) },
            { text: "Actualizar", handler: handleUpdateInstall },
          ]}
        />
        <IonReactRouter>
          <IonRouterOutlet>
            <RouteComp exact path="/login">
              {isAuthenticated ? <RedirectComp to={defaultAuthenticatedRoute} /> : <Login />}
            </RouteComp>
            <RouteComp exact path="/register" component={Register} />
            <RouteComp path="/tabs">
              {!isAuthenticated ? (
                <RedirectComp to="/login" />
              ) : (
                <IonTabs>
                  <IonRouterOutlet>
                    <RouteComp exact path="/tabs/inicio">
                      {canViewHome ? <Home /> : <RedirectComp to={defaultAuthenticatedRoute} />}
                    </RouteComp>
                    <RouteComp exact path="/tabs/perfil">
                      {canViewProfile ? <Profile /> : <RedirectComp to={defaultAuthenticatedRoute} />}
                    </RouteComp>
                    <RouteComp exact path="/tabs/cotizador">
                      {canUseCotizador ? <Cotizador /> : <RedirectComp to="/tabs/inicio" />}
                    </RouteComp>
                    <RouteComp exact path="/tabs/inspecciones">
                      {canViewInspections ? <Inspections /> : <RedirectComp to="/tabs/inicio" />}
                    </RouteComp>
                    <RouteComp exact path="/tabs/admin">
                      {canManageUsers ? <AdminPanel /> : <RedirectComp to="/tabs/inicio" />}
                    </RouteComp>
                    <RouteComp exact path="/tabs">
                      <RedirectComp to={defaultAuthenticatedRoute} />
                    </RouteComp>
                  </IonRouterOutlet>
                  <IonTabBar slot="bottom">
                    {canViewHome && (
                      <IonTabButton tab="inicio" href="/tabs/inicio">
                        <IonIcon icon={home} />
                        <IonLabel>Inicio</IonLabel>
                      </IonTabButton>
                    )}
                    {canUseCotizador && (
                      <IonTabButton tab="cotizador" href="/tabs/cotizador">
                        <IonIcon icon={calculator} />
                        <IonLabel>Cotizador</IonLabel>
                      </IonTabButton>
                    )}
                    {canViewInspections && (
                      <IonTabButton tab="inspecciones" href="/tabs/inspecciones">
                        <IonIcon icon={documentText} />
                        <IonLabel>Inspecciones</IonLabel>
                      </IonTabButton>
                    )}
                    {canManageUsers && (
                      <IonTabButton tab="admin" href="/tabs/admin">
                        <IonIcon icon={people} />
                        <IonLabel>Admin</IonLabel>
                      </IonTabButton>
                    )}
                    {canViewProfile && (
                      <IonTabButton tab="perfil" href="/tabs/perfil">
                        <IonIcon icon={person} />
                        <IonLabel>Perfil</IonLabel>
                      </IonTabButton>
                    )}
                  </IonTabBar>
                </IonTabs>
              )}
            </RouteComp>
            <RouteComp exact path="/">
              <RedirectComp to={isAuthenticated ? defaultAuthenticatedRoute : "/login"} />
            </RouteComp>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  );
};

export default App;
