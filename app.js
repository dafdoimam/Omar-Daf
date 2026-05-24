// ===== CONFIGURATION =====
const CONFIG = {
  GOLD_API_KEY: 'goldapi-611b9c43d8d7c80dda9494203f7986a3-io',
  GOLD_API_URL: 'https://www.goldapi.io/api',
  EXCHANGE_API_URL: 'https://api.exchangerate-api.com/v4/latest/USD',
  CRYPTO_API_URL: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin&vs_currencies=usd&include_24hr_change=true',
};

// ===== VARIABLES GLOBALES =====
let usdToXaf = 0;

// ===== CHARGEMENT AUTOMATIQUE AU DÉMARRAGE =====
document.addEventListener('DOMContentLoaded', function() {
  refreshAll();
});

// ===== BOUTON =====
window.refreshAll = async function() {
  const btn = document.getElementById('btnRefresh');
  btn.textContent = '⟳ Chargement...';
  btn.disabled = true;

  try {
    await loadForex();
    await loadMetals();
    await loadCrypto();

    const now = new Date();
    document.getElementById('lastUpdate').textContent =
      `Dernière mise à jour : ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;

  } catch (err) {
    console.error('Erreur générale:', err);
  }

  btn.textContent = '⟳ Actualiser';
  btn.disabled = false;
}

// ===== MÉTAUX =====
async function loadMetals() {
  const tbody = document.getElementById('metalsTable');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Chargement...</td></tr>';

  try {
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
        price: gold.price / 31.1035,
        change: gold.ch,
        changePct: gold.chp
      },
      {
        name: 'Argent',
        sub: 'Silver XAG',
        price: silver.price / 31.1035,
        change: silver.ch,
        changePct: silver.chp
      }
    ];

    tbody.innerHTML = metals.map(m => {
      const xafPrice = usdToXaf > 0
        ? (m.price * usdToXaf).toLocaleString('fr-FR', {maximumFractionDigits: 0})
        : '—';
      const varClass = m.change > 0 ? 'up' : m.change < 0 ? 'down' : 'neutral';
      const varSign = m.change > 0 ? '▲ +' : m.change < 0 ? '▼ ' : '— ';
      return `
        <tr>
          <td>
            <div class="metal-name">${m.name}</div>
            <div class="metal-sub">${m.sub}</div>
          </td>
          <td>$${m.price.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/g</td>
          <td>${xafPrice} XAF/g</td>
          <td class="${varClass}">${varSign}${m.changePct ? Math.abs(m.changePct).toFixed(2) : '0.00'}%</td>
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

// ===== CRYPTO =====
async function loadCrypto() {
  const tbody = document.getElementById('cryptoTable');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Chargement...</td></tr>';

  try {
    const res = await fetch(CONFIG.CRYPTO_API_URL);
    const data = await res.json();

    const cryptos = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
      { id: 'tether', name: 'Tether', symbol: 'USDT', icon: '₮' },
      { id: 'binancecoin', name: 'BNB', symbol: 'BNB', icon: '◈' },
    ];

    tbody.innerHTML = cryptos.map(c => {
      const price = data[c.id]?.usd || 0;
      const change = data[c.id]?.usd_24h_change || 0;
      const xafPrice = usdToXaf > 0
        ? (price * usdToXaf).toLocaleString('fr-FR', {maximumFractionDigits: 0})
        : '—';
      const varClass = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const varSign = change > 0 ? '▲ +' : change < 0 ? '▼ ' : '— ';
      return `
        <tr>
          <td>
            <div class="metal-name">${c.icon} ${c.name}</div>
            <div class="metal-sub">${c.symbol}</div>
          </td>
          <td>$${price.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td>${xafPrice} XAF</td>
          <td class="${varClass}">${varSign}${Math.abs(change).toFixed(2)}%</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="error">Erreur chargement crypto</td></tr>';
    console.error('Erreur crypto:', err);
  }
}