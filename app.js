// Ansible Interactive Practice & Simulator Logic

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initInventoryBuilder();
  initPlaybookSimulator();
  initModulesExplorer();
  initVaultDemo();
});

/* -------------------------------------------------------------------------- */
/* 1. TABS SYSTEM                                                             */
/* -------------------------------------------------------------------------- */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 2. INVENTORY BUILDER                                                       */
/* -------------------------------------------------------------------------- */
const inventoriesData = {
  'web-db': {
    ini: `[webservers]
web1.example.com ansible_host=192.168.1.10 ansible_user=ubuntu
web2.example.com ansible_host=192.168.1.11 ansible_user=ubuntu

[dbservers]
db1.example.com ansible_host=192.168.1.20 ansible_user=admin

[webservers:vars]
http_port=80
max_clients=200

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_private_key_file=~/.ssh/id_rsa`,
    yaml: `all:
  vars:
    ansible_python_interpreter: /usr/bin/python3
    ansible_ssh_private_key_file: ~/.ssh/id_rsa
  children:
    webservers:
      vars:
        http_port: 80
        max_clients: 200
      hosts:
        web1.example.com:
          ansible_host: 192.168.1.10
          ansible_user: ubuntu
        web2.example.com:
          ansible_host: 192.168.1.11
          ansible_user: ubuntu
    dbservers:
      hosts:
        db1.example.com:
          ansible_host: 192.168.1.20
          ansible_user: admin`
  },
  'multi-env': {
    ini: `[staging_web]
stage-web1.internal ansible_host=10.0.1.5

[prod_web]
prod-web1.internal ansible_host=10.0.2.10
prod-web2.internal ansible_host=10.0.2.11

[production:children]
prod_web`,
    yaml: `all:
  children:
    staging:
      hosts:
        stage-web1.internal:
          ansible_host: 10.0.1.5
    production:
      children:
        prod_web:
          hosts:
            prod-web1.internal:
              ansible_host: 10.0.2.10
            prod-web2.internal:
              ansible_host: 10.0.2.11`
  },
  'cloud-k8s': {
    ini: `[k8s_control_plane]
master1.k8s.local ansible_host=172.16.0.10

[k8s_workers]
worker1.k8s.local ansible_host=172.16.0.21
worker2.k8s.local ansible_host=172.16.0.22
worker3.k8s.local ansible_host=172.16.0.23`,
    yaml: `all:
  children:
    k8s_control_plane:
      hosts:
        master1.k8s.local:
          ansible_host: 172.16.0.10
    k8s_workers:
      hosts:
        worker1.k8s.local:
          ansible_host: 172.16.0.21
        worker2.k8s.local:
          ansible_host: 172.16.0.22
        worker3.k8s.local:
          ansible_host: 172.16.0.23`
  }
};

function initInventoryBuilder() {
  const select = document.getElementById('topology-select');
  const preview = document.getElementById('inventory-preview');
  const btnIni = document.getElementById('fmt-ini');
  const btnYaml = document.getElementById('fmt-yaml');

  let currentFormat = 'ini';

  function updatePreview() {
    const topo = select.value;
    preview.textContent = inventoriesData[topo][currentFormat];
  }

  select.addEventListener('change', updatePreview);

  btnIni.addEventListener('click', () => {
    currentFormat = 'ini';
    btnIni.classList.add('active');
    btnYaml.classList.remove('active');
    updatePreview();
  });

  btnYaml.addEventListener('click', () => {
    currentFormat = 'yaml';
    btnYaml.classList.add('active');
    btnIni.classList.remove('active');
    updatePreview();
  });

  updatePreview();
}

/* -------------------------------------------------------------------------- */
/* 3. PLAYBOOK SIMULATOR                                                      */
/* -------------------------------------------------------------------------- */
const playbooksScenarios = {
  nginx: {
    code: `---
- name: Configure Web Server Fleet
  hosts: webservers
  become: true
  vars:
    http_port: 80
    app_title: "Welcome to Ansible Deep Learning"

  tasks:
    - name: Ensure Nginx package is installed
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: yes

    - name: Deploy custom Nginx index page
      ansible.builtin.template:
        src: index.html.j2
        dest: /var/www/html/index.html
        owner: www-data
        mode: '0644'
      notify: Restart Nginx Service

    - name: Ensure Nginx service is running and enabled
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Restart Nginx Service
      ansible.builtin.service:
        name: nginx
        state: restarted`,
    nodes: ['web-node-01', 'web-node-02'],
    tasks: [
      { name: 'Gathering Facts', type: 'setup', result: 'ok' },
      { name: 'Ensure Nginx package is installed', type: 'apt', result: 'changed' },
      { name: 'Deploy custom Nginx index page', type: 'template', result: 'changed' },
      { name: 'Ensure Nginx service is running and enabled', type: 'service', result: 'ok' },
      { name: 'RUNNING HANDLER [Restart Nginx Service]', type: 'handler', result: 'changed' }
    ]
  },
  db: {
    code: `---
- name: Setup PostgreSQL Database Server
  hosts: dbservers
  become: true
  vars_files:
    - vars/secrets.yml

  tasks:
    - name: Install PostgreSQL server packages
      ansible.builtin.apt:
        name:
          - postgresql
          - postgresql-contrib
          - python3-psycopg2
        state: present

    - name: Create application database
      community.postgresql.postgresql_db:
        name: production_db
        state: present

    - name: Create database user with permissions
      community.postgresql.postgresql_user:
        db: production_db
        name: app_user
        password: "{{ db_password }}"
        priv: "ALL"
        state: present`,
    nodes: ['db-node-01'],
    tasks: [
      { name: 'Gathering Facts', type: 'setup', result: 'ok' },
      { name: 'Install PostgreSQL server packages', type: 'apt', result: 'changed' },
      { name: 'Create application database', type: 'postgresql_db', result: 'changed' },
      { name: 'Create database user with permissions', type: 'postgresql_user', result: 'changed' }
    ]
  },
  users: {
    code: `---
- name: Security Hardening & User Provisioning
  hosts: all
  become: true

  tasks:
    - name: Create sysadmin group
      ansible.builtin.group:
        name: sysadmin
        state: present

    - name: Deploy devops user with sudo access
      ansible.builtin.user:
        name: devops
        group: sysadmin
        shell: /bin/bash
        create_home: true

    - name: Add SSH authorized key for devops user
      ansible.posix.authorized_key:
        user: devops
        state: present
        key: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... devops-key"`,
    nodes: ['web-node-01', 'web-node-02', 'db-node-01'],
    tasks: [
      { name: 'Gathering Facts', type: 'setup', result: 'ok' },
      { name: 'Create sysadmin group', type: 'group', result: 'ok' },
      { name: 'Deploy devops user with sudo access', type: 'user', result: 'changed' },
      { name: 'Add SSH authorized key for devops user', type: 'authorized_key', result: 'changed' }
    ]
  },
  handler: {
    code: `---
- name: Demonstrate Idempotency & Handlers
  hosts: webservers
  become: true

  tasks:
    - name: Update SSH Configuration file
      ansible.builtin.lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^PermitRootLogin'
        line: 'PermitRootLogin no'
      notify: Restart SSH Daemon

  handlers:
    - name: Restart SSH Daemon
      ansible.builtin.service:
        name: sshd
        state: restarted`,
    nodes: ['web-node-01', 'web-node-02'],
    tasks: [
      { name: 'Gathering Facts', type: 'setup', result: 'ok' },
      { name: 'Update SSH Configuration file', type: 'lineinfile', result: 'ok' }
      // If run 2nd time, result is ok, handler will NOT trigger!
    ]
  }
};

let hasRunOnce = false;

function initPlaybookSimulator() {
  const select = document.getElementById('playbook-select');
  const codeElem = document.getElementById('playbook-code');
  const runBtn = document.getElementById('run-playbook-btn');
  const resetBtn = document.getElementById('reset-sim-btn');
  const termOutput = document.getElementById('terminal-output');
  const nodesGrid = document.getElementById('nodes-status-grid');

  function loadPlaybook() {
    const key = select.value;
    codeElem.textContent = playbooksScenarios[key].code;
    renderNodes(playbooksScenarios[key].nodes);
    hasRunOnce = false;
  }

  function renderNodes(nodeList, states = {}) {
    nodesGrid.innerHTML = '';
    nodeList.forEach(node => {
      const state = states[node] || 'clean';
      const nodeEl = document.createElement('div');
      nodeEl.className = `node-card ${state === 'updated' ? 'updated' : ''}`;
      nodeEl.innerHTML = `
        <span class="node-status-dot" style="background: ${state === 'updated' ? '#facc15' : '#10b981'}"></span>
        <strong>${node}</strong>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem;">
          ${state === 'updated' ? 'State Modified' : 'In Sync (OK)'}
        </div>
      `;
      nodesGrid.appendChild(nodeEl);
    });
  }

  select.addEventListener('change', loadPlaybook);
  loadPlaybook();

  resetBtn.addEventListener('click', () => {
    termOutput.innerHTML = `<div class="term-line">State reset. Ready for execution.</div>`;
    loadPlaybook();
  });

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    const scenarioKey = select.value;
    const scenario = playbooksScenarios[scenarioKey];
    
    termOutput.innerHTML = '';

    const appendTerm = (text, type = '') => {
      const div = document.createElement('div');
      div.className = `term-line ${type}`;
      div.textContent = text;
      termOutput.appendChild(div);
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    appendTerm(`PLAY [${scenarioKey.toUpperCase()} SETUP] *****************************************************`, 'play');
    await sleep(400);

    const isIdempotentRun = hasRunOnce;

    for (const task of scenario.tasks) {
      appendTerm(`TASK [${task.name}] ***************************************************`, 'play');
      await sleep(500);

      scenario.nodes.forEach(node => {
        let res = task.result;
        if (isIdempotentRun && res === 'changed') {
          res = 'ok'; // Idempotency effect!
        }
        appendTerm(`${res}: [${node}]`, res);
      });
      await sleep(300);
    }

    appendTerm(`PLAY RECAP ********************************************************************`, 'play');
    scenario.nodes.forEach(node => {
      const changedCount = isIdempotentRun ? 0 : 2;
      const okCount = scenario.tasks.length - changedCount;
      appendTerm(`${node} : ok=${okCount} changed=${changedCount} unreachable=0 failed=0 rescued=0 ignored=0`, isIdempotentRun ? 'ok' : 'changed');
    });

    const updatedStates = {};
    scenario.nodes.forEach(n => updatedStates[n] = isIdempotentRun ? 'in_sync' : 'updated');
    renderNodes(scenario.nodes, updatedStates);

    hasRunOnce = true;
    runBtn.disabled = false;
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* -------------------------------------------------------------------------- */
/* 4. MODULES CHEAT SHEET                                                     */
/* -------------------------------------------------------------------------- */
const modulesList = [
  {
    name: 'ansible.builtin.apt / yum',
    category: 'Package Management',
    desc: 'Manages packages on Linux systems (Debian/Ubuntu & RHEL/CentOS).',
    example: `- name: Install Nginx
  ansible.builtin.apt:
    name: nginx
    state: present`
  },
  {
    name: 'ansible.builtin.service / systemd',
    category: 'System Services',
    desc: 'Controls daemon services on target nodes (start, stop, restart, enable on boot).',
    example: `- name: Start Apache service
  ansible.builtin.service:
    name: apache2
    state: started
    enabled: yes`
  },
  {
    name: 'ansible.builtin.copy',
    category: 'File Operations',
    desc: 'Copies local static files from Control Node to remote Target Nodes.',
    example: `- name: Copy configuration file
  ansible.builtin.copy:
    src: /local/path/app.conf
    dest: /etc/app.conf
    mode: '0644'`
  },
  {
    name: 'ansible.builtin.template',
    category: 'Templating (Jinja2)',
    desc: 'Renders dynamic Jinja2 templates (`.j2`) using variables and copies to target.',
    example: `- name: Render Nginx config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf`
  },
  {
    name: 'ansible.builtin.user / group',
    category: 'Identity Management',
    desc: 'Manages user accounts, UID, home directory, shell, and user groups.',
    example: `- name: Create deploy user
  ansible.builtin.user:
    name: deploy
    shell: /bin/bash
    groups: sudo`
  },
  {
    name: 'ansible.builtin.command / shell',
    category: 'Commands',
    desc: 'Executes arbitrary shell commands on target nodes (`shell` supports pipes `|`).',
    example: `- name: Check kernel version
  ansible.builtin.command: uname -r
  register: kernel_output`
  },
  {
    name: 'ansible.builtin.git',
    category: 'Source Control',
    desc: 'Clones or pulls Git software repositories on the target node.',
    example: `- name: Checkout web application repo
  ansible.builtin.git:
    repo: 'https://github.com/example/app.git'
    dest: /var/www/app
    version: main`
  },
  {
    name: 'ansible.builtin.cron',
    category: 'Scheduling',
    desc: 'Manages crontab entries on target system.',
    example: `- name: Schedule daily backup script
  ansible.builtin.cron:
    name: "Daily Backup"
    minute: "0"
    hour: "2"
    job: "/usr/local/bin/backup.sh"`
  }
];

function initModulesExplorer() {
  const container = document.getElementById('modules-grid');
  const searchInput = document.getElementById('module-search');

  function renderModules(filter = '') {
    container.innerHTML = '';
    const filtered = modulesList.filter(m => 
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.category.toLowerCase().includes(filter.toLowerCase()) ||
      m.desc.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'module-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="module-name">${mod.name}</div>
          <span class="module-category">${mod.category}</span>
        </div>
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0.5rem 0;">${mod.desc}</p>
        <pre class="code-block" style="padding: 0.6rem; font-size: 0.75rem;"><code>${mod.example}</code></pre>
      `;
      container.appendChild(card);
    });
  }

  searchInput.addEventListener('input', (e) => renderModules(e.target.value));
  renderModules();
}

/* -------------------------------------------------------------------------- */
/* 5. VAULT DEMO                                                              */
/* -------------------------------------------------------------------------- */
function initVaultDemo() {
  const passInput = document.getElementById('vault-pass');
  const rawInput = document.getElementById('vault-raw');
  const outputCode = document.getElementById('vault-output');
  const btnEncrypt = document.getElementById('btn-encrypt-vault');
  const btnDecrypt = document.getElementById('btn-decrypt-vault');

  let savedRawText = '';

  btnEncrypt.addEventListener('click', () => {
    const raw = rawInput.value;
    savedRawText = raw;
    const header = `$ANSIBLE_VAULT;1.1;AES256`;
    // Simulated AES256 Vault Hex Output
    const fakeCiphertext = Array.from({length: 8}, () => 
      Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    ).join('\n');

    outputCode.textContent = `${header}\n36643634353463663435343539393739633633633634303333333333333333333333\n${fakeCiphertext}`;
  });

  btnDecrypt.addEventListener('click', () => {
    outputCode.textContent = savedRawText || rawInput.value;
  });
}
