# FullStack Template - Frontend

A modern, reusable React frontend template with authentication, built for full-stack applications.

## Features

- 🔐 **Authentication System** - Complete login/register/verification flow
- 🎨 **Modern UI** - Glassmorphism design with Framer Motion animations
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🔧 **Reusable Components** - Modular component architecture
- 🚀 **Production Ready** - Optimized build and deployment ready
- 🎯 **TypeScript Ready** - Easy to convert to TypeScript if needed

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── Auth/          # Authentication components
│   ├── elements/      # Reusable UI elements
│   └── ui/           # UI components (Navbar, Background)
├── config/           # App configuration
├── contexts/         # React contexts
├── hooks/           # Custom hooks
├── pages/           # Page components
├── utils/           # Utility functions
├── App.js           # Main app component
└── index.js         # App entry point
```

## Key Features

### 🔐 Complete Authentication System
- Login/Register forms with smooth animations
- Email verification with 6-digit codes
- Secure JWT token handling with httpOnly cookies
- Automatic token refresh

### 🎨 Modern UI Components
- Glassmorphism design with backdrop blur effects
- Smooth animations with Framer Motion
- Responsive design with Tailwind CSS
- Customizable color themes

### 🔧 Highly Configurable
- Central configuration file (`src/config/app.js`)
- Easy customization of branding, navigation, and API endpoints
- Theme customization with simple config changes

### 📱 Production-Ready
- Optimized bundle size (removed unused map libraries)
- TypeScript-ready architecture
- Comprehensive error handling
- Mobile-first responsive design

## Quick Customization

1. **Update App Name & Branding**
   ```javascript
   // src/config/app.js
   export const APP_CONFIG = {
     name: "Your App Name",
     logo: { text: "YourApp" },
     // ... other settings
   };
   ```

2. **Add Your Pages**
   ```javascript
   // src/App.js - Add to renderPage() function
   case "/your-page":
     return <YourPage />;
   ```

3. **Customize Navigation**
   ```javascript
   // src/config/app.js
   navigation: {
     authenticated: [
       { name: "Dashboard", href: "/dashboard" },
       { name: "Settings", href: "/settings" },
     ]
   }
   ```

## Documentation

- 📖 **[Setup Guide](../SETUP_GUIDE.md)** - Detailed customization instructions
- 🔧 **[Configuration](src/config/app.js)** - App settings and theming
- 🎨 **[Components](src/components/)** - Reusable UI components

## What's Removed from NASA Project

This template removes project-specific elements:
- ❌ Weather/map-related components (leaflet, maplibre-gl, react-leaflet, react-map-gl)
- ❌ NASA-specific branding and content
- ❌ Weather data fetching and visualization
- ❌ Location-based features
- ✅ Kept all reusable authentication and UI components
- ✅ Maintained modern design and animations
- ✅ Preserved utility functions and contexts

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
