# Central de la Casa

Sistema doméstico: menú semanal, compras, remedios e historial.

## Estructura

    cocina/index.html     la app (tablet y teléfonos)
    cocina/manifest.json  para que se instale como app
    sw.js                 trae siempre la última versión al abrir
    icon-*.png            íconos

## Publicar una versión nueva

GitHub → el archivo → lápiz (o **Upload files**) → **Commit changes**.
En un minuto todos los dispositivos abren la versión nueva. No hay que
reinstalar nada ni tocar los datos: viven en Supabase, aparte de la app.

## Qué NO va acá

Ni la contraseña de la casa ni la llave `service_role`. Este repositorio es
público. Lo único secreto es el link de instalación, y ese no se versiona.
