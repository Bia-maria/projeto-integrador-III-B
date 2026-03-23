#!/bin/bash
echo "================================================"
echo "  HRD Consultoria T&D - Iniciando o sistema..."
echo "================================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo "Baixe em: https://nodejs.org  (versão 18 ou superior)"
    exit 1
fi

echo "[OK] Node.js encontrado: $(node --version)"

# Instalar dependências (somente se necessário)
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[1/3] Instalando dependências... (pode demorar ~1 min)"
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao instalar dependências."
        exit 1
    fi
fi

# Compilar o projeto
echo ""
echo "[2/3] Compilando o projeto..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha na compilação."
    exit 1
fi

# Iniciar o servidor
echo ""
echo "[3/3] Iniciando o servidor..."
echo ""
echo "================================================"
echo "  Sistema rodando em: http://localhost:3000"
echo ""
echo "  Login ADMIN:       admin@hrd.com / admin123"
echo "  Login RH:          rh@hrd.com / rh123456"
echo "  Login Colaborador: joao@hrd.com / colab123"
echo ""
echo "  Pressione Ctrl+C para parar o servidor"
echo "================================================"
echo ""

npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
