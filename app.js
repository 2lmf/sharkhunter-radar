// SharkHunter v1.0 Core Logic
let missions = [
    {
        id: Date.now(),
        title: "BMW SERIJA 3",
        category: "auto",
        status: "AKTIVNO",
        budget: "25.000 €",
        primaryVal: "< 150.000 km",
        secondaryVal: "2018+",
        location: "Zagreb + 50km",
        rating: 8.5,
        lastCheck: "2 min"
    }
];

// Elements
const grid = document.getElementById('missions-grid');
const modal = document.getElementById('modal-mission');
const btnAdd = document.getElementById('btn-new-mission');
const btnClose = document.querySelector('.btn-close');
const huntForm = document.getElementById('hunt-form');
const categorySelect = document.getElementById('mission-category');
const dynamicFields = document.getElementById('dynamic-fields');

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Inject Form HTML into Modal
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="retro-title">NOVA <span>MISIJA</span></h2>
            <button class="btn-close">&times;</button>
        </div>
        <form id="hunt-form">
            <div class="form-group">
                <label>KATEGORIJA</label>
                <select id="mission-category" class="shark-select">
                    <option value="auto">Automobili 🚗</option>
                    <option value="nekretnina">Nekretnine 🏠</option>
                    <option value="zemljiste">Zemljišta 🌲</option>
                </select>
            </div>
            <div class="form-group">
                <label>NAZIV (npr. BMW 3, Stan Centar)</label>
                <input type="text" id="mission-title" class="shark-input" required placeholder="Unesi naziv...">
            </div>
            
            <div id="dynamic-fields">
                <!-- Auto Fields Default -->
                <div class="form-row">
                    <div class="form-group">
                        <label>BUDŽET (€)</label>
                        <input type="text" id="mission-budget" class="shark-input" placeholder="npr. 20000">
                    </div>
                    <div class="form-group">
                        <label>KM (MAX)</label>
                        <input type="text" id="mission-km" class="shark-input" placeholder="npr. 100000">
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>LOKACIJA (Grad + km)</label>
                <input type="text" id="mission-location" class="shark-input" placeholder="npr. Zagreb + 50km">
            </div>

            <button type="submit" class="btn-hunt">POKRENI LOV 🦈</button>
        </form>
    `;

    // Re-bind elements after injection
    const closeBtn = document.querySelector('.btn-close');
    const form = document.getElementById('hunt-form');
    const catSelect = document.getElementById('mission-category');
    const dynFields = document.getElementById('dynamic-fields');

    btnAdd.onclick = () => modal.classList.remove('hidden');
    closeBtn.onclick = () => modal.classList.add('hidden');

    catSelect.onchange = (e) => {
        updateDynamicFields(e.target.value, dynFields);
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        saveMission(form);
    };

    renderMissions();
    startRadarSimulation();
});

function updateDynamicFields(category, container) {
    if (category === 'auto') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>BUDŽET (€)</label>
                    <input type="text" id="mission-budget" class="shark-input" placeholder="npr. 20000">
                </div>
                <div class="form-group">
                    <label>KM (MAX)</label>
                    <input type="text" id="mission-km" class="shark-input" placeholder="npr. 100000">
                </div>
            </div>
        `;
    } else if (category === 'nekretnina') {
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>BUDŽET (€)</label>
                    <input type="text" id="mission-budget" class="shark-input" placeholder="npr. 150000">
                </div>
                <div class="form-group">
                    <label>m2 (MIN)</label>
                    <input type="text" id="mission-m2" class="shark-input" placeholder="npr. 50">
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="form-group">
                <label>BUDŽET (€)</label>
                <input type="text" id="mission-budget" class="shark-input" placeholder="npr. 50000">
            </div>
        `;
    }
}

function saveMission(form) {
    const title = document.getElementById('mission-title').value;
    const category = document.getElementById('mission-category').value;
    const budget = document.getElementById('mission-budget').value;
    const location = document.getElementById('mission-location').value;

    let primaryVal = "-";
    let secondaryVal = "-";

    if (category === 'auto') {
        primaryVal = (document.getElementById('mission-km').value || "0") + " km";
    } else if (category === 'nekretnina') {
        primaryVal = (document.getElementById('mission-m2').value || "0") + " m2";
    }

    const newMission = {
        id: Date.now(),
        title: title.toUpperCase(),
        category: category,
        status: "SCANNING",
        budget: budget + " €",
        primaryVal: primaryVal,
        secondaryVal: secondaryVal,
        location: location,
        rating: (Math.random() * 3 + 7).toFixed(1), // Random simulated rating 7-10
        lastCheck: "SADA"
    };

    missions.unshift(newMission);
    renderMissions();
    modal.classList.add('hidden');
    form.reset();
}

function renderMissions() {
    grid.innerHTML = missions.map(m => `
        <div class="hunt-card">
            <div class="card-header">
                <h2>${m.title}</h2>
                <span class="status-badge ${m.status === 'SCANNING' ? 'pulse' : ''}">${m.status}</span>
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">BUDŽET</span>
                    <span class="detail-value">${m.budget}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${m.category === 'auto' ? 'KM (MAX)' : (m.category === 'nekretnina' ? 'm2 (MIN)' : 'OPCIJA')}</span>
                    <span class="detail-value">${m.primaryVal}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">LOKACIJA</span>
                    <span class="detail-value">${m.location}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ZADNJA PROVJERA</span>
                    <span class="detail-value">${m.lastCheck}</span>
                </div>
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

function startRadarSimulation() {
    const hitContainer = document.getElementById('radar-hit-container');
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
    }, 3000);
}

const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});
