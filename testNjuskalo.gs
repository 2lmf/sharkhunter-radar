function testNjuskalo() {
  const query = "bicikl";
  const budzet = 2000;
  
  let url = "https://www.njuskalo.hr/?ctl=search_ads&keywords=" + encodeURIComponent(query);
  if (budzet) url += "&price%5Bmax%5D=" + budzet;
  
  try {
    const response = UrlFetchApp.fetch(url, { 
      "muteHttpExceptions": true,
      "headers": { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "hr,en-US;q=0.7,en;q=0.3"
      }
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log("Njuškalo Error Code: " + response.getResponseCode());
      return;
    }
    
    const html = response.getContentText();
    
    // Njuškalo obično drži naslov unutar <h3 class="entity-title"> pa unutra <a>
    // Ali zna imati i <a class="link" ...> unutar <article>
    // Ajmo na najširi match za linkove koji vode na oglas
    const adRegex = /<h3 class="entity-title">\s*<a.*?href="(.*?)".*?>(.*?)<\/a>/g;
    let match;
    let count = 0;
    while ((match = adRegex.exec(html)) !== null && count < 5) {
      let adUrl = match[1];
      if (!adUrl.startsWith("http")) adUrl = "https://www.njuskalo.hr" + adUrl;
      let adTitle = match[2].replace(/<[^>]*>/g, '').trim();
      Logger.log("Našao: " + adTitle + " -> " + adUrl);
      count++;
    }
    
    if (count === 0) {
       Logger.log("Nije našao oglase s prvim regexom. Pokušavam alternativni...");
       const altRegex = /<a class="link" href="(.*?)"\s*title="(.*?)">/g;
       while ((match = altRegex.exec(html)) !== null && count < 5) {
          let adUrl = match[1];
          if (!adUrl.startsWith("http")) adUrl = "https://www.njuskalo.hr" + adUrl;
          let adTitle = match[2].replace(/<[^>]*>/g, '').trim();
          Logger.log("Našao (alt): " + adTitle + " -> " + adUrl);
          count++;
       }
    }
    
  } catch (e) {
    Logger.log("Test Njuškalo Greška: " + e.toString());
  }
}
