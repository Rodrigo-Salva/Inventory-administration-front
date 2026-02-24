# 🚀 Inventory SaaS - Frontend

¡Bienvenido al frontend de **Inventory SaaS**! Esta es una aplicación web moderna, robusta y escalable diseñada para la gestión inteligente de inventarios, proveedores, productos y usuarios.

Desarrollada con las últimas tecnologías en el ecosistema de React, esta aplicación ofrece una experiencia de usuario (UX) fluida, un diseño responsivo y una arquitectura de código limpia y mantenible.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza un stack moderno enfocado en la velocidad de desarrollo y el rendimiento:

- **Framework:** [React 18](https://reactjs.org/) con [Vite](https://vitejs.dev/) para una compilación ultra rápida.
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) para un tipado estático seguro.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para un diseño moderno y responsivo sin salir de las clases de utilidad.
- **Estado Global:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - Gestión de estado simple, pequeña y rápida.
- **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest) para el manejo de caché y sincronización con el servidor.
- **Formularios:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) para validación robusta de esquemas.
- **Iconos:** [Lucide React](https://lucide.dev/) para una iconografía consistente.
- **Gráficos:** [Recharts](https://recharts.org/) para la visualización de datos en el dashboard.
- **Comunicación HTTP:** [Axios](https://axios-http.com/) con interceptores para manejo de tokens JWT.

---

## ✨ Características Principales

- 📊 **Dashboard Interactivo:** Resumen visual de métricas clave mediante gráficos dinámicos.
- 📦 **Gestión de Productos:** CRUD completo de productos con filtrado, paginación y categorización.
- 📁 **Categorías y Proveedores:** Control detallado de la cadena de suministro.
- 📉 **Control de Inventario:** Monitoreo de movimientos de stock en tiempo real.
- 👤 **Gestión de Usuarios:** Panel administrativo para control de accesos y perfiles.
- 🔐 **Autenticación Segura:** Sistema de login con persistencia de sesión mediante JWT.
- 🌓 **Diseño Responsivo:** Adaptado completamente a dispositivos móviles y escritorio.
- ⚙️ **Configuración Personalizada:** Ajustes generales del sistema y perfil del usuario.

---

## 📁 Estructura del Proyecto

```text
src/
├── api/          # Configuración de Axios e interceptores
├── components/   # Componentes UI reutilizables
│   ├── charts/   # Componentes de visualización de datos
│   ├── common/   # Botones, inputs, modales, etc.
│   └── layout/   # Sidebar, Navbar y estructura general
├── pages/        # Componentes de página (vistas principales)
├── store/        # Stores de Zustand (auth, ui, etc.)
├── types/        # Definiciones de TypeScript
├── App.tsx       # Enrutamiento y configuración principal
└── main.tsx      # Punto de entrada de la aplicación
```

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

### Pasos para Empezar

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd front-inventory-saas
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz (basándote en `.env.example`) y configura la URL del backend:

   ```env
   VITE_API_URL=http://localhost:8001
   ```

4. **Iniciar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

5. **Construir para producción**
   ```bash
   npm run build
   ```

---

## 📝 Convenciones de Código

- **Componentes:** Se utilizan Functional Components con Hooks.
- **Naming:** CamelCase para variables/archivos convencionales y PascalCase para componentes React.
- **Estilos:** Priorizar clases de Tailwind CSS. Evitar CSS embebido a menos que sea estrictamente necesario.
- **Tipado:** No utilizar `any`. Definir interfaces o tipos para todas las props y respuestas de API.

---

## 🤝 Contribución

1. Haz un Fork del proyecto.
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`).
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4. Haz Push a la rama (`git push origin feature/AmazingFeature`).
5. Abre un Pull Request.

---

Desarrollado con ❤️ para la gestión eficiente de inventarios.
