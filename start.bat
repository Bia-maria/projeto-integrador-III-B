@echo off
chcp 65001 >nul 2>&1
title HRD Consultoria T&D

echo.
echo  ================================================
echo    HRD Consultoria T^&D
echo    Sistema de Treinamento e Certificados
echo  ================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Baixe e instale em: https://nodejs.org
    echo  Escolha a versao LTS ^(botao verde^)
    echo  Apos instalar, feche e abra este arquivo novamente.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% encontrado

:: Instalar dependencias se necessario
IF NOT EXIST "node_modules" (
    echo.
    echo  [1/3] Instalando dependencias pela primeira vez...
    echo        ^(isso pode demorar 1-2 minutos^)
    echo.
    npm install --silent
    IF %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERRO] Falha ao instalar dependencias.
        echo  Verifique sua conexao com a internet e tente novamente.
        pause
        exit /b 1
    )
    echo  [OK] Dependencias instaladas
)

:: Compilar o projeto
echo.
echo  [2/3] Compilando o projeto...
npm run build >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERRO] Falha na compilacao. Execute novamente.
    pause
    exit /b 1
)
echo  [OK] Projeto compilado

:: Iniciar servidor em segundo plano e aguardar estar pronto
echo.
echo  [3/3] Iniciando o servidor... aguarde...
echo.

:: Inicia o servidor e espera ele responder
start /B npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000 >nul 2>&1

:: Aguarda o servidor ficar disponivel (testa a cada 2 segundos, maximo 60s)
set TENTATIVAS=0
:AGUARDAR
set /A TENTATIVAS+=1
timeout /t 2 /nobreak >nul 2>&1
curl -s http://localhost:3000/api/health >nul 2>&1
IF %ERRORLEVEL% EQU 0 GOTO PRONTO
IF %TENTATIVAS% GEQ 30 GOTO TIMEOUT
echo  Aguardando servidor... ^(%TENTATIVAS%/30^)
GOTO AGUARDAR

:PRONTO
echo.
echo  ================================================
echo.
echo    Sistema pronto!
echo    Abrindo no navegador: http://localhost:3000
echo.
echo    Contas de acesso:
echo    ADMIN       admin@hrd.com     / admin123
echo    Gestor RH   rh@hrd.com        / rh123456
echo    Colaborador joao@hrd.com      / colab123
echo.
echo    Para parar: feche esta janela
echo  ================================================
echo.

:: Abrir navegador automaticamente
start http://localhost:3000

:: Manter a janela aberta (o servidor continua rodando)
echo  Servidor rodando. Nao feche esta janela.
echo  Pressione qualquer tecla para encerrar o servidor.
pause >nul
exit /b 0

:TIMEOUT
echo.
echo  [AVISO] O servidor demorou mais que o esperado.
echo  Tente abrir manualmente: http://localhost:3000
echo.
start http://localhost:3000
pause
