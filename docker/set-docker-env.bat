@echo off
echo Setting Docker environment variables...
set DOCKER_API_VERSION=1.41
docker context use default
echo Docker API Version: %DOCKER_API_VERSION%
echo Docker Context: default
echo.
echo Docker is now ready to use!
echo Test with: docker ps
