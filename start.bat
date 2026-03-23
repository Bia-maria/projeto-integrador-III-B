@echo off
echo ================================================
echo   HRD Consultoria T^&D - Iniciando o sistema...
echo ================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe em: https://nodejs.org  (versao 18 ou superior)
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: 
node --version

:: Instalar dependencias (somente se necessario)
IF NOT EXIST "node_modules" (
    echo.
    echo [1/3] Instalando dependencias... (pode demorar ~1 min)
    npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

:: Compilar o projeto
echo.
echo [2/3] Compilando o projeto...
npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha na compilacao.
    pause
    exit /b 1
)

:: Iniciar o servidor
echo.
echo [3/3] Iniciando o servidor...
echo.
echo ================================================
echo   Sistema rodando em: http://localhost:3000
echo.
echo   Login ADMIN:       admin@hrd.com / admin123
echo   Login RH:          rh@hrd.com / rh123456
echo   Login Colaborador: joao@hrd.com / colab123
echo.
echo   Pressione Ctrl+C para parar o servidor
echo ================================================
echo.

npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
pause
