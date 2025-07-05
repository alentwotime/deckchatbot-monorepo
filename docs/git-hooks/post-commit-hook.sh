#!/bin/sh
# Post-commit hook to automatically push changes to the remote repository
# This ensures that changes are always pushed through git

# Get the current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Push changes to the remote repository
echo "Automatically pushing changes to remote repository..."
git push origin $BRANCH

# Exit with the status of the push command
exit $?
