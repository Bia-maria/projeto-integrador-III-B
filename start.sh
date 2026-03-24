#!/bin/bash
clear
echo ""
echo " ================================================"
echo "   HRD Consultoria T&D"
echo "   Sistema de Treinamento e Certificados"
echo " ================================================"
echo ""

# Verificar Node.js
if ! command -v node &>/dev/null; then
    echo " [ERRO] Node.js não encontrado!"
    echo ""
    echo " Instale o Node.js:"
    echo "   Mac:   https://nodejs.org  (versão LTS)"
    echo "   Linux: sudo apt install nodejs npm   (Ubuntu/Debian)"
    echo "          sudo yum install nodejs        (CentOS/Fedora)"
    echo ""
    echo " Após instalar, execute este script novamente."
    exit 1
fi

NODE_VER=$(node --version)
echo " [OK] Node.js $NODE_VER encontrado"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo ""
    echo " [1/3] Instalando dependências pela primeira vez..."
    echo "       (isso pode demorar 1-2 minutos)"
    echo ""
    npm install --silent
    if [ $? -ne 0 ]; then
        echo " [ERRO] Falha ao instalar dependências."
        echo " Verifique sua conexão com a internet e tente novamente."
        exit 1
    fi
    echo " [OK] Dependências instaladas"
fi

# Compilar o projeto
echo ""
echo " [2/3] Compilando o projeto..."
npm run build >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo " [ERRO] Falha na compilação."
    echo " Tente: npm run build  (para ver o erro detalhado)"
    exit 1
fi
echo " [OK] Projeto compilado"

# Iniciar servidor em segundo plano
echo ""
echo " [3/3] Iniciando o servidor... aguarde..."

npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000 >/dev/null 2>&1 &
SERVER_PID=$!

# Aguardar servidor ficar disponível
TENTATIVAS=0
while true; do
    TENTATIVAS=$((TENTATIVAS + 1))
    sleep 2
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        break
    fi
    if [ $TENTATIVAS -ge 30 ]; then
        echo ""
        echo " [AVISO] Servidor demorou mais que esperado."
        echo " Tente abrir manualmente: http://localhost:3000"
        break
    fi
    echo " Aguardando servidor... ($TENTATIVAS/30)"
done

echo ""
echo " ================================================"
echo ""
echo "   Sistema pronto!"
echo "   Acesse: http://localhost:3000"
echo ""
echo "   Contas de acesso:"
echo "   ADMIN       admin@hrd.com   / admin123"
echo "   Gestor RH   rh@hrd.com      / rh123456"
echo "   Colaborador joao@hrd.com    / colab123"
echo ""
echo "   Para parar: pressione Ctrl+C"
echo " ================================================"
echo ""

# Abrir navegador automaticamente
URL="http://localhost:3000"
if command -v xdg-open &>/dev/null; then
    xdg-open "$URL" >/dev/null 2>&1 &   # Linux
elif command -v open &>/dev/null; then
    open "$URL" >/dev/null 2>&1 &        # Mac
fi

# Manter script ativo (aguarda Ctrl+C)
trap "echo ''; echo ' Encerrando servidor...'; kill $SERVER_PID 2>/dev/null; exit 0" INT TERM
wait $SERVER_PID
