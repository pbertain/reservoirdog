# Ansible Playbooks for Reservoir Dog

This directory contains Ansible playbooks for deploying NGINX configurations.

## Files

- `inventory` - Ansible inventory file with dev and prod hosts
- `deploy-nginx-dev.yml` - Deploy NGINX config to dev environment
- `deploy-nginx-prod.yml` - Deploy NGINX config to prod environment
- `deploy-nginx.yml` - Deploy to all environments (dev and prod)

## Prerequisites

1. **Ansible installed:**
```bash
pip install ansible
# or
brew install ansible  # macOS
```

2. **SSH access configured:**
   - SSH key at `~/.ssh/keys/nirdclub__id_ed25519`
   - Key should have access to both servers as `ansible` user

3. **NGINX config files in repository:**
   - Dev: `conf/nginx-dev/sites-available/45-reservoirdog-dev-nginx.conf`
   - Prod: `conf/nginx-prod/sites-available/45-reservoirdog-prod-nginx.conf`

## Usage

### Deploy to Dev Environment

```bash
cd ansible
ansible-playbook -i inventory deploy-nginx-dev.yml
```

### Deploy to Prod Environment

```bash
cd ansible
ansible-playbook -i inventory deploy-nginx-prod.yml
```

### Deploy to Both Environments

```bash
cd ansible
ansible-playbook -i inventory deploy-nginx.yml
```

## What the Playbooks Do

1. **Ensure directories exist** - Creates `/etc/nginx/sites-available` and `/etc/nginx/sites-enabled` if needed
2. **Copy config files** - Copies `.conf` files from `conf/nginx-{dev,prod}/sites-available/` to `/etc/nginx/sites-available/`
3. **Remove old symlinks** - Removes any existing `45-reservoirdog-*.conf` symlinks in `sites-enabled`
4. **Create new symlinks** - Creates symlinks in `/etc/nginx/sites-enabled/` pointing to files in `sites-available`
5. **Test configuration** - Runs `nginx -t` to validate the configuration
6. **Restart NGINX** - Restarts NGINX service if configuration test passes

## Inventory Configuration

The `inventory` file defines:
- **Dev host**: `host78.nird.club` (user: `ansible`)
- **Prod host**: `host74.nird.club` (user: `ansible`)
- **SSH key**: `~/.ssh/keys/nirdclub__id_ed25519`

You can modify the inventory file if your setup differs.

## Troubleshooting

### Connection Issues
- Verify SSH key has correct permissions: `chmod 600 ~/.ssh/keys/nirdclub__id_ed25519`
- Test SSH connection: `ssh -i ~/.ssh/keys/nirdclub__id_ed25519 ansible@host78.nird.club`

### Permission Issues
- Playbooks use `become: yes` to run with sudo privileges
- Ensure `ansible` user has sudo access on target servers

### NGINX Test Fails
- Check NGINX configuration syntax manually: `sudo nginx -t`
- Review the config files for syntax errors
- Playbook will not restart NGINX if test fails

### Files Not Found
- Verify config files exist in `conf/nginx-dev/` or `conf/nginx-prod/` directories
- Check file names match expected pattern: `45-reservoirdog-*-nginx.conf`

## Integration with GitHub Actions

You can integrate these playbooks into your GitHub Actions workflows by adding a step:

```yaml
- name: Deploy NGINX configuration
  run: |
    cd ansible
    ansible-playbook -i inventory deploy-nginx-${{ github.ref_name == 'main' && 'prod' || 'dev' }}.yml
```

Or call them separately in your deployment workflows after the application deployment.

