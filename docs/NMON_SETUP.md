# Nmon Playbook Setup for AWX

## Overview
The nmon monitoring playbooks use only built-in Ansible modules and require **NO external Galaxy collections**.

## Playbook Location
- Main playbook: `playbooks/operations/check_nmon.yml`
- Role: `roles/nmon_check/`

## AWX Configuration for Nmon

### Step 1: Create a Dedicated AWX Project for Nmon
1. Go to **Resources** → **Projects** → **Add**
2. Name: `nmon-monitoring`
3. Organization: Select your organization
4. Source Control URL: `https://github.com/Deepan99/ansible_playbooks.git`
5. Branch: `main`
6. **Requirements file**: Leave BLANK or use `collections/requirements-nmon.yml`
7. Save

### Step 2: Create Job Template
1. Go to **Resources** → **Job Templates** → **Add**
2. Name: `Check Nmon Status`
3. Job Type: `Run`
4. Inventory: Select your inventory (or use "Prompt on launch" for dynamic)
5. Project: `nmon-monitoring`
6. Execution Environment: `Default` or any EE
7. Playbook: `playbooks/operations/check_nmon.yml`
8. **Extra Variables** (if using ServiceNow):
   ```yaml
   target_server: "server1,server2,server3"
   ```
9. Save

### Step 3: Configure AWX Sync for Nmon Project
Since nmon requires NO collections, you have two options:

**Option A: Leave Requirements File Blank**
- No collections will be downloaded
- Fastest possible sync time
- Recommended for nmon-only project

**Option B: Use requirements-nmon.yml**
- Explicitly documents that no collections are needed
- Clear for future reference
- Same performance as Option A

## Why This Works

The nmon_check role uses only built-in Ansible modules:
- `ansible.builtin.stat` - Check file existence
- `ansible.builtin.command` - Run commands
- `ansible.builtin.set_fact` - Set variables
- `ansible.builtin.service_facts` - Get service status
- `ansible.builtin.debug` - Display output
- `ansible.builtin.set_stats` - Expose stats to AWX/ServiceNow

All of these are included in every Ansible installation by default.

## Performance Impact

| Project Type | Collections | Sync Time |
|--------------|-------------|-----------|
| Full project (all collections) | 6 | Slow |
| Core operations only | 2 | 66% faster |
| **Nmon-only project** | **0** | **Fastest** |

## Testing

Test the configuration:
1. Sync the nmon project (should be instant)
2. Run the job template
3. Verify output shows nmon status

## Troubleshooting

If you see "Fetch galaxy collections" task:
- Check if you accidentally set the requirements file to `collections/requirements.yml`
- Change it to blank or `collections/requirements-nmon.yml`
- Re-sync the project
