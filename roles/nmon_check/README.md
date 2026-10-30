# nmon_check

An Ansible role for auditing nmon (Nigel's Monitor) installation, version, and running status on target systems.

## Description

This role performs a read-only audit of nmon monitoring tool status on target hosts. It checks:
- Whether nmon is installed
- The installed version
- Whether nmon is currently running (as systemd service or background process)

The role is designed for:
- Zero-credential operations (no secrets required)
- ServiceNow integration via `set_stats`
- AWX/Ansible Automation Platform workflows
- Multi-OS support (Linux, Solaris)

## Requirements

- Ansible 2.9 or higher
- Target hosts with SSH access
- No special privileges required (read-only checks)

## Role Variables

### Default Variables

```yaml
nmon_binary_paths:
  - /usr/bin/nmon
  - /usr/local/bin/nmon
  - /opt/nmon/nmon
  - /usr/local/nmon/nmon
nmon_package_name: nmon
nmon_check_become: false
```

### Override Variables

You can override the default binary paths in your playbook:

```yaml
- hosts: all
  roles:
    - role: nmon_check
      vars:
        nmon_binary_paths:
          - /custom/path/to/nmon
```

## Dependencies

None. This role uses only built-in Ansible modules.

## Example Playbook

### Basic Usage

```yaml
- name: Check nmon status
  hosts: all
  gather_facts: true
  roles:
    - nmon_check
```

### With Dynamic Inventory (ServiceNow Integration)

```yaml
- name: Build Runtime Dynamic Inventory from ServiceNow
  hosts: localhost
  gather_facts: false
  vars:
    target_server: "server1,server2,server3"
  tasks:
    - name: Split comma-separated server names
      ansible.builtin.set_fact:
        target_list: "{{ target_server | split(',') | map('trim') | list }}"

    - name: Register servers into dynamic group
      ansible.builtin.add_host:
        name: "{{ item }}"
        groups: dynamic_targets
      loop: "{{ target_list }}"

- name: Audit nmon on dynamic targets
  hosts: dynamic_targets
  gather_facts: true
  roles:
    - nmon_check
```

## Output Variables

The role sets the following facts and stats:

### Facts
- `nmon_installed` (boolean): Whether nmon is installed
- `nmon_version` (string): Installed version or "Not Installed"
- `nmon_running` (boolean): Whether nmon is currently running
- `nmon_running_mode` (string): "systemd service", "background process", or "inactive"
- `nmon_report` (string): Human-readable summary

### Stats (for AWX/ServiceNow)
```yaml
nmon_installed: true/false
nmon_version: "16g"
nmon_running: true/false
nmon_report: "Target: server1 | Installed: YES | Version: 16g | Running Status: ACTIVE (systemd service)"
```

## OS Support

- Red Hat Enterprise Linux 7, 8, 9
- Ubuntu 18.04, 20.04, 22.04
- Debian 10, 11
- Solaris 11

## License

MIT

## Author Information

- Deepan
- Enterprise Automation
