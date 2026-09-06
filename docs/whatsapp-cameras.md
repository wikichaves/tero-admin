# Cámaras por WhatsApp

Enviar `camaras` para recibir las últimas fotos guardadas, o `camaras esquina` para filtrar por cámara o propiedad. También se aceptan `cámaras`, `camara`, `cameras`, `cam` y el prefijo `/`. Los filtros ignoran mayúsculas y tildes.

Solo admin y gestor pueden solicitar fotos. Admin ve todas las propiedades; gestor únicamente las asignadas en `profile_properties`. Un gestor sin asignaciones no recibe fotos. No se usa el país seleccionado en la web: WhatsApp no comparte esa sesión.

Solo se envían cámaras activas con snapshot HTTPS. El comando no despierta las cámaras ni solicita video: usa el proceso de capturas existente y muestra la antigüedad de cada foto. Los envíos se registran en la conversación y continúan si falla una imagen.

Verificación de producción: desde un número autorizado, enviar `camaras esquina`, comprobar foto y antigüedad; luego `camaras` y `ayuda`. Verificar con un gestor que no reciba cámaras de propiedades no asignadas. Estas pruebas generan mensajes reales; no se ejecutan durante build/lint.
