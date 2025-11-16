# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment.

## Workflows

### deploy-dev.yml
- **Trigger**: Push to `dev` branch
- **Target**: `host78.nird.club` (Development)
- **Port**: 45081
- **Path**: `/opt/dev/reservoirdog`

### deploy-prod.yml
- **Trigger**: Push to `main` branch
- **Target**: `host74.nird.club` (Production)
- **Port**: 45080
- **Path**: `/opt/prod/reservoirdog`

## Setup

1. **Add SSH Key Secret:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add secret named `DEPLOY_SSH_KEY`
   - Paste the contents of `~/.ssh/keys/nirdclub__id_ed25519`

2. **Server Preparation:**
   - Ensure the repository is cloned on both servers
   - Set up initial virtual environment and dependencies
   - Configure systemd services (optional but recommended)
   - Set up NGINX reverse proxy

3. **First Deployment:**
   - Push to `dev` branch to test dev deployment
   - Push to `main` branch to deploy to production

## Workflow Steps

Each workflow:
1. Checks out the code
2. Sets up SSH authentication
3. Connects to the target server
4. Pulls latest code from the appropriate branch
5. Updates Python dependencies
6. Initializes database if needed
7. Records the deployment in the database
8. Restarts the application (if systemd is configured)

## Troubleshooting

- Check GitHub Actions logs for detailed error messages
- Verify SSH key has correct permissions on the server
- Ensure the `ansible` user has write access to deployment directories
- Check that systemd services are configured correctly

