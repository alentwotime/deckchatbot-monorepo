# Git Setup Instructions

## Issue Fixed

The Git configuration has been updated to fix the following issues:

1. **Removed exposed GitHub token from remote URL**: The repository was previously configured with a GitHub Personal Access Token embedded directly in the remote URL, which is a security risk.

2. **Set up secure credential storage**: Git is now configured to use the Windows Credential Manager to securely store your GitHub credentials.

3. **Improved post-commit hook**: The automatic push hook has been updated with better error handling and guidance.

## Manual Steps Required

Please complete the following steps to finalize the Git setup:

1. **Replace the post-commit hook**:
   - Copy the file `post-commit.new` from the repository root
   - Paste it to `.git/hooks/post-commit` (replacing the existing file)
   - Ensure the file has execute permissions

   ```powershell
   # In PowerShell, run:
   Copy-Item -Path "post-commit.new" -Destination ".git\hooks\post-commit" -Force
   ```

2. **Set up your GitHub credentials**:
   - The first time you push to GitHub, you'll be prompted for your username and password/token
   - Use a personal access token instead of your password (GitHub no longer accepts passwords for Git operations)
   - Your credentials will be securely stored in Windows Credential Manager

3. **Create a new GitHub Personal Access Token** (if needed):
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with the `repo` scope
   - Use this token when prompted for your password

## Git Workflow Recommendations

This repository follows a GitFlow-like branching strategy:

- **main**: Production-ready code
- **develop**: Integration branch for features

For new features or fixes:

1. Create a feature branch from `develop`:
   ```
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```
   git add .
   git commit -m "Descriptive commit message"
   ```

3. Push your changes (the post-commit hook should do this automatically):
   ```
   git push origin feature/your-feature-name
   ```

4. Create a pull request to merge into `develop`

## Troubleshooting

If you encounter Git authentication issues:

1. Check your stored credentials:
   ```
   git credential-manager get
   ```

2. If needed, remove stored credentials:
   ```
   git credential-manager erase
   ```

3. Verify your remote URL is correct:
   ```
   git remote -v
   ```

4. If you see "fatal: Authentication failed" errors, create a new GitHub token and try again.
