# Enterprise Ansible Automation Architecture

This repository is organized following Red Hat Ansible Automation Platform (AAP) and AWX enterprise best practices.

---

## 1. Directory Layout & Standards

```text
├── .github/
│   └── workflows/ci.yml         # Automated CI pipeline (ansible-lint, collections, molecule)
├── .ansible-lint                # Production linting configuration
├── .gitignore                   # Ignores sensitive keys, temp facts, and Python bytecode
├── ansible.cfg                  # Core configuration (defaults, forks, pipelining)
├── collections/
│   └── requirements.yml         # Required Galaxy collections
│
├── inventories/                 # Multi-environment inventories
│   ├── dev/                     # Development tier inventory
│   │   └── hosts.yml
│   ├── stage/                   # Staging tier inventory
│   │   └── hosts.yml
│   └── prod/                    # Production tier inventory
│       └── hosts.ini
│
├── group_vars/                  # Shared and group variables
│   ├── all/                     # Global variables applied to all nodes
│   │   ├── main.yml
│   │   └── vm_vars.yml
│   ├── infra.yml                # Variables for [infra] inventory group
│   └── k8s_master.yml           # Variables for [k8s_master] inventory group
│
├── playbooks/                   # Playbooks organized by functional domain
│   ├── patching/                # OS and kernel patching (RHEL 9, Solaris 11, Azure ARM)
│   ├── provisioning/            # Infrastructure provisioning (AWS, Azure, VMware, Postgres)
│   ├── operations/              # Day-2 maintenance, health checks, storage, users
│   ├── security/                # CIS/compliance, Qualys Podman, SSH hardening
│   └── learning/                # Educational demos & exercises
│
├── roles/                       # Reusable roles with defaults, tasks, molecule tests
│   └── common/
│
├── vars/                        # Dedicated variable files & encrypted secrets
│   ├── shared_variables.yml
│   └── vault.yml                # Ansible Vault encrypted secrets
│
├── docs/                        # Architecture and operations documentation
│   ├── architecture.md
│   └── rbac_guide.md
│
└── tools/                       # Ancillary utilities & simulators
    ├── lab-dashboard/           # Interactive web UI practice lab
    └── simulator-app/           # Target FastAPI demonstration service
```

---

## 2. Playbook Categorization Guidelines

- **`playbooks/patching/`**: Must implement pre-patch checks (disk space, running services), upgrade execution, reboot verification, and post-patch validation.
- **`playbooks/provisioning/`**: Cloud or hypervisor instance creation and baseline stack setup.
- **`playbooks/operations/`**: Routine operations including user creation, password rotation, service restarts, and filesystem extensions.
- **`playbooks/security/`**: Hardening tasks, agent deployments, and vulnerability remediation.
- **`playbooks/learning/`**: Progressive tutorials for training and onboarding.

---

## 3. AWX / AAP Job Template Mapping

When configuring Job Templates in Ansible Automation Platform or AWX:

1. **Project**: Point to this Git repository and branch (`main`).
2. **Playbook Selection**:
   - `playbooks/patching/azure_kernel_patching.yml`
   - `playbooks/patching/patch_rhel9_standard.yml`
   - `playbooks/provisioning/provision_postgres.yml`
   - `playbooks/operations/health_check.yml`
3. **Inventory**: Select the corresponding Inventory (`inventories/prod/hosts.ini` for Production, `inventories/dev/hosts.yml` for Dev).
4. **Credentials**:
   - Machine credential (SSH key or username/password)
   - Ansible Vault credential (for decrypting `vars/vault.yml` and AWX secrets)
   - Cloud credentials (Azure / AWS service principals where applicable)

---

## 4. Linting & Validation

Prior to pushing any changes, run local syntax and linting checks:

```bash
# Check syntax
ansible-playbook --syntax-check playbooks/operations/health_check.yml

# Run ansible-lint against all playbooks and roles
ansible-lint playbooks/ roles/
```
