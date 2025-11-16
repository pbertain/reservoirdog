# Deployment Guide

This document describes the deployment setup for Reservoir Dog.

## Overview

The application supports two environments:
- **Development**: `host78.nird.club` on port `45081`
- **Production**: `host74.nird.club` on port `45080`

Deployments are automated via GitHub Actions when code is pushed to:
- `dev` branch → Development environment
- `main` branch → Production environment

## Prerequisites

### GitHub Secrets

You need to configure the following secret in your GitHub repository:

1. Go to: Settings → Secrets and variables → Actions
2. Add a new secret named `DEPLOY_SSH_KEY`
3. Paste the contents of your SSH private key (`~/.ssh/keys/nirdclub__id_ed25519`)

### Server Setup

On each server (host78 and host74), ensure:

1. **Git repository is cloned:**
```bash
# On dev server
sudo mkdir -p /opt/dev
sudo chown ansible:ansible /opt/dev
cd /opt/dev
git clone <repository-url> reservoirdog
cd reservoirdog
git checkout dev

# On prod server
sudo mkdir -p /opt/prod
sudo chown ansible:ansible /opt/prod
cd /opt/prod
git clone <repository-url> reservoirdog
cd reservoirdog
git checkout main
```

2. **Initial setup (run once on each server):**
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
python -c "from database import init_db; init_db()"

# Set environment variable
export ENVIRONMENT=dev  # or 'prod' on production server
```

3. **Install systemd services (optional but recommended):**
```bash
# Copy service files
sudo cp conf/systemd/reservoirdog-dev.service /etc/systemd/system/
sudo cp conf/systemd/reservoirdog-collector-dev.service /etc/systemd/system/

# On prod server:
sudo cp conf/systemd/reservoirdog-prod.service /etc/systemd/system/
sudo cp conf/systemd/reservoirdog-collector-prod.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable reservoirdog-dev
sudo systemctl enable reservoirdog-collector-dev
sudo systemctl start reservoirdog-dev
sudo systemctl start reservoirdog-collector-dev
```

4. **Configure NGINX:**
```bash
# Copy NGINX configs
sudo cp conf/nginx/sites-available/reservoirdog-dev /etc/nginx/sites-available/
sudo cp conf/nginx/sites-available/reservoirdog-prod /etc/nginx/sites-available/

# Create symlinks
sudo ln -s /etc/nginx/sites-available/reservoirdog-dev /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/reservoirdog-prod /etc/nginx/sites-enabled/

# Test and reload NGINX
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Process

### Automatic Deployment

When you push to `dev` or `main` branches, GitHub Actions will:

1. Checkout the code
2. SSH to the target server
3. Pull the latest code
4. Install/update dependencies
5. Initialize database if needed
6. Record the deployment in the database
7. Restart the application (if systemd is configured)

### Manual Deployment

You can also deploy manually:

```bash
# SSH to the server
ssh -i ~/.ssh/keys/nirdclub__id_ed25519 ansible@host78.nird.club

# Navigate to deployment directory
cd /opt/dev/reservoirdog  # or /opt/prod/reservoirdog

# Pull latest code
git pull origin dev  # or main for prod

# Activate venv and update dependencies
source venv/bin/activate
pip install -r requirements.txt

# Record deployment
python deploy_helper.py dev  # or 'prod'

# Restart service (if using systemd)
sudo systemctl restart reservoirdog-dev
```

## Deployment Tracking

All deployments are automatically recorded in the database and can be viewed at:

- `/deployments` - Web page showing deployment history
- `/api/deployments` - JSON API endpoint

The deployment record includes:
- Environment (dev/prod)
- Deployment timestamp
- Git commit SHA
- Commit message
- Branch name
- Deployed by (GitHub Actions or manual)

## Troubleshooting

### Deployment fails in GitHub Actions

1. Check that `DEPLOY_SSH_KEY` secret is set correctly
2. Verify SSH key has access to the server
3. Check GitHub Actions logs for specific errors

### Application won't start

1. Check logs: `sudo journalctl -u reservoirdog-dev -f`
2. Verify environment variable is set: `echo $ENVIRONMENT`
3. Check port is available: `netstat -tuln | grep 45081`
4. Verify database exists: `ls -la data/reservoir_data.db`

### NGINX errors

1. Test config: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/reservoirdog-dev-error.log`
3. Verify proxy target is running: `curl http://localhost:45081`

## Environment Variables

Set these on the server (or in systemd service files):

- `ENVIRONMENT` - Set to `dev` or `prod`
- `FLASK_PORT` - Port number (45081 for dev, 45080 for prod)
- `DATABASE_URL` - Optional, defaults to SQLite in `data/` directory

## Service Management

```bash
# Check status
sudo systemctl status reservoirdog-dev

# View logs
sudo journalctl -u reservoirdog-dev -f

# Restart service
sudo systemctl restart reservoirdog-dev

# Stop service
sudo systemctl stop reservoirdog-dev

# Start service
sudo systemctl start reservoirdog-dev
```

