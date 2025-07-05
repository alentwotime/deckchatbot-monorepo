# WSL Configuration Guide

## Overview

This guide explains how to configure your Windows Subsystem for Linux (WSL) environment for optimal use with the DeckChatBot project.

## Disabling the Daily Login Message

When you log into your WSL Ubuntu environment, you may see a daily message similar to:

```
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 6.6.87.2-microsoft-standard-WSL2 x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of [date and time]

  System load:  0.0                 Processes:             10
  Usage of /:   0.1% of 1006.85GB   Users logged in:       0
  Memory usage: 3%                  IPv4 address for eth0: 10.0.0.130
  Swap usage:   0%

This message is shown once a day. To disable it please create the
/home/[username]/.hushlogin file.
```

### How to Disable the Message

#### Option 1: Manual Method

To disable this daily login message, you need to create a `.hushlogin` file in your home directory:

1. **Open your WSL terminal**

2. **Create the .hushlogin file**:
   ```bash
   touch ~/.hushlogin
   ```

3. **Verify the file was created**:
   ```bash
   ls -la ~ | grep .hushlogin
   ```

4. **Close and reopen your WSL terminal**. The daily message should no longer appear.

#### Option 2: Using the Automated Script

We've provided a script that automates the process of creating the `.hushlogin` file:

1. **Open your WSL terminal**

2. **Navigate to the project directory**:
   ```bash
   cd /mnt/c/path/to/DeckChatBot-monorepo
   ```

3. **Run the script**:
   ```bash
   bash ./docker/disable-wsl-login-message.sh
   ```

4. **Close and reopen your WSL terminal**. The daily message should no longer appear.

## Why This Matters

Disabling the daily login message provides a cleaner terminal experience, especially when:
- Running automated scripts
- Using WSL in CI/CD pipelines
- Working with Docker and WSL integration

## Additional WSL Optimizations

### 1. Configure WSL Memory Usage

Create or edit the `.wslconfig` file in your Windows home directory:

```
# In Windows (PowerShell)
notepad "$env:USERPROFILE\.wslconfig"
```

Add the following configuration:

```
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Adjust the values based on your system's capabilities.

### 2. Configure WSL for Docker Integration

If you're using Docker Desktop with WSL:

1. Open Docker Desktop
2. Go to Settings > Resources > WSL Integration
3. Enable integration with your Ubuntu distribution

### 3. Set Up Proper File Permissions

To ensure proper file permissions when working across Windows and WSL:

```bash
# In WSL
echo -e "\n# Fix Windows and WSL file permission issues\numask 0022" >> ~/.bashrc
source ~/.bashrc
```

## Troubleshooting

If you encounter issues with your WSL setup:

1. **Check WSL version**:
   ```powershell
   wsl --status
   ```

2. **Update WSL**:
   ```powershell
   wsl --update
   ```

3. **Restart WSL**:
   ```powershell
   wsl --shutdown
   ```

## References

- [Microsoft WSL Documentation](https://learn.microsoft.com/en-us/windows/wsl/)
- [Ubuntu WSL Documentation](https://ubuntu.com/wsl)
- [Docker Desktop WSL 2 Backend](https://docs.docker.com/desktop/wsl/)
