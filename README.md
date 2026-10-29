# Enterprise Ansible Automation Platform

[![Ansible CI](https://github.com/Deepan99/ansible_playbooks/actions/workflows/ci.yml/badge.svg)](https://github.com/Deepan99/ansible_playbooks/actions/workflows/ci.yml)
[![Ansible Core](https://img.shields.io/badge/Ansible-2.15%2B-red.svg)](https://docs.ansible.com/)
[![Ansible-Lint](https://img.shields.io/badge/Ansible--Lint-passing-green.svg)](https://ansible.readthedocs.io/projects/lint/)

Production-grade Ansible automation repository structured according to Red Hat Ansible Automation Platform (AAP) and AWX enterprise standards.

---

## 📁 Repository Structure

```text
├── .github/workflows/ci.yml     # Automated CI pipeline: ansible-lint & molecule tests
├── .ansible-lint                # Production linting configuration profile
├── .gitignore                   # Enterprise git exclusion rules
├── ansible.cfg                  # Core configuration (defaults, forks, pipelining)
├── collections/
│   └── requirements.yml         # Required Galaxy collections (Azure, AWS, POSIX, VMware)
│
├── inventories/                 # Multi-tier inventories
│   ├── dev/hosts.yml            # Local development & mock hosts
│   ├── stage/hosts.yml          # Staging validation environment
│   └── prod/hosts.ini           # Production lab infrastructure
│
├── group_vars/                  # Shared & group variables
│   ├── all/                     # Global variables applied to all nodes
│   │   ├── main.yml             # Global shared ports and defaults
│   │   └── vm_vars.yml          # Virtual machine provisioning defaults
│   ├── infra.yml                # AWX PostgreSQL database group variables
│   └── k8s_master.yml           # Kubernetes control plane variables
│
├── playbooks/                   # Domain-separated playbooks
│   ├── patching/                # Enterprise OS and kernel patching
│   │   ├── azure_kernel_patching.yml
│   │   ├── patch_rhel9_standard.yml
│   │   ├── patch_rhel9_security.yml
│   │   ├── patch_rhel9_conditional.yml
│   │   ├── patch_solaris11_standard.yml
│   │   ├── patch_solaris11_security.yml
│   │   ├── patch_solaris11_conditional.yml
│   │   └── security_patching.yml
│   ├── provisioning/            # Infrastructure & database provisioning
│   │   ├── provision_aws_ec2.yml
│   │   ├── provision_azure_vm.yml
│   │   ├── provision_vmware_vm.yml
│   │   ├── provision_postgres.yml
│   │   └── migrate_awx_to_external_db.yml
│   ├── operations/              # Day-2 operations & systems maintenance
│   │   ├── health_check.yml
│   │   ├── maintenance_checks.yml
│   │   ├── manage_users.yml
│   │   ├── manage_services.yml
│   │   ├── manage_storage.yml
│   │   ├── change_password.yml
│   │   ├── reboot_nodes.yml
│   │   ├── rollback_recovery.yml
│   │   ├── ping_spoke_vms.yml
│   │   ├── software_upgrades.yml
│   │   ├── repository_changes.yml
│   │   └── app_prerequisites.yml
│   ├── security/                # Hardening & compliance
│   │   ├── secure_ssh_sudo.yml
│   │   └── deploy_qualys_podman.yml
│   └── learning/                # Educational demos & exercises
│       ├── 01-basic-setup.yml
│       ├── 02-nginx-webserver.yml
│       ├── 03-block-rescue-always.yml
│       ├── 04-simple-block-rescue-always.yml
│       ├── 05-sharing-variables-demo.yml
│       └── hello_world.yml
│
├── roles/                       # Modular reusable roles
│   └── common/                  # Base OS configuration role with Molecule tests
│
├── vars/                        # Central variable & vault files
│   ├── shared_variables.yml
│   └── vault.yml                # Ansible Vault encrypted credentials
│
├── docs/                        # Architecture & security guidelines
│   ├── architecture.md          # AAP/AWX integration & design architecture
│   └── rbac_guide.md            # Role-Based Access Control guide
│
└── tools/                       # Utilities & simulators
    ├── lab-dashboard/           # Interactive browser-based training lab UI
    └── simulator-app/           # Target FastAPI service for deployment demos
```

---

## 🚀 Getting Started

### 1. Prerequisites & Collection Dependencies

Install the required Ansible Galaxy collections:

```bash
ansible-galaxy collection install -r collections/requirements.yml
```

### 2. Environment Configuration

The repository is configured via `ansible.cfg` with optimal enterprise defaults:
- Inventory defaults to `inventories/prod/hosts.ini`
- SSH Pipelining and multiplexing enabled for low-latency execution
- JSON fact caching enabled in `/tmp/ansible_fact_cache`
- Privilege escalation set to `sudo`

### 3. Syntax Verification

Before executing any playbooks or opening pull requests:

```bash
# Verify playbook syntax
ansible-playbook --syntax-check playbooks/operations/health_check.yml

# Run ansible-lint
ansible-lint playbooks/ roles/
```

---

## 📋 Common Playbook Execution Examples

### Systems Health & Operations
```bash
# Run pre/post maintenance health checks
ansible-playbook playbooks/operations/health_check.yml

# Perform node reboot with connection polling
ansible-playbook playbooks/operations/reboot_nodes.yml
```

### Enterprise Patching
```bash
# Standard RHEL 9 system patching (with pre-checks & post-reboot verification)
ansible-playbook playbooks/patching/patch_rhel9_standard.yml

# Security-only RHEL 9 patching
ansible-playbook playbooks/patching/patch_rhel9_security.yml

# Azure ARM REST API kernel patching & audit
ansible-playbook playbooks/patching/azure_kernel_patching.yml
```

### Cloud & Database Provisioning
```bash
# Provision PostgreSQL 15 for AWX external database
ansible-playbook playbooks/provisioning/provision_postgres.yml --ask-vault-pass

# Provision an AWS EC2 instance
ansible-playbook playbooks/provisioning/provision_aws_ec2.yml
```

---

## 🔒 Secrets Management

Sensitive credentials (such as database passwords and API tokens) are encrypted with **Ansible Vault** inside `vars/vault.yml`.

To edit the vault file:
```bash
ansible-vault edit vars/vault.yml
```

To run playbooks requiring vault credentials:
```bash
ansible-playbook playbooks/<path-to-playbook>.yml --ask-vault-pass
# Or using a vault password file:
ansible-playbook playbooks/<path-to-playbook>.yml --vault-password-file ~/.vault_pass
```

---

## 🧪 CI/CD & Molecule Testing

Every push and pull request to `main` triggers automated GitHub Actions workflows:
- **`ansible-lint`**: Ensures compliance with Ansible best practices and YAML formatting.
- **`molecule test`**: Spin up containerized instances and executes test suites against the `roles/common` role.

---

## 📚 Additional Documentation
- [Architecture & AWX Integration Guide](docs/architecture.md)
- [Ansible RBAC Guide](docs/rbac_guide.md)
- Interactive Lab Dashboard: Open `tools/lab-dashboard/index.html` in any modern web browser.
