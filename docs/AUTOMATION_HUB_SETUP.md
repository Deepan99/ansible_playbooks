# Red Hat Automation Hub Configuration Guide

## Why Use Automation Hub?

- **Faster downloads**: CDN with regional mirrors
- **Caching**: Collections persist across AWX syncs
- **Enterprise-grade**: Authenticated access, version control
- **Reliability**: Higher uptime than public Galaxy
- **Security**: Content signing and verification

## Prerequisites

1. Red Hat account with subscription
2. Automation Hub access (included with Red Hat Ansible Automation Platform)
3. Offline token from [Red Hat Customer Portal](https://access.redhat.com/management/offline_token)

## Step 1: Get Automation Hub Token

1. Go to https://console.redhat.com/api/automation-hub/
2. Sign in with your Red Hat account
3. Navigate to **Tokens** → **Create Token**
4. Copy the token (you'll need it for AWX configuration)

## Step 2: Configure AWX to Use Automation Hub

### Option A: Via AWX Web UI

1. Log in to AWX as admin
2. Navigate to **Settings** → **Settings**
3. Search for "galaxy" or scroll to "Jobs" section
4. Add the following configuration:

```ini
[galaxy]
server_list = automation_hub

[galaxy_server.automation_hub]
url = https://cloud.redhat.com/api/automation-hub/
auth_url = https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token
token = YOUR_OFFLINE_TOKEN_HERE
```

5. Click **Save**

### Option B: Via AWX Settings File (ansible.cfg)

Add to your AWX execution node's `ansible.cfg`:

```ini
[galaxy]
server_list = automation_hub

[galaxy_server.automation_hub]
url = https://cloud.redhat.com/api/automation-hub/
auth_url = https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token
token = YOUR_OFFLINE_TOKEN_HERE
```

### Option C: Via Environment Variables

Set on AWX execution nodes:

```bash
export ANSIBLE_GALAXY_SERVER_LIST=automation_hub
export ANSIBLE_GALAXY_SERVER_AUTOMATION_HUB_URL=https://cloud.redhat.com/api/automation-hub/
export ANSIBLE_GALAXY_SERVER_AUTOMATION_HUB_AUTH_URL=https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token
export ANSIBLE_GALAXY_SERVER_AUTOMATION_HUB_TOKEN=YOUR_OFFLINE_TOKEN_HERE
```

## Step 3: Update Collection Requirements

Modify your `collections/requirements*.yml` files to use Automation Hub:

```yaml
collections:
  - name: ansible.posix
    version: ">=1.5.4"
    source: https://cloud.redhat.com/api/automation-hub/content/validated/  # or /community/

  - name: community.general
    version: ">=8.0.0"
    source: https://cloud.redhat.com/api/automation-hub/content/validated/
```

Note: Use `/validated/` for Red Hat certified collections, `/community/` for community collections.

## Step 4: Update AWX Project Configuration

1. Navigate to your AWX Project
2. Click **Edit**
3. Update **Requirements file** path to use split requirements:
   - For general operations: `collections/requirements-core.yml`
   - For Azure: `collections/requirements-core.yml,collections/requirements-azure.yml`
   - For AWS: `collections/requirements-core.yml,collections/requirements-aws.yml`
4. Click **Save**

## Step 5: Test Configuration

Run a manual sync in AWX to verify:
1. Collections download from Automation Hub
2. Sync completes faster than before
3. Collections are cached for subsequent syncs

## Troubleshooting

### Authentication Error
- Verify your offline token is valid and not expired
- Check token has correct permissions for Automation Hub

### Collection Not Found
- Ensure collection exists in Automation Hub
- Check if you're using `/validated/` vs `/community/` correctly
- Some community collections may only be on Galaxy, not Automation Hub

### Still Slow
- Verify AWX is actually using Automation Hub (check logs)
- Check network connectivity to Automation Hub
- Consider pre-installing collections on execution nodes

## Alternative: Pre-install Collections on Execution Nodes

If you don't have Automation Hub access, pre-install collections:

```bash
# On AWX execution nodes
ansible-galaxy collection install -r collections/requirements-core.yml
ansible-galaxy collection install -r collections/requirements-azure.yml
# ... install other requirements as needed
```

Then disable automatic collection download in AWX project settings.

## Performance Comparison

| Method | Sync Time | Setup Effort | Caching |
|--------|-----------|--------------|---------|
| Galaxy (all collections) | Slowest | None | No |
| Galaxy (split requirements) | 66% faster | Low | No |
| Automation Hub | Fastest | Medium | Yes |
| Pre-installed | Instant | High | Yes |

## Recommended Setup

For best performance:
1. Use **split requirements files** (immediate improvement)
2. Configure **Automation Hub** (long-term optimization)
3. Pre-install frequently used collections on execution nodes

This combination gives you the fastest sync times and most reliable collection management.
