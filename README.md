# VMware RHEL 9 VM Provisioning Ansible Project

This project automates the creation of a new, blank RHEL 9 virtual machine on a VMware host with minimal specifications (1 vCPU, 1 GB RAM, 20 GB Disk).

## Prerequisites

1. **Python Dependencies**:
   Install `pyVmomi` (VMware vSphere API Python SDK):
   ```bash
   pip install pyvmomi
   ```

2. **Ansible Collection**:
   Ensure you have the `community.vmware` collection installed:
   ```bash
   ansible-galaxy collection install community.vmware
   ```

## Configuration

Update the placeholders in `group_vars/all/vm_vars.yml` with your VMware vCenter or ESXi settings:
- `vcenter_hostname`: Hostname/IP of vCenter or ESXi
- `vcenter_username`/`vcenter_password`: Credentials
- `iso_path`: Path on your VMware datastore pointing to the RHEL 9 installer ISO image

## How to Run

1. Verify syntax of the playbook:
   ```bash
   ansible-playbook --syntax-check provision_vm.yml
   ```

2. Run the playbook:
   ```bash
   ansible-playbook provision_vm.yml
   ```
