#!/bin/bash

# Script para compilar y sincronizar cambios con Android sin abrir Android Studio
# Uso: ./scripts/android-sync.sh [--release]

set -e

echo "📱 Compilando proyecto web..."
yarn build

echo "🔄 Sincronizando con Android..."
npx cap sync android

# Fix: jcenter() fue eliminado de Gradle, reemplazar con mavenCentral()
sed -i 's/jcenter()/mavenCentral()/g' node_modules/@capacitor-community/http/android/build.gradle
echo "✔ Fix jcenter -> mavenCentral aplicado"

if [ "$1" == "--release" ]; then
  echo "🔨 Compilando APK release..."
  cd android && ./gradlew bundleRelease
  echo "✅ Bundle release generado en: android/app/build/outputs/bundle/release/"
else
  echo "🔨 Compilando APK debug..."
  cd android && ./gradlew assembleDebug
  echo "✅ APK debug generado en: android/app/build/outputs/apk/debug/"
fi

echo "✨ ¡Compilación completada!"
