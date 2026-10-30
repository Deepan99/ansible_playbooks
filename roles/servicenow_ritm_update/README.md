# servicenow_ritm_update

An Ansible role for automating ServiceNow RITM ticket lifecycle updates based on audit results.

## Description

This role updates ServiceNow RITM tickets after playbook execution:
- **Auto-closes** tickets when all audit targets pass verification
- **Reassigns** to a support group when remediation is needed
- **Consolidates** multi-host audit findings into ticket work notes

## Requirements

- Ansible 2.9 or higher
- ServiceNow instance with API access
- AWX or Ansible Automation Platform for secure credential injection

## Role Variables

### Default Variables

```yaml
sn_instance: "{{ lookup('env', 'SN_INSTANCE') }}"
sn_username: "{{ lookup('env', 'SN_USERNAME') }}"
sn_password: "{{ lookup('env', 'SN_PASSWORD') }}"
ritm_id: "{{ ritm_number | default('') }}"
assignment_group_name: "Linux Support"
```

### Required Environment Variables (in AWX)

- `SN_INSTANCE` - ServiceNow instance (e.g., `dev12345.service-now.com`)
- `SN_USERNAME` - ServiceNow API username
- `SN_PASSWORD` - ServiceNow API password

### Required Host Variables

- `ritm_number` - RITM ticket number (e.g., `RITM1234567`)
- `nmon_installed` - Audit result from previous role
- `nmon_report` - Audit report from previous role

## Dependencies

None. This role uses only built-in Ansible modules.

## Example Playbook

```yaml
- name: Update ServiceNow RITM
  hosts: localhost
  gather_facts: false
  roles:
    - servicenow_ritm_update
```

## Workflow

1. Checks if `ritm_number` is provided
2. If provided, queries ServiceNow for RITM sys_id
3. Consolidates audit results from all hosts
4. If all hosts verified → Close ticket (state: 3)
5. If any host failed → Reassign to support group (state: 2)
6. Adds detailed work notes with per-host status

## License

MIT

## Author Information

- Deepan
- Enterprise Automation
