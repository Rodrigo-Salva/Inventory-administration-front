# Arquitectura del Frontend - Inventory SaaS

Este documento describe las decisiones arquitectónicas y el flujo de datos dentro de la aplicación **Inventory SaaS**.

## 🏗️ Patrón Arquitectónico

La aplicación sigue un enfoque de **Arquitectura Modular por Capas**, lo que facilita la escalabilidad y el mantenimiento a largo plazo.

### 1. Capa de Presentación (Pages & Components)

- **Pages:** Son los puntos de entrada para cada ruta. Manejan la composición de componentes de alto nivel.
- **Components:** Piezas de UI reutilizables. Se dividen en:
  - `layout/`: Estructura global (Sidebar, Navbar).
  - `common/`: Componentes básicos (Button, Input, Badge).
  - `charts/`: Visualización especializada para el Dashboard.

### 2. Capa de Estado (Store)

- Utilizamos **Zustand** para el estado global (Sesión, Preferencias UI).
- Es una alternativa ligera a Redux que permite un acceso más directo y menos boilerplate.

### 3. Capa de Servicios y Datos (API & React Query)

- **Axios:** Cliente HTTP para comunicación con el backend.
- **React Query (TanStack Query):** Maneja el estado asíncrono, caché, reintentos y estados de carga de forma automática.
- **Interfases/Types:** Todas las respuestas de la API están tipadas para garantizar la integridad de los datos.

---

## 🔄 Flujo de Datos

1. El usuario interactúa con un **Componente**.
2. El componente activa una **Query** o **Mutation** de React Query.
3. React Query utiliza el cliente de **Axios** para pedir datos al backend.
4. Los datos regresan, se almacenan en la **caché**, y el componente se re-renderiza automáticamente.

---

## 🔐 Seguridad y Autenticación

- **JWT (JSON Web Tokens):** El token recibido al hacer login se almacena en `localStorage` (o en la store de Zustand).
- **Interceptores de Axios:** Cada petición se intercepta para añadir el Header `Authorization: Bearer <token>`.
- **Protección de Rutas:** El componente `App.tsx` utiliza un `PrivateRoute` para redirigir a `/login` si no hay una sesión activa.

---

## 🎨 Sistema de Diseño

- **Tailwind CSS:** Se utiliza para todo el diseño.
- **Configuración:** El archivo `tailwind.config.js` contiene la paleta de colores corporativa y extensiones de diseño.
- **Responsive-First:** Todos los componentes se desarrollan siguiendo la metodología _mobile-first_.

---

## 🧪 Validación de Datos

- **Zod:** Se definen esquemas de validación tanto para los formularios como (opcionalmente) para validar que los datos recibidos de la API cumplen con el contrato esperado.
- **React Hook Form:** Maneja el estado de los formularios, errores y envío de datos de manera eficiente.
