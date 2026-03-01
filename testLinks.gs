function checkBazaOglasaLinks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dbSheet = ss.getSheetByName('Baza_Oglasa');
  const values = dbSheet.getDataRange().getValues();
  
  // Dohvati samo zadnjih par unosa
  const lastEntries = values.slice(-3);
  let msg = "Zadnji unosi:\n";
  lastEntries.forEach(row => {
    msg += `Naslov: ${row[1]} | Link: ${row[6]}\n`;
  });
  
  SpreadsheetApp.getUi().alert(msg);
}
