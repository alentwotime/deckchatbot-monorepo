@echo off
echo Setting Docker environment variables...
set DOCKER_API_VERSION=1.41
set DOCKER_CLI_EXPERIMENTAL=enabled
echo Docker API Version: %DOCKER_API_VERSION%
echo Docker CLI Experimental: %DOCKER_CLI_EXPERIMENTAL%
echo.
echo You can now use Docker commands normally.
echo To make these settings permanent, add them to your system environment variables.
echo.
echo Running docker-compose with the fixed API version...
cd %~dp0
docker-compose up --build -d
