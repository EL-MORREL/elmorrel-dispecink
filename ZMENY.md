# Rozšíření plánovače – 10. září 2026

Pracovní kopie vychází z fungující integrace. Ostrý Supabase projekt ani původní data nebyly změněny. Databázové migrace 005–011 dosud vyžadují spuštění v projektu **planovac test**. Nový web nahrávejte až po úspěšné migraci.

## Co je zapojeno

- Příchod a odchod aktuálním časem, převzetí ověřeného času kolegy ze stejné zakázky bez schvalování, odložení upozornění „Ještě jsem nepřišel / Ještě pracuji“. Vlastní zpětný čas se řeší žádostí.
- Žádosti o opravu docházky, schválení s úpravou časů nebo zamítnutí. Zachování původního záznamu, odmítnutí překryvu a změněné docházky.
- Plánování období pro více pracovníků a vozidel, vynechání víkendů a českých svátků, kontrola kolizí. Úprava hodin/začátku celé série nebo jednoho přiřazení; zrušení plánu bez docházky.
- Přetažení přesouvá, Ctrl + přetažení kopíruje přiřazení pracovníka. Mobilní tlačítko Kopírovat. Docházka se nekopíruje; vozidla jsou samostatná.
- Poznámky zakázky ke konkrétnímu dni a samostatné poznámky pracovníka ke dni.
- Volno a žádosti o volno, vlastní aktivní/neaktivní typy s barvou, schvalováním a pravidlem blokování plánu. Hodinový rozsah, pracovní rozvrh, nárok/čerpání/zůstatek dovolené, počet pracovních dní. Excelový export volna.
- Brigádník, aktivace a období dostupnosti, zachování historických přiřazení. Uložení pořadí pracovníků.
- Vedoucí realizace vidí tým na společných zakázkách. Soukromé karty a důvody nepřítomnosti ostatních nedostává. Administrátor může měnit oprávnění propojených účtů.
- Nová zakázka při příchodu s označením ke kontrole, návrhy existujících názvů; sloučení duplicit s uchováním historie a kontrolou kolizí.
- Fakturace vybraných dní nebo celé zakázky, archiv, uzamčení hodin, odemknutí s důvodem. Filtr vyfakturovaných a nevyfakturovaných hodin ve výkazech a exportu.
- Výřez loga posunem a přiblížením, zaoblený náhled, favicon a manifest mobilní aplikace. Mobilní systém si může starou ikonu ponechat do opětovné instalace zástupce.
- Serverová fronta e-mailů pro změny plánu a chybějící příchod/odchod, nastavitelná prodleva a příjemci. Funkce pro odesílání přes Resend, omezené opakování bez duplicit.

## Co vyžaduje nastavení mimo web

Automatické e-maily se nerozběhnou samotným nahráním webu. Je nutné nasadit `planner-notifications`, nastavit ověřeného odesílatele a klíč služby a pravidelné volání v Supabase Cron. Návod je u této funkce. Žádné skutečné notifikace nebyly při ověřování odeslány.

Pozvánková funkce zůstává `dynamic-handler`. Pro novou roli vedoucího stačí tato databázová aktualizace; funkci není nutné přejmenovávat.

## Ověření a hranice

Automatické testy běží nad samostatnou PostgreSQL databází PGlite a v prohlížeči Edge s touto databází. Pokrývají oprávnění, více firem, opravy, fakturační zámky, sdílené časy, absence a svátky, brigádníky, sloučení i ovládání a výřez loga na webu.

Částečné volno s časem od–do blokuje pouze daný úsek; bez času blokuje celý den. Změna délky směny může ovlivnit přepočet historických hodin volna na dny; hodinové záznamy zůstávají zachované. Úprava série mění začátek a hodiny; přesun termínů se provádí na konkrétních přiřazeních.

Tato aktualizace nezavádí placení předplatného ani ukládání PINů tankovacích karet.

24. 9. 2026 — dispatcher-access-1: sjednocena provozní oprávnění dispečera pro úpravy a mazání docházky/tankování, odebrání přiřazení na desktopu i mobilu a provozní nastavení. Finanční a účtová oprávnění zůstávají oddělená. Migrace 048, testy databáze i rozhraní prošly.

25. 9. 2026 — planner-position-1: plánovač zachovává období, zobrazení a posunutí po uložení i dalším otevření ve stejném prohlížeči; samostatná paměť uživatele a firmy, desktopu a mobilu.

25. 9. 2026 — readable-history-1: skutečné role pracovníků v desktopovém a mobilním plánovači; historie s českými popisy, autorem a hodnotami před/po místo technického výpisu. Migrace 049.

25. 9. 2026 — absence-cancel-1: návrat Tento týden na desktopu; Zrušit volno přímo v plánu a přehledu, zachování historie a správné vrácení hodin dovolené. Migrace 050.

30. 9. 2026: Modul Režijní náklady, pravidelné předpisy a jednorázové náklady, měsíční rozpočítání do zakázek; pouze administrátor.
