# Ansible Collection Migration Plan

## Current Repository Structure
```
ansible_playbooks/
├── playbooks/              # Learning exercises (01-basic-setup.yml, etc.)
├── roles/
│   └── common/            # Single role with molecule tests
├── inventories/           # Multi-tier inventories (dev, stage, prod)
├── group_vars/            # Group variables
├── vars/                  # Additional variables
├── collections/           # Galaxy collections requirements
├── ansible.cfg            # Ansible configuration
└── *.yml                  # Various operational playbooks in root
```

## Target Collection Structure
```
deepan-automation/
├── galaxy.yml            # Collection metadata
├── README.md             # Collection documentation
├── LICENSE
├── plugins/              # Custom modules/plugins (if any)
├── modules/              # Custom modules (if any)
├── roles/
│   ├── common/           # Existing role
│   ├── kernel_patching/  # Extracted from root playbooks
│   ├── vm_provisioning/  # Extracted from root playbooks
│   └── service_management/ # Extracted from root playbooks
├── playbooks/
│   ├── tasks/            # Reusable task playbooks
│   └── site.yml          # Orchestration playbooks
└── docs/                 # Collection documentation
```

## Migration Phases

### Phase 1: Categorize Playbooks (Analysis)
**Task**: Identify and categorize existing playbooks

| Category | Playbooks | Action |
|----------|-----------|--------|
| Learning/Demo | `playbooks/01-*.yml`, `playbooks/02-*.yml`, etc. | Keep in separate repo or exclude |
| Kernel Patching | `kernel_patching_v3.yml`, `patch_rhel9_*.yml`, `patch_solaris11_*.yml` | Convert to role |
| VM Provisioning | `provision_vm.yml`, `provision_aws_ec2.yml`, `provision_azure_vm.yml` | Convert to role |
| System Management | `manage_users.yml`, `manage_services.yml`, `manage_storage.yml` | Convert to role |
| Security | `secure_ssh_sudo.yml`, `security_patching.yml` | Convert to role |
| Maintenance | `maintenance_checks.yml`, `health_check.yaml` | Convert to role |
| Recovery | `rollback_recovery.yml` | Convert to role |
| Utilities | `hello_world.yml`, `repository_changes.yml` | Keep as standalone or remove |

### Phase 2: Create Collection Skeleton
**Task**: Initialize collection structure

```bash
ansible-galaxy collection init deepan.automation
```

This creates the standard collection structure with:
- `galaxy.yml` - Collection metadata (name, version, author, dependencies)
- `plugins/` - For custom modules, filters, etc.
- `roles/` - For roles
- `playbooks/` - For playbooks
- `docs/` - Documentation

### Phase 3: Migrate Roles
**Task**: Move existing roles to collection

1. Move `roles/common/` → `deepan-automation/roles/common/`
2. Update role metadata (`meta/main.yml`) with collection namespace
3. Test role functionality with molecule

### Phase 4: Convert Playbooks to Roles
**Task**: Extract reusable patterns into roles

Example: Convert `kernel_patching_v3.yml` to role

**Before (playbook)**:
```yaml
- name: Kernel Patching
  hosts: all
  tasks:
    - name: Check current kernel
      command: uname -r
      register: kernel_version
    # ... more tasks
```

**After (role structure)**:
```
roles/kernel_patching/
├── tasks/
│   └── main.yml
├── defaults/
│   └── main.yml
├── handlers/
│   └── main.yml
├── meta/
│   └── main.yml
└── vars/
    └── main.yml
```

### Phase 5: Update Playbooks
**Task**: Convert playbooks to use collection roles

**Before**:
```yaml
- name: Patch Production Servers
  hosts: production
  roles:
    - common
```

**After**:
```yaml
- name: Patch Production Servers
  hosts: production
  roles:
    - deepan.automation.common
    - deepan.automation.kernel_patching
```

### Phase 6: Handle Inventories and Variables
**Task**: Decide on inventory strategy

**Option A**: Keep inventories separate (recommended)
- Inventories stay in separate repository
- Collection only contains roles and playbooks
- AWX references both collection and inventory repo

**Option B**: Include sample inventories in collection
- Keep `inventories/` in collection for examples
- Not recommended for production use

### Phase 7: Build and Test Collection
**Task**: Build collection artifact

```bash
cd deepan-automation
ansible-galaxy collection build
ansible-galaxy collection install deepan-automation-*.tar.gz
```

### Phase 8: Configure AWX to Use Collection
**Task**: Update AWX project configuration

1. **Option A**: Publish to Automation Hub
   - Upload collection to Red Hat Automation Hub
   - Configure AWX to sync from Automation Hub
   - Fastest sync, version control

2. **Option B**: Keep in Git repo
   - Commit collection to GitHub
   - AWX syncs collection from Git
   - Still faster than current structure

3. **Option C**: Local tarball
   - Build tarball manually
   - Upload to AWX
   - Manual process, not recommended

### Phase 9: Cleanup
**Task**: Remove deprecated files

- Remove root-level playbooks (now in collection)
- Remove old `roles/` directory
- Update `.awxignore` for new structure
- Update README.md

## Collection Metadata (galaxy.yml)

```yaml
namespace: deepan
name: automation
version: 1.0.0
authors:
  - Deepan <deepan@example.com>
description: Enterprise automation collection for system patching, VM provisioning, and maintenance
license: MIT
dependencies:
  community.general: ">=5.0.0"
  azure.azcollection: ">=2.0.0"
  amazon.aws: ">=5.0.0"
repository: https://github.com/Deepan99/ansible_playbooks
documentation: https://github.com/Deepan99/ansible_playbooks/blob/main/docs/README.md
homepage: https://github.com/Deepan99/ansible_playbooks
issues: https://github.com/Deepan99/ansible_playbooks/issues
```

## Benefits After Migration

1. **Faster AWX Sync**: Collection tarball is much smaller than full repo
2. **Version Control**: Semantic versioning (1.0.0, 1.0.1, etc.)
3. **Reusability**: Share collection across teams/projects
4. **Standards Compliance**: Follows Red Hat Ansible best practices
5. **Better Organization**: Clear separation between roles, playbooks, and inventories
6. **Dependency Management**: Collections define their own dependencies

## Timeline Estimate

- Phase 1 (Analysis): 1-2 hours
- Phase 2 (Skeleton): 30 minutes
- Phase 3 (Migrate Roles): 1 hour
- Phase 4 (Convert Playbooks): 4-6 hours
- Phase 5 (Update Playbooks): 2-3 hours
- Phase 6 (Inventories): 1 hour
- Phase 7 (Build & Test): 2 hours
- Phase 8 (AWX Config): 1-2 hours
- Phase 9 (Cleanup): 1 hour

**Total**: 13-18 hours

## Next Steps

1. Review this plan
2. Decide on inventory strategy (Option A or B in Phase 6)
3. Decide on AWX integration method (Option A, B, or C in Phase 8)
4. Begin Phase 1 when ready
