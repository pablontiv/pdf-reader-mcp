# /prd [instruccion] Comando para crear documentos PRD

Evalua la [instruccion] y crea un documento en la carpeta @docs/prd asignando el siguiente numero disponible segun el formato PRD[nnn]-[funcion].md

## Condiciones

- [instruccion] puede referirse a una accion nueva, o a una fase de otro documento en @docs/prd/
- Haz todas las preguntas necesarias para aclarar la instruccion antes de empezar a trabajar
- Si la [instruccion] implica tareas no atomicas (ver Resultado esperado) se debe confirmar con el usuario si desea crear multiples prd's

## Resultado esperado

- Un objetivo claro y atomico (un servicio, una configuracion, o cualquier cambio que pueda ser probado individualmente y aporte valor segun la [instruccion])
- Una lista de tareas secuenciales que puedan ser probadas y revertidas una a una
- Criterios de validacion o aceptacion (en caso de que aplique se debe exigir validacion de cliente lan con un network namespace)
- Reporte de la implementacion, incluyendo pero no limitado a:
  - Nombre de servicio
  - Ruta de acceso
  - Archivos de configuracion
  - IP's y puertos
  - Credenciales
  - Dependencias
  - Estrategia de rollback
