# ServiceNow Service Catalog Integration: nmon Monitoring Tool Verification

This document provides the complete, end-to-end implementation runbook for the automated **nmon Performance Monitoring Tool Verification** Service Catalog item integrated with Ansible / AWX.

---

## Architecture Overview

```
[User Request in Service Portal]
          │
          ▼
[Service Catalog: "Verify nmon Monitoring Tool Installation"]
          │  (Collects: Target Server, Notification Email)
          ▼
[Flow Designer: "Verify nmon Tool Installation Flow"]
          │
          ├──► Step 1: Get Catalog Variables
          │
          ├──► Step 2: Trigger AWX Job Template (ID: 83 / 84) via MID Server
          │
          ├──► Step 3: IF (nmon is Installed / Status 200/201)
          │      ├── Update RITM: State = "Closed Complete", Stage = "Completed"
          │      ├── Update Work Notes: "[Automation] Verification SUCCESS: nmon verified installed..."
          │      └── Send Email: Notify Requestor (Auto-Closed)
          │
          └──► Step 4: ELSE (nmon NOT Installed)
                 ├── Update RITM: Assignment Group = "Linux Support", State = "Work in Progress"
                 ├── Update Work Notes: "[Automation Alert] Verification FAILED: nmon NOT installed..."
                 └── Send Email: Alert Linux Support team & Requestor
```

---

## Step-by-Step Implementation Guide

### Step 1: Create the Assignment Group (`Linux Support`)
1. In ServiceNow filter navigator, go to **User Administration > Groups** (`sys_user_group.do`).
2. Click **New**.
3. Configure the fields:
   - **Name**: `Linux Support`
   - **Type**: `itil`
   - **Description**: `Linux server infrastructure and operations support team.`
4. Click **Submit** (or right-click header and click **Save**).

---

### Step 2: Create the Service Catalog Item
1. Navigate to **Service Catalog > Catalog Definitions > Maintain Items** (`sc_cat_item.do`).
2. Click **New**.
3. Configure the fields:
   - **Name**: `Verify nmon Monitoring Tool Installation`
   - **Catalogs**: `Service Catalog`
   - **Category**: `Can We Help You?` (or `Services`)
   - **Short description**: `Automated verification of nmon performance monitoring tool on Linux servers`
   - **Description**: `Checks if nmon is installed on the target Linux server. Automatically closes upon success or routes to Linux Support for remediation.`
4. Right-click the header bar and click **Save**.

---

### Step 3: Create Catalog Variables
On the same Catalog Item form, scroll down to the **Variables** related list:

1. **Variable 1: Target Server**
   - Click **New**.
   - **Type**: `Reference`
   - **Question**: `Target Server`
   - **Name**: `target_server`
   - **Mandatory**: Checked (`true`)
   - **Reference Specification Tab**:
     - **Reference**: `Linux Server [cmdb_ci_linux_server]`
   - Click **Submit**.

2. **Variable 2: Notification Email**
   - Click **New**.
   - **Type**: `Single Line Text`
   - **Question**: `Notification Email`
   - **Name**: `notification_email`
   - **Default Value Tab**:
     - **Default value**: `javascript:gs.getUser().getEmail()`
   - Click **Submit**.

---

### Step 4: Create the Flow in Flow Designer / Workflow Studio
1. Navigate to **Process Automation > Flow Designer** (or open Workflow Studio).
2. Click **+ New** > **Flow**.
3. Configure Flow Properties:
   - **Flow name**: `Verify nmon Tool Installation Flow`
   - **Description**: `Verifies nmon installation on target Linux server via AWX. Auto-closes if installed, reassigns to Linux Support if missing.`
   - **Run As**: `System User`
4. Click **Build Flow**.

---

### Step 5: Configure the Flow Trigger
1. In the Flow builder canvas, click **Add a trigger**.
2. Under **Service Catalog**, select **Service Catalog**.
3. Click **Done**.

---

### Step 6: Step 1 Action - "Get Catalog Variables"
1. Click **+ Add an Action, Flow Logic, or Subflow** > **Action**.
2. Select **ServiceNow Core > Get Catalog Variables**.
3. Configure:
   - **Submitted Item**: Drag `Trigger - Service Catalog > Requested Item Record` from the right Data panel.
   - **Template-Catalog Item**: Select `Verify nmon Monitoring Tool Installation`.
   - **Available Variables**: Move both `target_server` and `notification_email` to the **Selected** box using the `>` arrow.
4. Click **Done**.

---

### Step 7: Step 2 Action - "Launch AWX Job Template"
1. Click **+ Add an Action, Flow Logic, or Subflow** > **Action**.
2. Select your custom action: **Launch AWX Job Template**.
3. Configure inputs:
   - **Target Host**: Drag `1 - Get Catalog Variables > target_server`.
   - **Action Type**: `check_nmon`
   - **Target Service**: `nmon`
   - **RITM Number**: Drag `Trigger - Service Catalog > Requested Item Record > Number`.
   - **Job Template ID**: `83` (or the target AWX Template ID).
4. Click **Done**.

---

### Step 8: Step 3 Flow Logic - "If nmon is Installed"
1. Click **+ Add an Action, Flow Logic, or Subflow** > **Flow Logic** > **If**.
2. Configure:
   - **Condition Label**: `If nmon is Installed`
   - **Condition**: 
     - Drag `2 - Launch AWX Job Template > Status Code` **is** `201`
     - Click **OR**
     - Drag `2 - Launch AWX Job Template > Status Code` **is** `200`
3. Click **Done**.

---

### Step 9: Inside IF Branch - Update RITM & Send Success Email
Under the indented **`then`** block of the IF condition:

1. **Add Action: Update Record**:
   - **Record**: Drag `Trigger - Service Catalog > Requested Item Record`.
   - **Field Values**:
     - `State` -> `Closed Complete`
     - `Stage` -> `Completed`
     - `Work notes` ->
       ```text
       [Automation] Verification SUCCESS: nmon performance tool is installed and active on the target server. Ticket has been automatically Closed Complete.
       ```
   - Click **Done**.

2. **Add Action: Send Email**:
   - **Target Record**: Drag `Trigger - Service Catalog > Requested Item Record`.
   - **To**: Drag `1 - Get Catalog Variables > notification_email`.
   - **Subject**: `nmon Status Check: INSTALLED (Request Auto-Closed)`
   - **Body**:
     ```text
     Hello,

     The automated check for nmon on your requested server has completed successfully.
     Result: nmon is INSTALLED and operational.

     This ticket has been verified and closed automatically.
     ```
   - Click **Done**.

---

### Step 10: Step 4 Flow Logic - "Else" (nmon NOT Installed)
Below the IF block (on the outer line):

1. Click **+ Add an Action, Flow Logic, or Subflow** > **Flow Logic** > **Else**.
2. Click **Done**.

Inside the indented **`then`** block of the Else condition:

3. **Add Action: Update Record**:
   - **Record**: Drag `Trigger - Service Catalog > Requested Item Record`.
   - **Field Values**:
     - `Assignment group` -> `Linux Support`
     - `State` -> `Work in Progress`
     - `Work notes` ->
       ```text
       [Automation Alert] Verification FAILED: nmon is NOT installed on the target server. Ticket has been automatically assigned to Linux Support for manual remediation.
       ```
   - Click **Done**.

4. **Add Action: Send Email**:
   - **Target Record**: Drag `Trigger - Service Catalog > Requested Item Record`.
   - **To**: Drag `1 - Get Catalog Variables > notification_email` (and optionally add `Requested Item Record > Assignment group`).
   - **Subject**: `[ACTION REQUIRED] nmon NOT installed on server (Assigned to Linux Support)`
   - **Body**:
     ```text
     Hello,

     The automated check detected that the nmon performance monitoring tool is NOT installed on the target server.

     Status:
     - Ticket State: Work in Progress
     - Assignment Group: Linux Support

     The Linux Support engineering team has been notified and will proceed with the installation.
     ```
   - Click **Done**.

5. Click **Save**, then click **Activate** at top right.

---

### Step 11: Link Flow to Catalog Item & Configure "Submit" Button
1. Open the Catalog Item: **Maintain Items > Verify nmon Monitoring Tool Installation**.
2. In the **Process Engine** tab:
   - **Flow**: Select `Verify nmon Tool Installation Flow`.
   - **Workflow**: Ensure this field is left empty.
3. In the **Portal Settings** tab:
   - Check **Hide 'Add to Cart'**.
   - **Request method**: Change from `Order` to `Submit`.
4. Right-click header bar and click **Save** (or click **Update**).

---

### Step 12: End-to-End Validation & Testing
1. On the Catalog Item form, click **Try It** (top right).
2. Fill in:
   - **Target Server**: Choose target Linux host (e.g. `infra-node` or `awx-master`).
   - **Notification Email**: Enter notification recipient email.
   - Click **Submit**.
3. Open the generated **RITM** record and verify:
   - If installed: State is `Closed Complete`, Work Notes log success, resolution email sent.
   - If missing: State is `Work in Progress`, Assignment Group is `Linux Support`, alert email sent.
4. Open **Flow Designer > Executions** to trace the live execution context.
5. Open **System Mailboxes > Outbox / Sent** (`sys_email_list.do`) to inspect generated emails.
