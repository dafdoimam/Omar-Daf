// ===== CONFIGURATION =====
const CONFIG = {
  GOLD_API_KEY: 'goldapi-611b9c43d8d7c80dda9494203f7986a3-io',
  GOLD_API_URL: 'https://www.goldapi.io/api',
  EXCHANGE_API_URL: 'https://api.exchangerate-api.com/v4/latest/USD',
};

// ===== VARIABLES GLOBALES =====
let usdToXaf = 0;
let goldPricePerGram = 0;
let silverPricePerGram = 0;
let selectedCarat = 0.999;
let goldChange = 0;
let goldChangePct = 0;
let silverChange = 0;
let silverChangePct = 0;

// ===== PURETÉS OR =====
const PURITES_OR = [
  { label: '24 carats (999)', facteur: 0.999 },
  { label: '22 carats (916)', facteur: 0.916 },
  { label: '18 carats (750)', facteur: 0.750 },
  { label: '14 carats (585)', facteur: 0.585 },
];

// ===== PURETÉS ARGENT =====
const PURITES_ARGENT = [
  { label: 'Argent pur (999)', facteur: 0.999 },
  { label: 'Argent 925', facteur: 0.925 },
];

// ===== CHARGEMENT AUTOMATIQUE AU DÉMARRAGE =====
document.addEventListener('DOMContentLoaded', function() {
  refreshPurete();
});

// ===== BOUTON ACTUALISER =====
window.refreshPurete = async function() {
  const btn = document.getElementById('btnRefresh');
  btn.textContent = '⟳ Chargement...';
  btn.disabled = true;

  try {
    await loadRates();
    displayPurete();
    displayArgent();

    const now = new Date();
    document.getElementById('lastUpdate').textContent =
      `Dernière mise à jour : ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;

  } catch (err) {
    console.error('Erreur générale:', err);
  }

  btn.textContent = '⟳ Actualiser';
  btn.disabled = false;
}

// ===== CHARGER LES TAUX =====
async function loadRates() {
  const resEx = await fetch(CONFIG.EXCHANGE_API_URL);
  const dataEx = await resEx.json();
  usdToXaf = dataEx.rates.XAF;

  const [goldRes, silverRes] = await Promise.all([
    fetch(`${CONFIG.GOLD_API_URL}/XAU`, {
      headers: { 'x-access-token': CONFIG.GOLD_API_KEY }
    }),
    fetch(`${CONFIG.GOLD_API_URL}/XAG`, {
      headers: { 'x-access-token': CONFIG.GOLD_API_KEY }
    })
  ]);

  const gold = await goldRes.json();
  const silver = await silverRes.json();

  goldPricePerGram = gold.price / 31.1035;
  goldChange = gold.ch;
  goldChangePct = gold.chp;
  silverPricePerGram = silver.price / 31.1035;
  silverChange = silver.ch;
  silverChangePct = silver.chp;
}

// ===== AFFICHER TABLEAU OR =====
function displayPurete() {
  const tbody = document.getElementById('pureteTable');

  if (goldPricePerGram === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="error">Erreur chargement</td></tr>';
    return;
  }

  tbody.innerHTML = PURITES_OR.map(p => {
    const prixUSD = goldPricePerGram * p.facteur;
    const prixXAF = prixUSD * usdToXaf;
    const varClass = goldChange > 0 ? 'up' : goldChange < 0 ? 'down' : 'neutral';
    const varSign = goldChange > 0 ? '▲ +' : goldChange < 0 ? '▼ ' : '— ';
    return `
      <tr>
        <td><div class="metal-name">${p.label}</div></td>
        <td>$${prixUSD.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>${prixXAF.toLocaleString('fr-FR', {maximumFractionDigits: 0})} XAF</td>
        <td class="${varClass}">${varSign}${Math.abs(goldChangePct).toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
}

// ===== AFFICHER TABLEAU ARGENT =====
function displayArgent() {
  const tbody = document.getElementById('argentTable');

  if (silverPricePerGram === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="error">Erreur chargement</td></tr>';
    return;
  }

  tbody.innerHTML = PURITES_ARGENT.map(p => {
    const prixUSD = silverPricePerGram * p.facteur;
    const prixXAF = prixUSD * usdToXaf;
    const varClass = silverChange > 0 ? 'up' : silverChange < 0 ? 'down' : 'neutral';
    const varSign = silverChange > 0 ? '▲ +' : silverChange < 0 ? '▼ ' : '— ';
    return `
      <tr>
        <td><div class="metal-name">${p.label}</div></td>
        <td>$${prixUSD.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>${prixXAF.toLocaleString('fr-FR', {maximumFractionDigits: 0})} XAF</td>
        <td class="${varClass}">${varSign}${Math.abs(silverChangePct).toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
}

// ===== SÉLECTION CARAT =====
window.selectCarat = function(btn, valeur) {
  document.querySelectorAll('.carat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCarat = valeur;
  document.getElementById('calcResult').classList.add('hidden');
}

// ===== CALCULATRICE =====
window.calculate = function() {
  const gramsInput = document.getElementById('gramsInput');
  const grams = parseFloat(gramsInput.value);

  if (!grams || grams <= 0) {
    gramsInput.style.border = '2px solid #dc2626';
    return;
  }

  gramsInput.style.border = '2px solid #16a34a';

  if (goldPricePerGram === 0) {
    alert('Veuillez actualiser les prix d\'abord !');
    return;
  }

  const prixUSD = goldPricePerGram * selectedCarat * grams;
  const prixXAF = prixUSD * usdToXaf;
  const caratLabel = PURITES_OR.find(p => p.facteur === selectedCarat)?.label || '';

  document.getElementById('resultUSD').textContent =
    `$${prixUSD.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById('resultXAF').textContent =
    `${prixXAF.toLocaleString('fr-FR', {maximumFractionDigits: 0})} FCFA`;

  document.getElementById('resultDetail').textContent =
    `${grams}g × ${caratLabel} × $${goldPricePerGram.toFixed(2)}/g`;

  document.getElementById('calcResult').classList.remove('hidden');
}