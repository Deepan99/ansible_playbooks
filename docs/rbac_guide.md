# Ansible Role-Based Access Control (RBAC) Architecture

## 1. Executive Summary

Role-Based Access Control (RBAC) in Ansible is implemented primarily through enterprise orchestration platforms:
- **Ansible Automation Controller** (formerly **Ansible Tower**)
- **AWX** (Open Source upstream version of Ansible Controller)

While Core CLI Ansible relies on SSH permissions, **Ansible Controller / AWX** provides full enterprise RBAC to restrict who can view, edit, or execute specific Inventories, Credentials, Playbooks, and Projects.

---

## 2. Core Elements of Ansible RBAC

```
  ┌──────────┐        ┌─────────────┐        ┌─────────────────┐
  │  Users / │ ────►  │   ROLES     │ ────►  │   RESOURCES     │
  │  Groups  │        │ (Permissions│        │ (Inventories,   │
  └──────────┘        └─────────────┘        │ Credentials,    │
                                             │  Job Templates) │
                                             └─────────────────┘
```

An RBAC rule assigns a **User or Group** a specific **Role** over an Ansible **Resource**.

### A. RBAC Resources
1. **Organizations**: The highest level logical container (e.g. `Finance-Team`, `DevOps-Team`).
2. **Teams**: Groups of users within an organization.
3. **Projects**: Git repositories containing playbooks.
4. **Inventories**: Managed target servers/hosts.
5. **Credentials**: Vault passwords, SSH keys, AWS tokens (users can *use* credentials to run jobs without ever *seeing* the secret keys!).
6. **Job Templates**: A predefined execution definition linking a Playbook + Inventory + Credential.

---

## 3. Built-In RBAC Roles Matrix

Ansible Controller provides granular default roles:

| Role Name | Scope / Resource | Permissions Granted |
| :--- | :--- | :--- |
| **System Admin** | Global | Full control over the entire Ansible installation. |
| **System Auditor** | Global | Read-only access to all resources and job execution logs across all organizations. |
| **Admin** | Organization | Full administrative control over a specific Organization. |
| **Execute** | Job Template | Allows user to **launch** job templates. Cannot edit playbooks or read credentials! |
| **Use** | Credential / Inventory | Allows using a credential or inventory during job execution without seeing sensitive keys. |
| **Update** | Project / Inventory | Allows refreshing Git project repos or dynamic inventories. |
| **Read** | Any Resource | View-only permissions. |

---

## 4. Real-World Enterprise Scenario

### 🔒 Scenario: Restricting Developers from Production SSH Keys

**Goal**: Allow Junior Developers to trigger production web server deployments, **without** giving them SSH root keys or permission to edit production playbooks.

#### How RBAC Solves This:
1. **Infrastructure Team** creates:
   - Production Inventory (`prod-hosts`) -> Assigns `Use` role to Senior Admins only.
   - Production SSH Credentials -> Assigns `Use` role to Job Template only (hidden from Devs).
   - Job Template `Deploy-Web-App` -> Links Git Repo + Inventory + SSH Credentials.
2. **Junior Developer** is granted:
   - `Execute` role on `Deploy-Web-App` Job Template ONLY.
3. **Result**: The developer clicks **"Launch Job"** in the web dashboard. Ansible runs the playbook using production root SSH keys, but the developer **never sees the SSH key**, **cannot ssh into the server directly**, and **cannot alter the playbook**.

---

## 5. Integrating External Identity Providers (SSO & LDAP)

Ansible Controller RBAC integrates directly with:
- **Active Directory / LDAP**
- **SAML 2.0 / Okta / Azure AD (Entra ID)**
- **OAuth2 / OpenID Connect (Keycloak)**

Teams and permissions in Ansible Controller auto-sync based on corporate LDAP groups!
