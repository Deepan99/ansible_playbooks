# Ansible Deep Learning Guide & Exercises

Welcome to your hands-on **Ansible Deep Learning Workspace**!

## 📂 Project Structure Overview

```
e:/Deepan/Linux/ansible/
├── index.html                  # Interactive Lab Dashboard UI
├── style.css                   # Modern dark-mode styling system
├── app.js                      # Playbook simulator & Inventory builder logic
├── ansible.cfg                 # Production-grade Ansible configuration file
├── inventories/
│   └── production/
│       └── hosts.ini           # Real-world INI static inventory with host/group vars
├── playbooks/
│   ├── 01-basic-setup.yml      # Base system packages & hardening playbook
│   ├── 02-nginx-webserver.yml  # Nginx deployment & handlers playbook
│   └── templates/
│       └── index.html.j2       # Jinja2 dynamic web page template
└── roles/
    └── common/                 # Standard Ansible Role structure
        ├── defaults/main.yml
        └── tasks/main.yml
```

---

## 🚀 Interactive Practice Lab Dashboard

You can open `index.html` directly in your browser or serve it locally to experience:
1. **Architecture & Agentless Concepts**: Visual SSH execution workflow & target topologies.
2. **Visual Inventory & Group Variables Builder**: Toggle between INI & YAML format and inspect parent/child group structures.
3. **Playbook Simulator**: Interactively run playbooks against mock nodes (`web-node-01`, `db-node-01`), watch task outputs (`ok`, `changed`), and observe **idempotency** when running playbooks a second time!
4. **Core Modules Explorer**: Interactive search for top Ansible modules (`template`, `service`, `apt`, `git`, `user`, `cron`).
5. **Ansible Vault Encrypter**: Test $ANSIBLE_VAULT encryption & secrets management.

---

## 📖 Key Concepts Summary Cheat Sheet

### 1. Agentless Architecture
- Ansible requires **no agent** on target nodes.
- Connects over standard **SSH** (Linux/Unix, default port 22) or **WinRM/PSRP** (Windows, default port 5986).
- Executes Python scripts (modules) in remote memory (`/tmp/ansible-tmp-...`) and cleans up afterward.

### 2. Idempotency
- Running an Ansible playbook multiple times leaves the system in the **exact same target state**.
- If a package/user/file is already at the target state, Ansible marks the task as `ok` (0 changes made).

### 3. Variable Precedence Ladder (Highest to Lowest)
1. Extra vars (`ansible-playbook -e "var=value"`) - **HIGHEST**
2. Task vars
3. Block vars
4. Role and include vars
5. Registered vars / `set_fact`
6. Play vars / `vars_files`
7. Host facts (`ansible_facts`)
8. `host_vars/` directory files
9. `group_vars/` directory files
10. Role defaults (`roles/<name>/defaults/main.yml`) - **LOWEST**

### 4. Essential CLI Commands

```bash
# Test connectivity to all inventory hosts
ansible all -i inventories/production/hosts.ini -m ping

# Run fact gathering on a specific host group
ansible webservers -i inventories/production/hosts.ini -m setup

# Syntax check a playbook
ansible-playbook -i inventories/production/hosts.ini playbooks/02-nginx-webserver.yml --syntax-check

# Dry-run execution (Check mode)
ansible-playbook -i inventories/production/hosts.ini playbooks/02-nginx-webserver.yml --check --diff

# Execute playbook
ansible-playbook -i inventories/production/hosts.ini playbooks/02-nginx-webserver.yml

# Encrypt a secret file with Ansible Vault
ansible-vault encrypt group_vars/all/vault.yml

# Run playbook with encrypted vault secrets
ansible-playbook site.yml --ask-vault-pass
```
