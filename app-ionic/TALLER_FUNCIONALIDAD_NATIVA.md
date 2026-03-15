# Taller de Funcionalidad Nativa - Brokersec

## Funcionalidad elegida

Se implemento la camara nativa de Capacitor para capturar:

- Foto del vehiculo
- Foto de la cedula del cliente

Esta funcionalidad es pertinente para Brokersec porque una cotizacion vehicular suele requerir respaldo visual del automotor y validacion basica de identidad del asegurado.

## Tecnologia utilizada

- Ionic React
- Capacitor
- Plugin oficial `@capacitor/camera`
- Ionic Storage para persistencia local de la evidencia

## Integracion tecnica

La pantalla de perfil/cotizacion ahora permite tomar o seleccionar imagenes usando el plugin de camara. Las fotos se convierten a `dataUrl`, se muestran en vista previa y se guardan en almacenamiento local para que sigan visibles aunque la app se recargue.

Archivos involucrados:

- `src/services/camera.service.ts`
- `src/storage/evidence.ts`
- `src/storage/index.ts`
- `src/pages/Profile.tsx`
- `package.json`

## Permisos

La app solicita permisos de camara y acceso a fotos cuando corre en dispositivo nativo. En Android e iOS, Capacitor sincroniza los ajustes del plugin durante `npx cap sync`.

## Capturas recomendadas

1. Pantalla del cotizador/perfil con el bloque "Inspeccion digital del vehiculo".
2. Dialogo de permisos de camara.
3. Selector "Tomar foto" / "Desde galeria".
4. Vista previa de la foto del vehiculo cargada.
5. Vista previa de la foto de la cedula cargada.
6. Cotizacion generada con el resumen de evidencia capturada.

## Pasos de prueba

1. Ejecutar la app en dispositivo o emulador con soporte de camara.
2. Ir a la pestana `Perfil`.
3. En "Inspeccion digital del vehiculo", tomar la foto del vehiculo.
4. Tomar la foto de la cedula.
5. Verificar que ambas imagenes aparezcan en pantalla.
6. Generar la cotizacion y confirmar que el resumen muestre el estado de evidencia.

## Bibliografia tecnica

- https://capacitorjs.com/docs/apis/camera
- https://ionicframework.com/docs/react
- https://capacitorjs.com/docs/guides/storage
