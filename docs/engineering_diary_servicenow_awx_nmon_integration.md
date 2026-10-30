# Engineering Diary & Technical Runbook: End-to-End ServiceNow & AWX Integration
**Date Span:** October 29, 2026 (Afternoon) – October 30, 2026 (Early Morning)  
**Author / Engineers:** Deepan & Google Antigravity Pairing Assistant  
**Repository:** `Deepan99/ansible_playbooks`  
**Environments:** 
- ServiceNow Developer Instance: `https://dev216753.service-now.com`
- AWX Controller: `http://192.168.224.129:30080` (k3s NodePort 30080)
- MID Server: `Lab_Windows_MID` (`C:\ServiceNow\MID_Server\agent`)
- Managed Linux Nodes: `awx-master` (`192.168.224.129`), `node1` / `exec-node` (`192.168.224.130`), `node2` / `infra-node` (`192.168.224.131`)

---

## Executive Summary & Milestones Achieved

Over the course of this marathon session, we successfully built, debugged, and hardened an enterprise-grade, hybrid-cloud automation bridge between **ServiceNow ITSM / Service Catalog** and **Ansible Automation Platform (AWX)**:

1. **Complete Codebase Modernization**: Reorganized the entire repository according to Red Hat AAP & AWX standards with CI/CD linting, roles, and domain-separated playbooks.
2. **Infrastructure Bridge (MID Server)**: Solved network isolation, installer OS blocks, XML password bugs, and deployed a rock-solid Windows MID Server.
3. **End-to-End Self-Service Fulfillment**: Built ServiceNow Service Catalog items, custom IntegrationHub Actions, and Flow Designer automation that triggers AWX REST endpoints.
4. **Resilient nmon Monitoring Solution**: Architected and coded a decoupled, multi-OS, dynamic-inventory Ansible role (`nmon_check`) that inspects binary presence, version, and dual-mode running status (systemd service vs background process).
5. **ITIL Lifecycle Automation**: Configured ServiceNow to auto-close verified requests (`Closed Complete`) or dynamically reassign unverified servers to `Linux Support` with `Work in Progress` and email alerts.

---

## Phase 1: Repository Architecture & Enterprise Standards

### 1.1 Objective
Transform a legacy, flat Ansible repository into a production-grade Red Hat Ansible Automation Platform (AAP) compliant repository.

### 1.2 Actions Taken
- Purged all backup and swap artifacts (`*.bak`, `*~`, `.DS_Store`).
- Structured playbooks into distinct operational domains:
  - `playbooks/patching/` (RHEL 9, Solaris 11, Azure kernel patching)
  - `playbooks/provisioning/` (AWS EC2, Azure VM, VMware, PostgreSQL)
  - `playbooks/operations/` (Day-2 operations, user management, service restarts, nmon checks)
  - `playbooks/security/` (SSH hardening, Qualys agent deployments)
  - `playbooks/servicenow/` (Legacy ITSM fulfillment reference)
  - `playbooks/learning/` (Educational and reference playbooks)
- Implemented multi-tier inventories: `inventories/dev`, `inventories/stage`, `inventories/prod/hosts.ini`.
- Created production `ansible.cfg` with fork tuning (`forks = 10`), SSH multiplexing/pipelining enabled, and profile tasks.
- Defined enterprise dependencies in `collections/requirements.yml` (`azure.azcollection`, `amazon.aws`, `community.vmware`, `servicenow.itsm`).
- Created `.ansible-lint` enterprise profile and GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- Published comprehensive architecture guidelines: `docs/architecture.md`, `docs/rbac_guide.md`, and `docs/servicenow_integration_guide.md`.

---

## Phase 2: ServiceNow MID Server Deployment & Network Routing

### 2.1 The Challenge
The AWX server (`192.168.224.129:30080`) and target Linux nodes live on an internal, private VMware virtual network (`192.168.224.0/24`) without direct inbound internet access. ServiceNow cloud (`dev216753.service-now.com`) cannot reach private RFC 1918 IPs directly.

### 2.2 Attempt 1: Linux MID Server on `node2` (`192.168.224.131`)
- **Error Encountered**:
  ```text
  [Fatal Error] wrapper.conf:42:94: The entity name must immediately follow the '&'
  ```
- **Troubleshooting**:
  The password for `mid_deepan_user` contained special XML characters (`&` and `<`). 
  *Fix*: Escaped characters in `config.xml` to `&amp;` and `&lt;`.
- **Fatal Blocker**:
  `node2` had no outbound default route to the internet (`curl: (6) Could not resolve host: dev216753.service-now.com`).

### 2.3 Attempt 2: Windows Host MID Server (`Lab_Windows_MID`)
- The Windows physical host has dual connectivity: access to the Internet (Wi-Fi/Ethernet) and access to VMware VMnet8 (`192.168.224.x`).
- **Error Encountered**: Windows `.msi` installer failed with:
  ```text
  This package requires minimum OS version: Windows Server 2012 or greater.
  ```
- **Troubleshooting & Fix**:
  Bypassed the MSI OS restriction by downloading the pure Windows 64-bit ZIP package (`mid.brazil-08-25-2026__patch1-hotfix1-10-10-2026_10-11-2026_0905.windows.x86-64.zip`).
- Extracted to `C:\ServiceNow\MID_Server\agent`.
- Configured `config.xml`:
  ```xml
  <parameter name="url" value="https://dev216753.service-now.com/"/>
  <parameter name="mid.instance.username" value="mid_deepan_user"/>
  <parameter name="mid.instance.password" value="..."/>
  <parameter name="name" value="Lab_Windows_MID"/>
  ```
- **Authentication Issue**:
  `HTTP 401 Unauthorized` during MID handshake. Found that `mid_deepan_user` had the `Locked out` checkbox ticked in ServiceNow `sys_user`. Unchecked `Locked out`.
- **Validation**:
  Executed `start-service.bat`. Registered and validated `Lab_Windows_MID` in ServiceNow. Status: **Up (Active)**.

---

## Phase 3: ServiceNow IntegrationHub & Initial AWX Verification

### 3.1 IntegrationHub Enterprise Activation
- Activated `ServiceNow IntegrationHub Enterprise Pack Installer` from developer portal to unlock custom REST steps, MID Server routing, and Flow Designer actions.

### 3.2 CMDB Registration
- Populated Linux servers in `cmdb_ci_linux_server`:
  - `awx-master` (`192.168.224.129`)
  - `infra-node` (`192.168.224.131`)
  - `exec-node` (`192.168.224.130`)

### 3.3 Custom Action: `Launch AWX Job Template`
- **Initial Error**: REST step returned `HTTP 404 Page Not Found`.
  *Root Cause*: Base URL was set to `http://192.168.224.129` (Port 80 hit Traefik default 404).
  *Fix*: Corrected Base URL to `http://192.168.224.129:30080` (NodePort).
- **Authentication**: Configured HTTP Basic Auth using Base64 encoded credentials for user `deepan`.
- **First Live Execution**:
  Submitted Service Catalog item ➔ Generated `RITM0010003` ➔ Flow triggered AWX Job **83** ➔ Status: **Successful**.

---

## Phase 4: The `nmon` Verification Project Architecture

### 4.1 Requirements Breakdown
1. Service Catalog self-service request to check if `nmon` is installed on a target server.
2. **If Installed**: Auto-close ticket (`Closed Complete`), log diagnostic report to work notes, email requestor.
3. **If NOT Installed**: Reassign to `Linux Support` group, set state to `Work in Progress`, log findings, email team.
4. **Production Principles (SME Feedback)**:
   - **Separation of Concerns**: Let ServiceNow handle ITIL lifecycle (states, assignments, emails); keep Ansible 100% decoupled from ServiceNow APIs.
   - **Zero Static Inventories**: AWX must not keep static inventories; server list comes dynamically from ServiceNow Catalog.
   - **Lean & Effective Code**: Report 3 core metrics: Installation Status, Version (`nmon -V`), and Running Status (systemd service vs background daemon).

### 4.2 ServiceNow Configuration (12 Steps Executed)
1. **Assignment Group**: Created `Linux Support` in `sys_user_group`.
2. **Catalog Item**: Created `Verify nmon Monitoring Tool Installation` in `sc_cat_item`.
3. **Variables**:
   - `target_server`: Reference to `cmdb_ci_linux_server` (Mandatory).
   - `notification_email`: Single Line Text, default: `javascript:gs.getUser().getEmail()`.
4. **Portal Settings**: Checked `Hide 'Add to Cart'`, set Request method to `Submit` (replacing "Order Now").
5. **Flow Designer**: Created `Verify nmon Tool Installation Flow`:
   - **Trigger**: Service Catalog.
   - **Step 1**: Get Catalog Variables (`target_server`, `notification_email`).
   - **Step 2**: Launch AWX Job Template (passing `target_server` and `ritm_number`).
   - **Step 3 (IF nmon Installed)**:
     - Update Record: State = `Closed Complete` (3), Stage = `Completed`.
     - Work Notes: `[Automation] Verification SUCCESS: nmon verified installed...`
     - Send Email: Notification to Requestor.
   - **Step 4 (ELSE nmon Missing)**:
     - Update Record: Assignment Group = `Linux Support`, State = `Work in Progress` (2).
     - Work Notes: `[Automation Alert] Verification FAILED: nmon NOT installed...`
     - Send Email: Alert to `Linux Support` and Requestor.
6. **Activated Flow** and linked to Catalog Item under Process Engine.

---

## Phase 5: Ansible Role & Playbook Engineering

### 5.1 Standalone Modular Structure
Completely separated from ServiceNow legacy folders:
```text
roles/nmon_check/
├── defaults/
│   └── main.yml
└── tasks/
    └── main.yml

playbooks/operations/
└── check_nmon.yml
```

### 5.2 Enterprise Hardening & Troubleshooting

#### Issue 1: Missing `which` & Multi-OS Compatibility
- *Challenge*: What if minimal Linux lacks `which`, or distro is Debian vs RHEL?
- *Solution*: Replaced shell commands with native `ansible.builtin.stat` checking `/usr/bin/nmon` and `ansible.builtin.service_facts`. Tested across Ubuntu 26.04 and CentOS 9.

#### Issue 2: VMware NAT Network Outage & GitHub Sync Failure
- *Error*:
  ```text
  fatal: [localhost]: FAILED! => fatal: unable to access 'https://github.com/Deepan99/ansible_playbooks.git/': Could not resolve host: github.com
  ping 8.8.8.8 -> Destination Host Unreachable
  ```
- *Root Cause*: VMware NAT Service on Windows host was hung/stopped.
- *Troubleshooting & Fix*:
  Restarted `VMware NAT Service` and `VMnetDHCP` via PowerShell (`Restart-Service "VMware NAT Service" -Force`). Verified `ping 8.8.8.8` (0% packet loss) and synced AWX project successfully.

#### Issue 3: The `omit` Placeholder Hostname Bug
- *Error*:
  ```text
  fatal: [node1]: UNREACHABLE! => ssh: Could not resolve hostname __omit_place_holder__063b2ab732ee...
  ```
- *Root Cause*: `ansible_host: "{{ target_ip | default(omit) }}"` placed in play-level `vars`. Ansible's `omit` object stringified into `__omit_place_holder__`.
- *Fix*: Removed `omit` from play vars, allowing Ansible to use inventory hostname/IP directly.

#### Issue 4: Audit & Report Pattern vs Assertions
- *Discussion*: Should the AWX job fail (Red) if `nmon` is not installed?
- *Architectural Decision*: **NO**. The Ansible job is an auditor; scanning a host and detecting missing software is a **100% successful execution**. Removed all artificial assertion/failure tasks so AWX runs stay **Green (Successful)**.

#### Issue 5: Dual Running Status Detection
- *Challenge*: `nmon` is usually a daemon or cron script, but some teams use a systemd unit.
- *Solution*: Added dual-mode checking:
  1. Checks `ansible_facts.services['nmon.service']` via `service_facts`.
  2. Checks process table via `pgrep -x nmon`.
  3. Reports `ACTIVE (systemd service)`, `ACTIVE (background process)`, or `INACTIVE`.

#### Issue 6: Zero Static Inventory Implementation
- *Implementation* in `check_nmon.yml`:
  ```yaml
  - name: 1. Dynamically Register ServiceNow Target Host
    hosts: localhost
    gather_facts: false
    vars:
      resolved_target: "{{ target_server | default(target_host | default('')) }}"
    tasks:
      - name: Add target server to dynamic in-memory execution inventory
        ansible.builtin.add_host:
          name: "{{ resolved_target }}"
          groups: dynamic_targets
          ansible_ssh_timeout: 15

  - name: 2. Audit nmon Installation, Version, and Running Status
    hosts: dynamic_targets
    gather_facts: false
    roles:
      - role: nmon_check
  ```

---

## Phase 6: Live Execution & Payload Refinement

### 6.1 MID Server Service Resilience
- *Symptom*: Flow failed with `Execution failed because no valid MID is available (Status: Down)`.
- *Fix*: Started `sn_mid_Lab_Windows_MID` service. Configured Windows Service **Recovery Tab** to automatically restart the service on 1st, 2nd, and subsequent failures.

### 6.2 Hostname Payload Formatting Bug
- *Symptom*:
  ```text
  fatal: [{{Inputs.target_host}}]: UNREACHABLE! => hostname contains invalid characters
  ```
- *Root Cause*: In the Action's REST step Request Body, `{{Inputs.target_host}}` was entered as literal string text containing whitespace/newlines instead of an evaluated ServiceNow Data Pill.
- *Fix*: Cleaned JSON payload and dropped proper Action Input data pills into:
  ```json
  {
    "extra_vars": {
      "target_host": "[Target Host]",
      "target_server": "[Target Host]",
      "ritm_number": "[RITM Number]",
      "action_type": "check_nmon"
    }
  }
  ```

---

## Verification & Status Check

| Component | Status | Verification Note |
| :--- | :---: | :--- |
| **Git Repository** | **PASS** | Cleaned, linted, domain-separated, pushed to `main`. |
| **MID Server (`Lab_Windows_MID`)** | **PASS** | Windows Service active, auto-recovery configured. |
| **AWX Project Sync** | **PASS** | Network route restored, synced with GitHub. |
| **AWX Job Template** | **PASS** | `Verify nmon Tool Installation` created with prompt vars. |
| **Service Catalog Item** | **PASS** | Configured with `Submit` button, variables, and process engine. |
| **Flow Designer Flow** | **PASS** | Active, contains If/Else routing, work notes, and emails. |
| **Multi-OS Role (`nmon_check`)** | **PASS** | Verified on Ubuntu 26.04 and CentOS 9 without errors. |

---

## Summary of Key Repository Artifacts Created
- Role: [`roles/nmon_check/tasks/main.yml`](file:///e:/Deepan/Linux/ansible/roles/nmon_check/tasks/main.yml)
- Role Defaults: [`roles/nmon_check/defaults/main.yml`](file:///e:/Deepan/Linux/ansible/roles/nmon_check/defaults/main.yml)
- Playbook: [`playbooks/operations/check_nmon.yml`](file:///e:/Deepan/Linux/ansible/playbooks/operations/check_nmon.yml)
- 12-Step Implementation Guide: [`docs/servicenow_nmon_catalog_implementation_guide.md`](file:///e:/Deepan/Linux/ansible/docs/servicenow_nmon_catalog_implementation_guide.md)
- Complete Diary / Runbook: [`docs/engineering_diary_servicenow_awx_nmon_integration.md`](file:///e:/Deepan/Linux/ansible/docs/engineering_diary_servicenow_awx_nmon_integration.md)
