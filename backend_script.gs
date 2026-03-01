/**
 * SharkHunter Backend v2.5
 * Kopiraj ovaj kod u svoj Google Apps Script editor.
 * Postavi SHEET_ID na ID svoje tablice.
 */

const SHEET_ID = '1w-iMtoqufPtzE6n8UX_aaqNvqcr9rtwFexW7ZkEiXow';

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  if (action === 'getMissions') {
    return createResponse(getSheetData(ss, 'Misije'));
  }
  
  if (action === 'getPrey') {
    return createResponse(getSheetData(ss, 'Baza_Oglasa'));
  }

  // Fallback za stare verzije koje samo šalju GET bez parametara
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
      
      // Dodajemo red u tablicu prema redoslijedu stupaca:
      // naslov, budžet, kategorija, km_max, godište_min, ks, ključna_riječ, lokacija, županije
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
