@echo off
echo Setting Docker environment variables...

REM Try multiple API versions to find one that works
echo Testing API version 1.41...
set DOCKER_API_VERSION=1.41
set DOCKER_CLI_EXPERIMENTAL=enabled
set DOCKER_HOST=
docker version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo API version 1.41 works!
    goto :continue
)

echo Testing API version 1.40...
set DOCKER_API_VERSION=1.40
docker version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo API version 1.40 works!
    goto :continue
)

echo Testing API version 1.39...
set DOCKER_API_VERSION=1.39
docker version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo API version 1.39 works!
    goto :continue
)

echo Testing API version 1.38...
set DOCKER_API_VERSION=1.38
docker version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo API version 1.38 works!
    goto :continue
)

echo No working API version found. Please restart Docker Desktop and try again.
goto :end

:continue
echo Docker API Version: %DOCKER_API_VERSION%
echo Docker CLI Experimental: %DOCKER_CLI_EXPERIMENTAL%
echo.
echo You can now use Docker commands normally.
echo To make these settings permanent, add them to your system environment variables.
echo.
echo Setting Docker context to default...
docker context use default
echo.
echo Running docker-compose with the simplified configuration...
cd %~dp0
docker-compose -f docker-compose-simple.yml up --build -d

:end
