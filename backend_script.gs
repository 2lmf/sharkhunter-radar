/**
 * SHARKHUNTER COMPLETE CLOUD SCRIPT v2.5.1 🦈🚀
 * Zadržava tvoj SharkHunter meni,Sidebar i dropdownove + dodaje Sync iz aplikacije.
 */

const SHEET_ID = '1w-iMtoqufPtzE6n8UX_aaqNvqcr9rtwFexW7ZkEiXow';
const WHATSAPP_PHONE = "385953115007";
const WHATSAPP_API_KEY = "6205398";

// ============================================================
// 1. SETUP I MENI (Tvoj originalni dio)
// ============================================================

/**
 * 🦈 SharkHunter onEdit Trigger
 * Omogućuje multi-select u samoj ćeliji (stupac I).
 * Ako odabereš novu županiju, on je dodaje na postojeću (umjesto da je zamijeni).
 */
function onEdit(e) {
  if (!e) return;
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  // Stupac I (9) u tabu s misijama
  if (range.getColumn() === 9 && range.getRow() > 1) {
    const newValue = e.value;
    const oldValue = e.oldValue;
    
    if (!newValue || newValue === "") return;
    
    // Ako se odabere "SVE", očisti sve ostalo
    if (newValue === "SVE") {
      range.setValue("SVE");
      return;
    }
    
    // Ako je prije bilo "SVE", zamijeni ga novom vrijednošću
    if (oldValue === "SVE") {
      range.setValue(newValue);
      return;
    }

    if (oldValue && oldValue !== "") {
      // Spriječimo duplanje iste vrijednosti
      const values = oldValue.split(", ").map(v => v.trim());
      if (values.indexOf(newValue) === -1) {
        range.setValue(oldValue + ", " + newValue);
      } else {
        // Ako je korisnik odabrao nešto što već postoji, ostavi staro (ne dopisuj)
        range.setValue(oldValue);
      }
    }
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🦈 SharkHunter')
    .addItem('Pripremi Tablicu (v2.5)', 'setupSheet')
    .addItem('Odaberi Županije (Sidebar)', 'showCountySidebar')
    .addSeparator()
    .addItem('🚀 POKRENI LOV ODMAH', 'startHunting')
    .addItem('🛠️ DEBUG NJUŠKALO HTML', 'debugNjuskalo')
    .addToUi();
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Misije') || ss.getSheets()[0];
  
  const headers = ["Naslov", "Budžet", "Kategorija", "KM_Max", "Godište_Min", "KS", "Ključna_Riječ", "Lokacija", "Županije"];
  
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (!currentHeaders[0] || currentHeaders[0] === "") {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#00f2ff");
  }
  
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["auto", "nekretnina", "zemljiste", "ostalo"])
    .setAllowInvalid(true)
    .build();
  sheet.getRange("C2:C100").setDataValidation(categoryRule);
  
  const regions = ["SVE", "Austrija", "Beč", "Grad Zagreb", "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka", "Karlovačka", "Varaždinska", "Koprivničko-križevačka", "Bjelovarsko-bilogorska", "Primorsko-goranska", "Ličko-senjska", "Virovitičko-podravska", "Požeško-slavonska", "Brodsko-posavska", "Zadarska", "Osječko-baranjska", "Šibensko-kninska", "Vukovarsko-srijemska", "Splitsko-dalmatinska", "Istarska", "Dubrovačko-neretvanska", "Međimurska"];
  const regionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(regions)
    .setAllowInvalid(true) // OVO MORA BITI TRUE ZA MULTI-SELECT
    .setHelpText("Odaberi jednu ili više županija (nizat će se u ćeliji)")
    .build();
  sheet.getRange("I2:I100").setDataValidation(regionRule);

  // Tab: Baza Oglasa
  let dbSheet = ss.getSheetByName("Baza_Oglasa");
  const dbHeaders = ["ID", "Naslov", "Cijena", "Kategorija", "Opis", "Ocjena", "Link"];
  if (!dbSheet) {
    dbSheet = ss.insertSheet("Baza_Oglasa");
  }
  // Osiguravamo da zaglavlja iz Baze Oglasa UVIJEK budu ispravna, jer inače aplikacija miješa ID i Linkove
  dbSheet.getRange(1, 1, 1, dbHeaders.length).setValues([dbHeaders]);
  dbSheet.getRange("1:1").setFontWeight("bold").setBackground("#f39c12");
  
  SpreadsheetApp.getUi().alert("✅ Tablica je spremna za v2.5!");
}

function showCountySidebar() {
  const html = `<html><body style="font-family:sans-serif;padding:10px;background:#1a1a1a;color:white;">
    <h3>📍 Odabir Županija</h3>
    <button style="background:#444;color:white;width:100%;padding:5px;margin-bottom:10px;" onclick="toggleAll()">Označi / Odznači sve</button>
    <div id="grid" style="height:350px;overflow-y:auto;border:1px solid #333;padding:5px;"></div>
    <button style="background:#00f2ff;color:black;width:100%;padding:10px;font-weight:bold;margin-top:10px;" onclick="apply()">Spremi u ćeliju</button>
    <script>
      const counties = ["Austrija", "Beč", "Grad Zagreb", "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka", "Karlovačka", "Varaždinska", "Koprivničko-križevačka", "Bjelovarsko-bilogorska", "Primorsko-goranska", "Ličko-senjska", "Virovitičko-podravska", "Požeško-slavonska", "Brodsko-posavska", "Zadarska", "Osječko-baranjska", "Šibensko-kninska", "Vukovarsko-srijemska", "Splitsko-dalmatinska", "Istarska", "Dubrovačko-neretvanska", "Međimurska"];
      const grid = document.getElementById('grid');
      counties.forEach(c => { grid.innerHTML += '<div style="margin-bottom:5px"><input type="checkbox" value="'+c+'"> ' + c + '</div>'; });
      function toggleAll() { const cbs = document.querySelectorAll('input'); const allChecked = Array.from(cbs).every(cb => cb.checked); cbs.forEach(cb => cb.checked = !allChecked); }
      function apply() { const selected = Array.from(document.querySelectorAll('input:checked')).map(cb => cb.value); google.script.run.withSuccessHandler(() => google.script.host.close()).processCounties(selected.join(', ')); }
    </script></body></html>`;
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('SharkHunter Multi-Select'));
}

function processCounties(selection) {
  const range = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getActiveCell();
  if (range.getColumn() === 9) range.setValue(selection);
  else SpreadsheetApp.getUi().alert("Stani u stupac 'Županije' (stupac I) prije pokretanja sidebara!");
}

/**
 * DEBUG FUNKCIJA: Prvih 2000 znakova s Njuškala sprema u Bazu da vidimo što zapravo vraća
 */
function debugNjuskalo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('Baza_Oglasa');
  
  const url = "https://www.njuskalo.hr/?ctl=search_ads&keywords=bicikl";
  try {
    const response = UrlFetchApp.fetch(url, { 
      "muteHttpExceptions": true,
      "headers": { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      }
    });
    
    const code = response.getResponseCode();
    let html = response.getContentText().substring(0, 3000); // Prvih 3000 znakova
    
    dbSheet.insertRowBefore(2);
    dbSheet.getRange(2, 1, 1, 7).setValues([[Date.now(), "DEBUG-HTML-KOD-" + code, "0", "debug", html, "---", url]]);
    
    SpreadsheetApp.getUi().alert("Debug završen. Pogledaj redak 2 u Baza_Oglasa. Kod: " + code);
  } catch (e) {
    SpreadsheetApp.getUi().alert("Greška kod spajanja: " + e.toString());
  }
}

function getMissionsFromSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Misije');
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // No data or only headers

  const headers = values[0].map(h => h.toString().toLowerCase().replace(/ /g, '_'));
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function startHunting() {
  const missions = getMissionsFromSheet();
  Logger.log("Pokrećem lov na " + missions.length + " misija...");
  
  missions.forEach(mission => {
    // 1. NJUŠKALO: Traži sve (auti, bicikli, nekretnine...) na domaćem terenu
    huntNjuskalo(mission);

    // 2. AUTOSCOUT24: Samo za aute i samo ako je odabrana Austrija ili Beč
    if (mission.kategorija === 'auto') {
      const zupanije = mission.županije || "";
      if (zupanije.includes("Austrija") || zupanije.includes("Beč")) {
        huntAutoScout24(mission);
      }
    }
  });
}

function isTitleRelevant(title, query) {
  if (!query) return true;
  // Pretvori u mala slova i razdvoji riječi po razmacima (ako korisnik upiše "Vw passat")
  const titleLower = title.toLowerCase();
  const keywords = query.toLowerCase().split(/\s+/);
  
  // Oglas mora sadržavati BAREM JEDNU od ključnih riječi (ili sve, ako želimo biti super strogi)
  // Za početak, tražimo da sadrži glavnu riječ. Zbog "vw passat", bolje provjeriti sve.
  return keywords.every(kw => titleLower.includes(kw));
}

// --- NJUŠKALO LOVAC (Univerzalni za sve) ---
function huntNjuskalo(mission) {
  const query = mission.ključna_riječ || mission.naslov;
  if (!query) return;

  // Koristimo pouzdaniji Njuškalo search URL format
  let url = "https://www.njuskalo.hr/?ctl=search_ads&keywords=" + encodeURIComponent(query);
  if (mission.budžet) url += "&price%5Bmax%5D=" + mission.budžet;
  
  try {
    const response = UrlFetchApp.fetch(url, { 
      "muteHttpExceptions": true,
      "headers": { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      }
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log("Njuškalo zablokirao zahtjev. Kod: " + response.getResponseCode());
      return;
    }

    const html = response.getContentText();
    
    // Njuškalo oglas (standardni format)
    const adRegex = /<h3 class="entity-title">\s*<a.*?href="(.*?)".*?>(.*?)<\/a>/g;
    let match;
    let foundCount = 0;

    while ((match = adRegex.exec(html)) !== null && foundCount < 5) {
      let adUrl = match[1];
      if (!adUrl.startsWith("http")) adUrl = "https://www.njuskalo.hr" + adUrl;
      let adTitle = match[2].replace(/<[^>]*>/g, '').trim(); // Čisti HTML tagove unutar naslova
      
      if (isNewAd(adUrl) && isTitleRelevant(adTitle, query)) {
        foundCount++;
        saveNewAd(adTitle, adUrl, mission.kategorija, "Njuškalo");
        sendWhatsAppNotification(`🦈 NOVI ULOV (Njuškalo)!\n🎯 Misija: ${mission.naslov}\n📦 ${adTitle}\n💰 Budžet: ${mission.budžet}€\n🔗 ${adUrl}`);
      }
    }
    
    // Ako prvi Regex nije ništa našao (Njuškalo je znao mijenjati dizajn u article > a.link)
    if (foundCount === 0) {
      const altRegex = /<article.*?<a class="link" href="(.*?)"\s*title="(.*?)">/g;
      while ((match = altRegex.exec(html)) !== null && foundCount < 5) {
        let adUrl = match[1];
        if (!adUrl.startsWith("http")) adUrl = "https://www.njuskalo.hr" + adUrl;
        let adTitle = match[2].replace(/<[^>]*>/g, '').trim();
        
        if (isNewAd(adUrl) && isTitleRelevant(adTitle, query)) {
          foundCount++;
          saveNewAd(adTitle, adUrl, mission.kategorija, "Njuškalo Alt");
          sendWhatsAppNotification(`🦈 NOVI ULOV (Njuškalo)!\n🎯 Misija: ${mission.naslov}\n📦 ${adTitle}\n💰 Budžet: ${mission.budžet}€\n🔗 ${adUrl}`);
        }
      }
    }
  } catch (e) { Logger.log("Njuškalo Error: " + e.toString()); }
}

// --- AUTOSCOUT24 LOVAC (Samo Austrija/Beč) ---
function huntAutoScout24(mission) {
  let baseUrl = "https://www.autoscout24.at/lst";
  
  if (mission.županije && mission.županije.includes("Beč")) {
    baseUrl += "/wien";
  }
  
  let url = baseUrl + "?sort=age&desc=1&cy=A&powertype=hp";
  const query = mission.naslov || mission.ključna_riječ;
  if (query) url += "&q=" + encodeURIComponent(query);
  if (mission.budžet) url += "&priceto=" + mission.budžet;
  if (mission.godište_min) url += "&fregfrom=" + mission.godište_min;
  
  try {
    const response = UrlFetchApp.fetch(url, { "muteHttpExceptions": true });
    const html = response.getContentText();
    const adRegex = /<a.*?href="(\/offers\/.*?)".*?title="(.*?)">/g;
    let match;
    let foundCount = 0;

    while ((match = adRegex.exec(html)) !== null && foundCount < 5) {
      let adUrl = "https://www.autoscout24.at" + match[1];
      let adTitle = match[2].trim();
      
      if (isNewAd(adUrl) && isTitleRelevant(adTitle, query)) {
        foundCount++;
        saveNewAd(adTitle, adUrl, "auto", "AutoScout24");
        sendWhatsAppNotification(`🦈 NOVI AUTO ULOV (Austrija)!\n🎯 Misija: ${mission.naslov}\n🚗 ${adTitle}\n🔗 ${adUrl}`);
      }
    }
  } catch (e) { Logger.log("AutoScout Error: " + e.toString()); }
}

function isNewAd(adUrl) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const dbSheet = ss.getSheetByName("Baza_Oglasa");
  if (!dbSheet) return true;
  
  const data = dbSheet.getDataRange().getValues();
  // Provjeravamo zadnji stupac (Link)
  return !data.some(row => row[6] === adUrl);
}

function saveNewAd(title, url, category, source) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const dbSheet = ss.getSheetByName("Baza_Oglasa");
  // ID, Naslov, Cijena, Kategorija, Opis, Ocjena, Link
  dbSheet.appendRow([Date.now(), title, "Preuzmi u oglasu", category, "Izvor: " + source, "⭐⭐⭐⭐", url]);
}

// ============================================================
// 2. WEB API (Sinkronizacija s aplikacijom)
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  if (action === 'getMissions') {
    return createResponse(getSheetData(ss, 'Misije'));
  }
  
  if (action === 'getPrey') {
    return createResponse(getSheetData(ss, 'Baza_Oglasa'));
  }

  return createResponse(getSheetData(ss, 'Misije'));
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = SpreadsheetApp.openById(SHEET_ID);

    if (action === 'addMission') {
      const mission = body.mission;
      const sheet = ss.getSheetByName('Misije');
      
      // Naslov, Budžet, Kategorija, KM_Max, Godište_Min, KS, Ključna_Riječ, Lokacija, Županije
      sheet.appendRow([
        mission.title,
        mission.budget,
        mission.category,
        mission.kmMax || 0,
        mission.yearMin || 0,
        mission.powerKS || 0,
        mission.keyword || "",
        mission.location || "",
        Array.isArray(mission.counties) ? mission.counties.join(', ') : ""
      ]);
      
      return createResponse({ status: 'success', message: 'Misija dodana!' });
    }
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

// ============================================================
// 3. POMOĆNE FUNKCIJE
// ============================================================

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0].map(h => h.toString().toLowerCase().replace(/ /g, '_'));
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 4. WHATSAPP & AUTOMATSKI LOV (Ako koristiš skriptu za automatsko scrapanje)
// ============================================================

function sendWhatsAppNotification(message) {
  if (!WHATSAPP_PHONE || !WHATSAPP_API_KEY) return;
  const encodedText = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_PHONE}&text=${encodedText}&apikey=${WHATSAPP_API_KEY}`;
  try { UrlFetchApp.fetch(url, { "muteHttpExceptions": true }); } catch (e) {}
}
