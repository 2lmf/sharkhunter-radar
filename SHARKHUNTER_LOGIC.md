# 🦈 SHARKHUNTER: LOGIKA RADA (v2.4)

SharkHunter je sustav za automatsko praćenje oglasnika koji se sastoji od tri glavne komponente koje rade u sinkronizaciji.

## 1. Google Tablica (Mozak i Baza)
- **Sheet1 (Misije)**: Ovdje se upisuju parametri pretrage (Naslov, Budžet, Županije...).
- **Baza_Oglasa**: Ovdje robot sprema sve oglase koje je već vidio kako ti ne bi slao istu stvar dva puta.
- **Google Apps Script**: Srce sustava. On vrti "Trigger" (mjerač vremena) koji svako malo pokreće potragu.

## 2. Robotski Lovac (Scraper Logic)
- Robot u pozadini simulira posjetu oglasnicima (Autoscout24, Njuškalo).
- Provjerava tvoje uvjete iz tablice.
- **WhatsApp Notifikacije**: Čim robot nađe nešto novo što se ne nalazi u "Bazi_Oglasa", odmah šalje poruku preko CallMeBot API-ja na tvoj mobitel.

## 3. Web Aplikacija (Radar UI)
- Vizualni pregled aktivnih misija iz tablice.
- **Radar**: Trenutno vizualna simulacija kretanja.
- **Plijen**: Tab koji treba prikazivati konkretne linkove i podatke koji su spremljeni u "Bazi_Oglasa".
- **Lokalni Lov**: Mogućnost brzog dodavanja privremenih misija izravno na mobitelu.

---

## 🛠️ ŠTO TRENUTNO POPRAVLJAMO (v2.5)

1. **Realni Plijen**: Prebacivanje aplikacije s "lažnih" simuliranih ulova na prikazivanje stvarnih redaka iz tvoje tablice "Baza_Oglasa". Klik na "Otvori" će voditi na točan link oglasa.
2. **Kategorija "Ostalo"**: Dodavanje opće pretrage za stvari koje nisu auti ili nekretnine (koristeći Njuškalo pretragu po nazivu).
3. **Puna Sinkronizacija**: Kada u aplikaciji stisneš "Pokreni Lov", podaci moraju automatski otići u Google Tablicu (trenutno idu samo u memoriju mobitela).
4. **PWA Instalacija**: Fix za ikonu i manifest kako bi ti se pojavio gumb "Instaliraj na početni zaslon".
