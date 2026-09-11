# Integrace s testovacím Supabase

Připojení je pevně omezené na projekt fesvutrdfduoyqljxsuz. Žádný service role klíč ani databázové heslo není ve frontendových souborech. Přístup bez přihlášení neukáže plán. Role se načítá z členství na serveru a v UI se nepřepíná. localStorage s ukázkovými daty se nepoužívá; SDK si standardně spravuje přihlašovací relaci.

## První instalace

Soubor ../database/TEST-INTEGRACE.sql je určen jen pro existující testovací projekt. V jedné transakci vytvoří nové saas_* tabulky, RLS a RPC. Kontroluje přítomnost dříve vytvořeného testovacího účtu 97f511a5-89e4-4720-a338-4dbfc26119e2 a odmítne opakovanou instalaci. Původní jobs/workers/assignments ani ostatní staré tabulky se nemění. Pro tento účet založí firmu EL-MORREL TEST, majitelské členství, spárovaného pracovníka a tři odbornosti. Zakázky a vozidla začínají prázdné. Původní data se automaticky neimportují.

Po instalaci spusťte serve.cjs a otevřete http://127.0.0.1:8768. Použijte existující testovací přihlášení. Soubor se musí spustit jen jednou; následné změny budou další migrace.

## Připojené části

- Přihlášení a odhlášení, vyčištění dat, serverové členství, periodické obnovení dat mimo otevřený formulář.
- Verzionované atomické změny zakázek, odhadů, pracovníků, vozidel, odborností, nastavení a přiřazení aut s vlastními hodinami.
- Příchod/odchod/přechod zakázky přes serverové RPC; čas určuje server, nevkládá se ručně.
- Tankování se serverovým pracovníkem a snapshotem jeho karty.
- Načtení hodin pro export je kontrolované serverovým oprávněním. UI používá aktuální načtený snapshot pro sestavení XLSX.

## Omezení této etapy

Dosud nebylo spuštěno na živém Supabase. Testy běžely na místním PGlite a s nahrazeným API v Edge. Ověření přihlášení skutečným testovacím uživatelem vyžaduje instalaci SQL a uživatelské přihlášení.

Role ve formuláři pracovníka je nyní zakázaná; párování dalších účtů a správa rolí musí získat vlastní administrátorskou serverovou operaci. Výběr více firem při více členstvích ještě není hotový (přihlášení v takovém případě skončí jasnou chybou). Opravy docházky a potvrzení rozdílů nejsou připojené a UI je odmítne zprávou. Tato verze ještě neobsahuje fakturované uzamčení, rozdělení směny přes půlnoc, PINy, SMTP/outbox, přílohy tankování ani předplatné. Nejde o hotový produkční SaaS.

Nenasazovat místo ostrého plánovače. Návrat testovacího webu na předchozí verzi nepotřebuje mazání těchto tabulek: stará aplikace používá původní oddělené tabulky.
