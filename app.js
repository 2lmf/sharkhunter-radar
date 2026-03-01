// SharkHunter v2.5 - Real Data Sync
const COUNTIES = [
    "Austrija", "Beč", "Grad Zagreb", "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka",
    "Karlovačka", "Varaždinska", "Koprivničko-križevačka", "Bjelovarsko-bilogorska",
    "Primorsko-goranska", "Ličko-senjska", "Virovitičko-podravska", "Požeško-slavonska",
    "Brodsko-posavska", "Zadarska", "Osječko-baranjska", "Šibensko-kninska",
    "Vukovarsko-srijemska", "Splitsko-dalmatinska", "Istarska", "Dubrovačko-neretvanska",
    "Međimurska"
];

const TARGET_SHEET_ID = "1w-iMtoqufPtzE6n8UX_aaqNvqcr9rtwFexW7ZkEiXow";
const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbxvJsWlcHGP0V2s-vr9suj6cgRd0HJUe_ZCeSM6v9BQFds9abphVANYnxuvw0ijy9yr/exec";

let missions = [];
let localMissions = [];
let cloudMissions = [];
let prey = [];
let currentFilter = 'all';
let syncUrl = localStorage.getItem('sharkhunter_sync_url') || DEFAULT_SYNC_URL;
let isRefreshing = false;

// Elements
const modal = document.getElementById('modal-mission');
const btnAdd = document.getElementById('btn-new-mission');
const btnRefresh = document.getElementById('btn-refresh');
const preyCountBadge = document.getElementById('prey-count');
const scanStatus = document.getElementById('scan-status');

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    initModal();
    initSettings();
    updateMissionsList();
    renderPrey();
    updatePreyCount();
    startRadarSimulation();
    initTabs();
    initFilters();

    if (btnRefresh) {
        btnRefresh.onclick = () => refreshAllData();
    }

    if (syncUrl) refreshAllData();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered!', reg))
                .catch(err => console.log('SW Registration Failed:', err));
        });
    }
});

async function refreshAllData() {
    if (isRefreshing) return;
    isRefreshing = true;
    if (scanStatus) scanStatus.textContent = "SYNCING...";
    if (btnRefresh) btnRefresh.classList.add('pulse');

    try {
        await Promise.all([
            fetchCloudMissions(),
            fetchCloudPrey()
        ]);
        if (scanStatus) scanStatus.textContent = "ONLINE";
    } catch (err) {
        console.error("Sync error:", err);
        if (scanStatus) scanStatus.textContent = "OFFLINE";
    } finally {
        isRefreshing = false;
        if (btnRefresh) btnRefresh.classList.remove('pulse');
        setTimeout(() => {
            if (scanStatus && scanStatus.textContent === "ONLINE") scanStatus.textContent = "SCANNING";
        }, 3000);
    }
}

function initSettings() {
    const header = document.querySelector('.header-content');
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.className = 'chip';
    settingsBtn.style.padding = '0.5rem';
    settingsBtn.onclick = () => {
        const url = prompt("Unesi Google Apps Script Web App URL:", syncUrl);
        if (url !== null) {
            syncUrl = url;
            localStorage.setItem('sharkhunter_sync_url', url);
            refreshAllData();
        }
    };
    header.appendChild(settingsBtn);
}

async function fetchCloudMissions() {
    if (!syncUrl) return;
    try {
        const response = await fetch(syncUrl + "?action=getMissions");
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        cloudMissions = data.map((m, i) => ({
            id: "cloud-m-" + i,
            title: (m.naslov || "BEZ NASLOVA").toUpperCase(),
            category: m.kategorija || "auto",
            budget: parseInt(m.budžet) || 0,
            kmMax: parseInt(m.km_max) || 0,
            yearMin: parseInt(m.godište_min) || 0,
            powerKS: parseInt(m.ks) || 0,
            keyword: m.ključna_riječ || "",
            location: m.lokacija || "",
            counties: Array.isArray(m.županije) ? m.županije : [],
            isCloud: true,
            status: "CLOUD SYNC",
            rating: (Math.random() * 1.5 + 8.5).toFixed(1)
        }));
        updateMissionsList();
        console.log("Cloud missions synced:", cloudMissions);
    } catch (err) {
        console.error("Cloud missions sync failed:", err);
    }
}

async function fetchCloudPrey() {
    if (!syncUrl) return;
    try {
        const response = await fetch(syncUrl + "?action=getPrey");
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const oldPreyIds = new Set(prey.map(p => p.id));

        prey = data.map((p, i) => ({
            id: p.id || "cloud-p-" + i,
            title: p.naslov || "Pronađen oglas",
            category: p.kategorija || "ostalo",
            price: parseInt(p.cijena) || 0,
            desc: p.opis || "Nema opisa.",
            rating: p.ocjena || (Math.random() * 2 + 7.8).toFixed(1),
            url: p.link || "#",
            isNew: !oldPreyIds.has(p.id || "cloud-p-" + i) && prey.length > 0
        }));

        renderPrey();
        updatePreyCount();
    } catch (err) {
        console.error("Cloud prey sync failed:", err);
    }
}

function updateMissionsList() {
    missions = [...cloudMissions, ...localMissions];
    renderMissions();
}

function initModal() {
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="retro-title">NOVA <span>MISIJA</span></h2>
            <button class="btn-close">&times;</button>
        </div>
        <div id="modal-scroll-area" style="max-height: 70vh; overflow-y: auto; padding-right: 5px;">
            <form id="hunt-form">
                <div class="form-group">
                    <label>KATEGORIJA</label>
                    <select id="mission-category" class="shark-select">
                        <option value="auto">Automobili 🚗</option>
                        <option value="nekretnina">Nekretnine 🏠</option>
                        <option value="zemljiste">Zemljišta 🌲</option>
                        <option value="ostalo">Ostalo 🦈</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>NAZIV POTRAGE</label>
                    <input type="text" id="mission-title" class="shark-input" required placeholder="npr. BMW 3, Stan Jarun, Mobiteli...">
                </div>
                
                <div id="dynamic-fields">
                    <!-- Initial: Auto Fields -->
                </div>

                <div class="form-group">
                    <label>KLJUČNA RIJEČ (npr. M-Paket, Klima, Loggia)</label>
                    <input type="text" id="mission-keyword" class="shark-input" placeholder="Opcionalno...">
                </div>

                <div class="form-group" id="location-input-group">
                    <label>DETALJNA LOKACIJA (npr. Zagreb + 50km)</label>
                    <input type="text" id="mission-location" class="shark-input" placeholder="Zagreb + 50km">
                </div>

                <div id="county-selection-area"></div>

                <button type="submit" class="btn-hunt">POKRENI LOKALNI LOV 🦈</button>
                <div style="font-size: 0.6rem; color: var(--text-dim); text-align: center; margin-top: 1rem;">
                    * Cloud Sinkronizacija: <br> ${TARGET_SHEET_ID}
                </div>
            </form>
        </div>
    `;

    const closeBtn = document.querySelector('.btn-close');
    const form = document.getElementById('hunt-form');
    const catSelect = document.getElementById('mission-category');
    const dynFields = document.getElementById('dynamic-fields');

    btnAdd.onclick = () => {
        updateFormFields(catSelect.value, dynFields);
        modal.classList.remove('hidden');
    };
    closeBtn.onclick = () => modal.classList.add('hidden');

    catSelect.onchange = (e) => updateFormFields(e.target.value, dynFields);

    form.onsubmit = (e) => {
        e.preventDefault();
        saveMission(form);
    };

    updateFormFields('auto', dynFields);
}

function updateFormFields(category, container) {
    const countyArea = document.getElementById('county-selection-area');
    const locGroup = document.getElementById('location-input-group');

    if (category === 'auto') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>BUDŽET (€)</label>
                    <input type="number" id="mission-budget" class="shark-input" placeholder="25000">
                </div>
                <div class="form-group">
                    <label>KM (MAX)</label>
                    <input type="number" id="mission-km" class="shark-input" placeholder="150000">
                </div>
            </div>
            <div class="form-row">
                 <div class="form-group">
                    <label>GODIŠTE (MIN)</label>
                    <input type="number" id="mission-year" class="shark-input" placeholder="2018">
                </div>
                <div class="form-group">
                    <label>SNAGA (KS)</label>
                    <input type="number" id="mission-ks" class="shark-input" placeholder="150">
                </div>
            </div>
        `;
        countyArea.innerHTML = '';
        locGroup.style.display = 'block';
    } else if (category === 'ostalo') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>BUDŽET (€)</label>
                    <input type="number" id="mission-budget" class="shark-input" placeholder="1000">
                </div>
            </div>
        `;
        countyArea.innerHTML = '';
        locGroup.style.display = 'none';
    } else {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>BUDŽET (€)</label>
                    <input type="number" id="mission-budget" class="shark-input" placeholder="150000">
                </div>
                <div class="form-group">
                    <label>m2 (MIN)</label>
                    <input type="number" id="mission-m2" class="shark-input" placeholder="50">
                </div>
            </div>
        `;
        countyArea.innerHTML = `
            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <label style="margin: 0;">ŽUPANIJE</label>
                    <button type="button" id="btn-select-all-counties" class="chip" style="font-size: 0.6rem; padding: 0.2rem 0.5rem;">Označi sve</button>
                </div>
                <div class="county-grid">
                    ${COUNTIES.map((c, i) => `
                        <div class="county-item">
                            <input type="checkbox" id="county-${i}" value="${c}" class="county-checkbox">
                            <label for="county-${i}">${c}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const btnSelectAll = document.getElementById('btn-select-all-counties');
        if (btnSelectAll) {
            btnSelectAll.onclick = () => {
                const checkboxes = document.querySelectorAll('.county-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !allChecked);
                btnSelectAll.textContent = allChecked ? "Označi sve" : "Odznači sve";
            };
        }
        locGroup.style.display = 'block';
    }
}

async function saveMission(form) {
    const title = document.getElementById('mission-title').value;
    const category = document.getElementById('mission-category').value;
    const budget = document.getElementById('mission-budget').value;
    const location = document.getElementById('mission-location')?.value || "";
    const keyword = document.getElementById('mission-keyword').value;

    const selectedCounties = Array.from(document.querySelectorAll('.county-checkbox:checked')).map(cb => cb.value);

    const newMission = {
        id: "local-" + Date.now(),
        title: title.toUpperCase(),
        category: category,
        status: "LOCAL ACTIVE",
        budget: parseInt(budget) || 0,
        location: location,
        keyword: keyword,
        counties: selectedCounties,
        rating: (Math.random() * 2 + 7.5).toFixed(1),
        lastCheck: "SADA"
    };

    if (category === 'auto') {
        newMission.kmMax = parseInt(document.getElementById('mission-km').value) || 0;
        newMission.yearMin = parseInt(document.getElementById('mission-year').value) || 0;
        newMission.powerKS = parseInt(document.getElementById('mission-ks').value) || 0;
    }

    localMissions.unshift(newMission);
    updateMissionsList();
    modal.classList.add('hidden');
    form.reset();

    // Push to Cloud if enabled
    if (syncUrl) {
        try {
            await fetch(syncUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "addMission", mission: newMission })
            });
            console.log("Local mission pushed to cloud.");
        } catch (err) {
            console.error("Cloud push failed:", err);
        }
    }
}

function renderMissions() {
    const grid = document.getElementById('missions-grid');
    if (!grid) return;
    grid.innerHTML = missions.map(m => `
        <div class="hunt-card ${m.isCloud ? 'cloud-card' : ''}">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2>${m.title}</h2>
                    <span class="status-badge ${m.isCloud ? '' : 'pulse'}">${m.status}</span>
                </div>
                ${!m.isCloud ? `<button style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:1.2rem; padding: 0 5px;" onclick="deleteMission('${m.id}')">×</button>` : ''}
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">BUDŽET</span>
                    <span class="detail-value">${m.budget.toLocaleString()} €</span>
                </div>
                ${m.powerKS ? `<div class="detail-item"><span class="detail-label">SNAGA</span><span class="detail-value">${m.powerKS} KS</span></div>` : ''}
                ${m.yearMin ? `<div class="detail-item"><span class="detail-label">GODIŠTE</span><span class="detail-value">${m.yearMin}+</span></div>` : ''}
                ${m.location ? `<div class="detail-item"><span class="detail-label">LOKACIJA</span><span class="detail-value">${m.location}</span></div>` : ''}
            </div>
            
            <div class="card-tags">
                ${m.isCloud ? '<span class="card-tag" style="background: rgba(46, 204, 113, 0.2); color: #2ecc71;">☁️ Google Sheet Sync</span>' : ''}
                ${m.counties && m.counties.length > 0 ? m.counties.slice(0, 2).map(c => `<span class="card-tag">${c}</span>`).join('') : ''}
                ${m.keyword ? `<span class="card-tag" style="background: rgba(243, 156, 18, 0.1); color: var(--accent-gold);">#${m.keyword}</span>` : ''}
                <span class="card-tag" style="text-transform: uppercase;">${m.category}</span>
            </div>

            <div class="shark-rating">
                <span class="rating-score">${m.rating}</span>
                <div class="rating-bar-container">
                    <div class="rating-bar" style="width: ${m.rating * 10}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

window.deleteMission = (id) => {
    localMissions = localMissions.filter(m => m.id !== id);
    updateMissionsList();
};

function renderPrey() {
    const grid = document.getElementById('prey-grid');
    if (!grid) return;
    const filtered = currentFilter === 'all' ? prey : prey.filter(p => p.category === currentFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-dim);">Nema pronađenog plijena za odabranu kategoriju.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="hunt-card prey-card ${p.isNew ? 'new-hit' : ''}">
            <div class="card-header">
                <h2>${p.title}</h2>
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span class="status-badge" style="background: var(--accent-gold); color: #000; margin-bottom: 5px;">${p.price.toLocaleString()} €</span>
                    <span style="font-size: 0.6rem; color: var(--accent-cyan); font-family: Orbitron; text-transform: uppercase;">${p.category}</span>
                </div>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem; line-height: 1.2; height: 2.4rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.desc}</p>
            <div class="shark-rating">
                <span class="rating-score">${p.rating}</span>
                <div class="rating-bar-container">
                    <div class="rating-bar" style="width: ${p.rating * 10}%"></div>
                </div>
            </div>
            <button class="chip active" style="width: 100%; margin-top: 0.5rem;" onclick="window.open('${p.url}')">OTVORI 🔗</button>
        </div>
    `).join('');
}

function updatePreyCount() {
    if (!preyCountBadge) return;
    const count = prey.filter(p => p.isNew).length;
    preyCountBadge.textContent = count;
    preyCountBadge.style.display = count > 0 ? 'block' : 'none';
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
            const targetView = document.getElementById(`view-${view}`);
            if (targetView) targetView.classList.remove('hidden');

            if (view === 'plijen') {
                prey.forEach(p => p.isNew = false);
                updatePreyCount();
                renderPrey();
            }
        });
    });
}

function initFilters() {
    const chips = document.querySelectorAll('.chip[data-filter]');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            renderPrey();
        });
    });
}

function startRadarSimulation() {
    const hitContainer = document.getElementById('radar-hit-container');
    if (!hitContainer) return;
    setInterval(() => {
        const pulse = document.createElement('div');
        pulse.className = 'radar-pulse';
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 140;
        const x = 160 + Math.cos(angle) * dist;
        const y = 160 + Math.sin(angle) * dist;
        pulse.style.left = `${x}px`;
        pulse.style.top = `${y}px`;
        hitContainer.appendChild(pulse);
        setTimeout(() => pulse.remove(), 2000);
    }, 2500);
}
