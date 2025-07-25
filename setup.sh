#!/bin/bash

# Script de configuración automática para Plataforma de Servicios Eléctricos Chile
# Autor: Servicios Eléctricos Chile
# Fecha: Diciembre 2024

set -e

echo "🔧 Configurando Plataforma de Servicios Eléctricos Chile..."
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instale Node.js >= 16.0.0"
        log_info "Descarga desde: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [[ "$(printf '%s\n' "16.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "16.0.0" ]]; then
        log_error "Se requiere Node.js >= 16.0.0. Versión actual: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js versión $NODE_VERSION ✓"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    log_success "npm $(npm -v) ✓"
    
    # Verificar MongoDB (opcional)
    if command -v mongod &> /dev/null; then
        log_success "MongoDB encontrado ✓"
    else
        log_warning "MongoDB no encontrado. Asegúrese de tener MongoDB disponible"
        log_info "Puede usar MongoDB Atlas o instalar localmente"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git no está instalado"
        exit 1
    fi
    
    log_success "Git $(git --version | cut -d' ' -f3) ✓"
}

# Instalar dependencias del backend
install_backend() {
    log_info "Instalando dependencias del backend..."
    
    npm install
    
    if [ $? -eq 0 ]; then
        log_success "Dependencias del backend instaladas ✓"
    else
        log_error "Error instalando dependencias del backend"
        exit 1
    fi
}

# Instalar dependencias del frontend
install_frontend() {
    log_info "Instalando dependencias del frontend..."
    
    cd client
    npm install
    cd ..
    
    if [ $? -eq 0 ]; then
        log_success "Dependencias del frontend instaladas ✓"
    else
        log_error "Error instalando dependencias del frontend"
        exit 1
    fi
}

# Configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Archivo .env creado desde .env.example ✓"
        log_warning "⚠️  IMPORTANTE: Edite el archivo .env con sus credenciales"
        log_info "Necesitará configurar:"
        echo "   - MONGODB_URI"
        echo "   - JWT_SECRET"
        echo "   - GOOGLE_CLOUD_PROJECT_ID"
        echo "   - OPENAI_API_KEY"
        echo "   - AWS credentials (opcional)"
        echo "   - ClaveÚnica credentials (opcional)"
    else
        log_info "Archivo .env ya existe"
    fi
}

# Configurar Tailwind CSS
setup_tailwind() {
    log_info "Configurando Tailwind CSS..."
    
    cd client
    
    # Verificar si PostCSS config existe
    if [ ! -f postcss.config.js ]; then
        cat > postcss.config.js << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
        log_success "postcss.config.js creado ✓"
    fi
    
    # Verificar si el archivo CSS principal existe
    if [ ! -f src/index.css ]; then
        mkdir -p src
        cat > src/index.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
}
EOF
        log_success "src/index.css creado ✓"
    fi
    
    cd ..
}

# Crear estructura de directorios
create_directories() {
    log_info "Creando estructura de directorios..."
    
    # Backend directories
    mkdir -p config
    mkdir -p uploads
    mkdir -p logs
    mkdir -p tests
    
    # Frontend directories
    mkdir -p client/src/components/{Layout,Common,Auth,Dashboard,Chat,VoiceRequest}
    mkdir -p client/src/pages/{Auth,Dashboard,Quotations,Reports,Chat,VoiceRequest,Profile,Technicians}
    mkdir -p client/src/{contexts,hooks,services,utils}
    mkdir -p client/public
    
    log_success "Estructura de directorios creada ✓"
}

# Configurar Git hooks (opcional)
setup_git_hooks() {
    log_info "Configurando Git hooks..."
    
    if [ -d .git ]; then
        # Pre-commit hook para linting
        cat > .git/hooks/pre-commit << EOF
#!/bin/sh
# Pre-commit hook para linting

echo "🔍 Ejecutando linting..."

# Backend linting
npm run lint
if [ \$? -ne 0 ]; then
    echo "❌ Linting del backend falló"
    exit 1
fi

# Frontend linting
cd client
npm run lint
if [ \$? -ne 0 ]; then
    echo "❌ Linting del frontend falló"
    exit 1
fi

echo "✅ Linting completado"
EOF
        
        chmod +x .git/hooks/pre-commit
        log_success "Git pre-commit hook configurado ✓"
    else
        log_warning "No es un repositorio Git, saltando configuración de hooks"
    fi
}

# Generar JWT secret si no existe
generate_jwt_secret() {
    if [ -f .env ]; then
        if grep -q "your_jwt_secret_key_here" .env; then
            log_info "Generando JWT secret..."
            JWT_SECRET=$(openssl rand -hex 32)
            if command -v openssl &> /dev/null; then
                sed -i.bak "s/your_jwt_secret_key_here/$JWT_SECRET/" .env
                rm .env.bak 2>/dev/null || true
                log_success "JWT secret generado automáticamente ✓"
            else
                log_warning "OpenSSL no disponible. Genere manualmente un JWT secret"
            fi
        fi
    fi
}

# Mostrar información final
show_final_info() {
    echo ""
    echo "🎉 ¡Configuración completada!"
    echo "========================="
    echo ""
    log_info "Próximos pasos:"
    echo "1. Edite el archivo .env con sus credenciales"
    echo "2. Inicie MongoDB (si usa instalación local)"
    echo "3. Ejecute: npm run dev"
    echo ""
    log_info "Comandos útiles:"
    echo "• npm run dev          - Iniciar desarrollo completo"
    echo "• npm run server       - Solo backend"
    echo "• npm run client       - Solo frontend"
    echo "• npm test             - Ejecutar pruebas"
    echo "• npm run lint         - Verificar código"
    echo ""
    log_info "URLs locales:"
    echo "• Frontend: http://localhost:3000"
    echo "• Backend API: http://localhost:5000"
    echo "• API Health: http://localhost:5000/health"
    echo ""
    log_warning "⚠️  Recuerde configurar las variables de entorno antes de iniciar"
    echo ""
    log_info "Para más información, consulte README.md"
    echo ""
    echo "🇨🇱 ¡Gracias por usar la Plataforma de Servicios Eléctricos Chile!"
}

# Función principal
main() {
    echo "Iniciando configuración automática..."
    
    check_prerequisites
    install_backend
    install_frontend
    setup_environment
    setup_tailwind
    create_directories
    setup_git_hooks
    generate_jwt_secret
    show_final_info
}

# Manejo de errores
trap 'log_error "Error en línea $LINENO. Configuración interrumpida."; exit 1' ERR

# Ejecutar función principal
main

exit 0