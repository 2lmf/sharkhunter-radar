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

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🦈 SharkHunter')
    .addItem('Pripremi Tablicu (v2.5)', 'setupSheet')
    .addItem('Odaberi Županije', 'showCountySidebar')
    .addToUi();
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tab: Misije
  let sheet = ss.getSheetByName('Misije') || ss.getSheets()[0];
  if (sheet.getName() !== 'Misije') sheet.setName('Misije');
  
  const headers = ["Naslov", "Budžet", "Kategorija", "KM_Max", "Godište_Min", "KS", "Ključna_Riječ", "Lokacija", "Županije"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#00f2ff");
  
  // Validacija Kategorije (Dodano "ostalo")
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["auto", "nekretnina", "zemljiste", "ostalo"])
    .build();
  sheet.getRange("C2:C100").setDataValidation(categoryRule);
  
  // Validacija Županija (Pojedinačni odabir za ćeliju, Sidebar služi za Multi)
  const regions = ["Austrija", "Beč", "Grad Zagreb", "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka", "Karlovačka", "Varaždinska", "Koprivničko-križevačka", "Bjelovarsko-bilogorska", "Primorsko-goranska", "Ličko-senjska", "Virovitičko-podravska", "Požeško-slavonska", "Brodsko-posavska", "Zadarska", "Osječko-baranjska", "Šibensko-kninska", "Vukovarsko-srijemska", "Splitsko-dalmatinska", "Istarska", "Dubrovačko-neretvanska", "Međimurska"];
  const regionRule = SpreadsheetApp.newDataValidation().requireValueInList(regions).build();
  sheet.getRange("I2:I100").setDataValidation(regionRule);

  // Tab: Baza Oglasa
  let dbSheet = ss.getSheetByName("Baza_Oglasa");
  if (!dbSheet) {
    dbSheet = ss.insertSheet("Baza_Oglasa");
    dbSheet.appendRow(["ID", "Naslov", "Cijena", "Kategorija", "Opis", "Ocjena", "Link"]);
    dbSheet.getRange("1:1").setFontWeight("bold").setBackground("#f39c12");
  }
  
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
