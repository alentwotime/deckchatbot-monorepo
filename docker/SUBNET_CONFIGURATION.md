# Docker Subnet Configuration Guide

## Current Configuration

The main `docker-compose.yml` file currently uses a custom subnet configuration:

```yaml
networks:
  decknet:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.65.0/24
```

This configures the Docker network `decknet` to use the subnet `192.168.65.0/24`.

## Understanding the Trade-offs

### Benefits of Custom Subnet (192.168.65.0/24)

1. **Predictable IP Addresses**: Services will always get IP addresses in the 192.168.65.x range
2. **Network Isolation**: Clearly separates Docker containers from other networks
3. **Consistent Environment**: Same network configuration across different deployments
4. **Static IPs**: Makes it easier to configure services that need fixed IP addresses

### Potential Issues with Custom Subnet

1. **Subnet Conflicts**: The 192.168.65.0/24 range might conflict with your local network or VPN
2. **Network Creation Delays**: Docker may hang during network creation if there are conflicts
3. **Compatibility Issues**: Some Docker environments may have trouble with custom subnets
4. **VPN Interference**: VPN software might block or interfere with this subnet

## Configuration Options

### Option 1: Keep Custom Subnet (Current Configuration)

Use the current configuration in `docker-compose.yml` with the custom subnet:

```yaml
networks:
  decknet:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.65.0/24
```

**Best for**: Environments where you need predictable IP addresses and know there are no conflicts with the 192.168.65.0/24 range.

### Option 2: Use Default Docker Networking (Recommended for Most Users)

Use the simplified network configuration from `docker-compose-improved.yml`:

```yaml
networks:
  decknet:
    driver: bridge
```

**Best for**: Most users, especially those experiencing network creation issues.

### Option 3: Use a Different Custom Subnet

If you need a custom subnet but 192.168.65.0/24 is causing conflicts, you can use a different range:

```yaml
networks:
  decknet:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16  # Alternative subnet
```

**Best for**: Users who need custom subnets but are experiencing conflicts with 192.168.65.0/24.

## How to Change the Configuration

1. **Use the Improved Configuration**:
   ```powershell
   docker compose -f docker-compose-improved.yml up --build
   ```

2. **Modify the Main Configuration**:
   Edit `docker-compose.yml` to change or remove the subnet configuration.

3. **Test Network Creation**:
   ```powershell
   docker compose up --no-start
   ```
   This should complete quickly (under 30 seconds) if there are no subnet conflicts.

## Troubleshooting

If you experience issues with the network creation hanging:

1. Run the diagnostic script:
   ```powershell
   .\fix-docker-network.ps1
   ```

2. Try the simplified configuration:
   ```powershell
   docker compose -f docker-compose-simple.yml up --build
   ```

3. Check for network conflicts:
   ```powershell
   ipconfig /all
   ```
   Look for any network adapters using IP ranges that might conflict with 192.168.65.0/24.

## Recommendation

While the subnet 192.168.65.0/24 is correctly configured in the main `docker-compose.yml` file, we recommend using the improved configuration without a custom subnet for most users, as it avoids potential network conflicts and creation issues.
