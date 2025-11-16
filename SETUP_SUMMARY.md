# Deployment Setup Summary

## What Has Been Created

### GitHub Actions Workflows
- `.github/workflows/deploy-dev.yml` - Auto-deploys on push to `dev` branch
- `.github/workflows/deploy-prod.yml` - Auto-deploys on push to `main` branch

### NGINX Configuration
- `conf/nginx/sites-available/reservoirdog-dev` - Dev server config
- `conf/nginx/sites-available/reservoirdog-prod` - Prod server config

### Systemd Service Files
- `conf/systemd/reservoirdog-dev.service` - Dev web app service
- `conf/systemd/reservoirdog-prod.service` - Prod web app service
- `conf/systemd/reservoirdog-collector-dev.service` - Dev data collector service
- `conf/systemd/reservoirdog-collector-prod.service` - Prod data collector service

### Deployment Tracking
- `Deployment` model added to database
- `/deployments` page added to web app
- `/api/deployments` API endpoint
- `deploy_helper.py` script for recording deployments

### Configuration Updates
- `config.py` updated with environment-specific settings
- Ports: Dev=45081, Prod=45080
- Environment detection via `ENVIRONMENT` variable

## Next Steps

### 1. GitHub Setup
Add the SSH key as a GitHub secret:
```bash
# Copy your SSH key content
cat ~/.ssh/keys/nirdclub__id_ed25519

# Then in GitHub:
# Settings → Secrets and variables → Actions → New repository secret
# Name: DEPLOY_SSH_KEY
# Value: [paste key content]
```

### 2. Server Initial Setup

**On host78.nird.club (dev):**
```bash
sudo mkdir -p /opt/dev
sudo chown ansible:ansible /opt/dev
cd /opt/dev
git clone <your-repo-url> reservoirdog
cd reservoirdog
git checkout dev
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "from database import init_db; init_db()"
export ENVIRONMENT=dev
```

**On host74.nird.club (prod):**
```bash
sudo mkdir -p /opt/prod
sudo chown ansible:ansible /opt/prod
cd /opt/prod
git clone <your-repo-url> reservoirdog
cd reservoirdog
git checkout main
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "from database import init_db; init_db()"
export ENVIRONMENT=prod
```

### 3. Install Systemd Services (Optional)

**On dev server:**
```bash
sudo cp conf/systemd/reservoirdog-dev.service /etc/systemd/system/
sudo cp conf/systemd/reservoirdog-collector-dev.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable reservoirdog-dev reservoirdog-collector-dev
sudo systemctl start reservoirdog-dev reservoirdog-collector-dev
```

**On prod server:**
```bash
sudo cp conf/systemd/reservoirdog-prod.service /etc/systemd/system/
sudo cp conf/systemd/reservoirdog-collector-prod.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable reservoirdog-prod reservoirdog-collector-prod
sudo systemctl start reservoirdog-prod reservoirdog-collector-prod
```

### 4. Configure NGINX

**On both servers:**
```bash
# Copy configs
sudo cp conf/nginx/sites-available/reservoirdog-* /etc/nginx/sites-available/

# Create symlinks (on appropriate server)
sudo ln -s /etc/nginx/sites-available/reservoirdog-dev /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/reservoirdog-prod /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Test Deployment

1. Make a small change and commit to `dev` branch
2. Push to GitHub
3. Check GitHub Actions to see deployment run
4. Verify deployment at `http://host78.nird.club/deployments`
5. Repeat for `main` branch to test prod deployment

## Deployment Flow

1. **Developer pushes code** to `dev` or `main` branch
2. **GitHub Actions triggers** the appropriate workflow
3. **Workflow SSHs to server** using the stored SSH key
4. **Code is pulled** from the repository
5. **Dependencies are updated** in virtual environment
6. **Database is initialized** if needed
7. **Deployment is recorded** in the database
8. **Application is restarted** (via systemd if configured)
9. **Deployment appears** on `/deployments` page

## Important Notes

- The SSH key must be added as a GitHub secret before deployments will work
- The `ansible` user must have write access to `/opt/dev` and `/opt/prod`
- Systemd services are optional but recommended for production
- NGINX configs assume the app runs on localhost ports 45081/45080
- The deployment tracking page is accessible at `/deployments` on both environments

