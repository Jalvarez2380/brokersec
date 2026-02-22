# 🔐 BROKERSEC Backend - API Proxy Seguro

Backend intermediario para consumo seguro de APIs externas en BROKERSEC.

## 🎯 Propósito

Este backend actúa como **proxy seguro** entre la app móvil y APIs externas, específicamente OpenWeatherMap para análisis de riesgo climático en cotizaciones de seguros.

### ¿Por qué un Backend intermediario?

✅ **Seguridad**: Protege API Keys sensibles (no se exponen en el cliente)  
✅ **Control**: Normaliza y valida respuestas de APIs externas  
✅ **Caché**: Reduce llamadas a APIs externas (ahorro de costos)  
✅ **Mantenibilidad**: Si la API externa cambia, solo se actualiza el backend  
✅ **Logging**: Monitoreo centralizado de todas las peticiones

---

## 📋 Funcionalidades

### 1. Consumo de OpenWeatherMap
- Clima actual por ciudad
- Pronóstico de 5 días
- Datos normalizados en español

### 2. Análisis de Riesgo Climático
- Calcula factor de riesgo basado en clima
- Incremento de prima según condiciones
- Justificación técnica del ajuste

### 3. Seguridad
- API Key interna (X-API-Key header)
- Rate limiting (100 requests/15min)
- CORS configurado
- Helmet headers

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y agregar tu API Key de OpenWeatherMap:

```env
OPENWEATHER_API_KEY="tu_api_key_aqui"
```

**Obtener API Key gratis:**
1. Ir a https://openweathermap.org/api
2. Registrarse (Free tier: 1000 llamadas/día)
3. Copiar API Key

### 3. Iniciar servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará en: **http://localhost:3001**

---

## 📡 Endpoints

### 1. Health Check
```http
GET /
```
Verifica que el servidor esté funcionando.

### 2. Clima Actual
```http
GET /api/v1/clima/actual/:ciudad?pais=EC
```

**Ejemplo:**
```bash
curl http://localhost:3001/api/v1/clima/actual/Quito?pais=EC
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ciudad": "Quito",
    "pais": "EC",
    "temperatura": 18,
    "sensacionTermica": 17,
    "humedad": 65,
    "viento": 3.5,
    "descripcion": "parcialmente nublado",
    "icono": "02d",
    "lluvia": 0,
    "visibilidad": 10000
  },
  "timestamp": "2025-02-16T21:00:00.000Z"
}
```

### 3. Pronóstico 5 Días
```http
GET /api/v1/clima/pronostico/:ciudad?pais=EC
```

**Ejemplo:**
```bash
curl http://localhost:3001/api/v1/clima/pronostico/Quito
```

### 4. Análisis de Riesgo Climático ⭐
```http
POST /api/v1/clima/riesgo
Content-Type: application/json

{
  "ciudad": "Quito",
  "pais": "EC"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "clima": { /* datos del clima */ },
    "analisisRiesgo": {
      "factor": 1.15,
      "porcentajeIncremento": "15.00",
      "justificacion": "Zona con lluvia moderada",
      "aplicarIncremento": true
    }
  }
}
```

**Uso en cotización:**
```
Prima base: $500
Factor de riesgo climático: 1.15
Prima ajustada: $500 × 1.15 = $575
```

### 5. Health Check del Servicio
```http
GET /api/v1/clima/health
```
Verifica conectividad con OpenWeatherMap.

---

## 🔒 Seguridad

### API Key Interna (Opcional)

Para habilitar, descomentar en `routes/weather.js`:
```javascript
router.use(verifyApiKey);
```

Luego, todas las peticiones deben incluir:
```http
X-API-Key: brokersec-internal-api-key-2025
```

---

## 🏗️ Arquitectura

```
App Móvil (Ionic React)
    ↓
    ↓ HTTP Request
    ↓
Backend Node.js (Este servidor)
    ↓
    ↓ Consume API Externa
    ↓
OpenWeatherMap API
    ↓
    ↓ Respuesta JSON
    ↓
Backend (Normaliza datos)
    ↓
    ↓ JSON propio
    ↓
App Móvil (Muestra información)
```

### Beneficios:
- ✅ API Keys protegidas en servidor
- ✅ Control de cambios de API externa
- ✅ Validación y normalización centralizada
- ✅ Caché posible (futuro)
- ✅ Logs y monitoring

---

## 🧪 Probar el Backend

### Con cURL:
```bash
# Clima actual
curl http://localhost:3001/api/v1/clima/actual/Quito

# Pronóstico
curl http://localhost:3001/api/v1/clima/pronostico/Guayaquil

# Análisis de riesgo
curl -X POST http://localhost:3001/api/v1/clima/riesgo \
  -H "Content-Type: application/json" \
  -d '{"ciudad":"Quito","pais":"EC"}'
```

### Con Postman / Thunder Client:
Importar colección de endpoints.

---

## 📂 Estructura del Código

```
backend/
├── src/
│   ├── config/
│   │   └── index.js          # Configuración centralizada
│   ├── controllers/
│   │   └── weatherController.js  # Lógica de endpoints
│   ├── services/
│   │   └── weatherService.js     # Consumo de OpenWeatherMap
│   ├── routes/
│   │   └── weather.js            # Definición de rutas
│   ├── middleware/
│   │   └── auth.js               # Autenticación y logging
│   └── server.js                 # Servidor principal
├── .env.example
├── package.json
└── README.md
```

---

## 🔧 Configuración Avanzada

### Rate Limiting
Modificar en `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests
```

### Timeout de API Externa
Modificar en `config/index.js`:
```javascript
timeout: 5000, // 5 segundos
```

---

## 🐛 Troubleshooting

### Error: API Key inválida
```
Error: API Key inválida o expirada
```
**Solución**: Verificar que `OPENWEATHER_API_KEY` en `.env` sea correcta.

### Error: Ciudad no encontrada
```
Error: Ciudad no encontrada
```
**Solución**: Verificar ortografía de la ciudad. Usar nombres en español.

### Error: Servicio no disponible
```
Servicio de clima no disponible
```
**Solución**: 
1. Verificar conexión a internet
2. Verificar que OpenWeatherMap esté operativo
3. Verificar timeout en config

---

## 📊 Métricas de Uso

- Tiempo de respuesta promedio: ~300-500ms
- Límite de API gratuita: 1000 llamadas/día
- Cache recomendado: 10-15 minutos para misma ciudad

---

## 🚀 Mejoras Futuras

- [ ] Implementar caché con Redis
- [ ] Agregar más APIs externas (noticias, mapas)
- [ ] Implementar JWT real para autenticación
- [ ] Agregar tests con Jest
- [ ] Logging avanzado con Winston
- [ ] Metrics con Prometheus

---

**Desarrollado para BROKERSEC - Universidad Estatal Amazónica**
