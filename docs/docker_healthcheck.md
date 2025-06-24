# Docker Healthcheck Tips

This document explains how to troubleshoot Docker container health checks in the AlensDeckBot monorepo.

## Inspecting container state

Use `docker ps` to see the health status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

To get detailed health information:

```bash
docker inspect <container_name> --format '{{json .State.Health}}' | jq
```

Check container logs for failure reasons:

```bash
docker logs <container_name>
```

If the health check uses `curl`, you can run the same command manually inside the container:

```bash
docker exec <container_name> curl -v http://localhost:8000
```

## Compose dependency management

`backend` depends on `ai-service` and `frontend` depends on `backend` using `depends_on: condition: service_healthy`. This ensures each service starts after its dependency reports healthy. If you require automatic restarts based on health check failures across multiple nodes, consider Docker Swarm or another orchestrator.
