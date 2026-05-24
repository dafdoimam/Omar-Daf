// ===== CONFIGURATION =====
const CONFIG = {
  GOLD_API_KEY: 'goldapi-611b9c43d8d7c80dda9494203f7986a3-io',
  GOLD_API_URL: 'https://www.goldapi.io/api',
  EXCHANGE_API_URL: 'https://api.exchangerate-api.com/v4/latest/USD',
  CRYPTO_API_URL: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin&vs_currencies=usd&include_24hr_change=true',
};

// ===== VARIABLES GLOBALES =====
let usdToXaf = 0;

// ===== FONCTION PRINCIPALE =====
async function refreshAll() {
  const btn = document.getElementById('btnRefresh');
  btn.textContent = '⟳ Chargement...';
  btn.disabled = true;

  try {
    // 1. Récupérer le taux USD/XAF en premier
    await loadForex();
    // 2. Ensuite les métaux (besoin du taux XAF)
    await loadMetals();
    // 3. Ensuite les cryptos
    await loadCrypto();

    // Mettre à jour l'heure
    const now = new Date();
    document.getElementById('lastUpdate').textContent =
      `Dernière mise à jour : ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;

  } catch (err) {
    console.error('Erreur générale:', err);
  }

  btn.textContent = '⟳ Actualiser';
  btn.disabled = false;
}

// ===== MÉTAUX PRÉCIEUX =====
async function loadMetals() {
  const tbody = document.getElementById('metalsTable');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Chargement...</td></tr>';

  try {
    // Récupérer Or et Argent
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

    const metals = [
      {
        name: 'Or',
        sub: 'Gold XAU',
        price: gold.price,
        change: gold.ch,
        changePct: gold.chp
      },
      {
        name: 'Argent',
        sub: 'Silver XAG',
        price: silver.price,
        change: silver.ch,
        changePct: silver.chp
      }
    ];

    tbody.innerHTML = metals.map(m => {
      const xafPrice = usdToXaf > 0 ? (m.price * usdToXaf).toLocaleString('fr-FR', {maximumFractionDigits: 0}) : '—';
      const varClass = m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'neutral';
      const varSign = m.change > 0 ? '+' : '';
      return `
        <tr>
          <td>
            <div class="metal-name">${m.name}</div>
            <div class="metal-sub">${m.sub}</div>
          </td>
          <td>$${m.price.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td>${xafPrice} XAF</td>
          <td class="${varClass}">${varSign}${m.changePct ? m.changePct.toFixed(2) : '0.00'}%</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="error">Erreur chargement métaux</td></tr>';
    console.error('Erreur métaux:', err);
  }
}

// ===== DEVISES =====
async function loadForex() {
  const tbody = document.getElementById('forexTable');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Chargement...</td></tr>';

  try {
    const res = await fetch(CONFIG.EXCHANGE_API_URL);
    const data = await res.json();

    // Sauvegarder le taux USD/XAF pour les conversions
    usdToXaf = data.rates.XAF;

    const devises = [
      { code: 'USD', name: 'Dollar US', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
      { code: 'GBP', name: 'Livre Sterling', flag: '🇬🇧' },
      { code: 'SAR', name: 'Riyal Saoudien', flag: '🇸🇦' },
      { code: 'AED', name: 'Dirham EAU', flag: '🇦🇪' },
      { code: 'KWD', name: 'Dinar Koweïtien', flag: '🇰🇼' },
      { code: 'QAR', name: 'Riyal Qatari', flag: '🇶🇦' },
      { code: 'OMR', name: 'Rial Omanais', flag: '🇴🇲' },
    ];

    tbody.innerHTML = devises.map(d => {
      const rate = data.rates[d.code];
      // Convertir : 1 unité de devise = combien de XAF
      const xafRate = usdToXaf / rate;
      return `
        <tr>
          <td>
            <div class="metal-name">${d.flag} ${d.code}</div>
            <div class="metal-sub">${d.name}</div>
          </td>
          <td>1 ${d.code}</td>
          <td>${xafRate.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} XAF</td>
          <td class="neutral">—</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="error">Erreur chargement devises</td></tr>';
    console.error('Erreur devises:', err);
  }
}

// ===== CRYPTOMONNAIES =====
async function loadCrypto() {
  const tbody = document.getElementById('cryptoTable');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Chargement...</td></tr>';

  try {
    const res = await fetch(CONFIG.CRYPTO_API_URL);
    const data = await res.json();

    const cryptos = [