# Nové rozhraní podle schváleného vizuálu

Pracovní interaktivní prototyp, nikoli nasazený SaaS. Běží místně na http://127.0.0.1:8767 po spuštění `node serve.cjs`. Nepoužívá Supabase, síťová připojení blokuje CSP. Ukázkový den je 10. září 2026. Změny se ukládají pouze do localStorage tohoto prohlížeče pod klíčem planner-design-v3. Tlačítko Obnovit ukázku obnoví vymyšlená data. Nedávat do něj skutečné pracovní údaje ani PINy.

## Co lze zkoušet

- Týdenní tabulka pracovníků a vozidel, pět nebo sedm dní, posun týdnů.
- Barevné zakázky, více dokumentových odkazů s kontrolou protokolu, přiřazování více vozidel.
- Příchod, odchod s přestávkou a změna zakázky. Nové přiřazení z docházky doplní plán, plánované hodiny se zachovají a skutečné se vypočítají samostatně.
- Upozornění na nezaznamenaný příchod po toleranci a rozdílné dokončené hodiny pracovníků. Označení rozdílu za zkontrolovaný.
- Oprava docházky s důvodem a uložením předchozí hodnoty v místní historii.
- Tankování s automatickým pracovníkem a číslem karty uloženým jako snapshot.
- Výkaz hodin filtrovaný podle měsíce, pracovníka nebo zakázky a skutečný XLSX export s číselnými hodinami, datumovým typem, filtrem a ukotveným záhlavím. Export tankování.
- Nastavení názvu a rastrového loga, odborností se stabilními ID a aktivitou, délky dne a tolerance.
- Přepínač ukázkových rolí Dispečer / Realizace / Administrátor; mobilní pohled Můj den.

## Co to ještě není

Přepínač rolí simuluje UI, nevytváří zabezpečení. Data zůstávají v prohlížeči. SQL pod ../database zavádí oddělený serverový základ, ale tato aplikace jej ještě nevolá. Tato verze není vhodná k nahrazení nynějšího testovacího či ostrého plánovače.

Před dalším nasazením zbývá zejména:

- Napojení skutečného Auth, členství firem a všech operací na server; bezpečné založení firmy, správa a párování účtů.
- Převod všech vazeb a úplné zachování dalších dosavadních funkcí na serveru. Samostatné hodiny vozidel už fungují v místním prototypu; produkční migrační cesta zatím není připravená.
- Serverové ukládání dokumentů, profilů, odborností pracovníků, historie oprav a časových kontrol. Přes půlnoc je nutné výkaz rozdělit na jednotlivé dny/měsíce; zde se úsek přiřazuje dni příchodu.
- Uzamčení fakturovaných záznamů a schválených měsíců. Tato ochrana se v prototypu nesimuluje jako hotová.
- E-mailový outbox, poskytovatel doručování, plánované připomínky a potvrzování změn plánu.
- Šifrované PINy přístupné vlastnímu pracovníkovi a dispečerovi, audit odhalení bez obsahu PINu. Pole PIN zde záměrně není.
- Firemní rozšířené údaje tankování, filtrování/export za období a účtenky.
- Fakturační předplatné a pravidla přístupu při jeho skončení.

## Ověření

5 doménových testů docházky, reportů a bezpečných odkazů, prohlížečový průchod desktopem/mobilem v Edge; vytvořený XLSX otevřen jako ZIP a všechny XML části zvalidované pomocí .NET. Živý Supabase ani skutečný Excel nebyly tímto testem použity.

Samostatné PGlite testy ../tests/settings.cjs a ../tests/attendance.cjs ověřují RLS, serverové role, odmítnutí mezifiremních vazeb a exportu pracovníkem, atomickou změnu zakázky, unikátní otevřenou docházku a uchování čísla karty při výměně. Nejsou náhradou testu nasazeného Supabase.

## Doplnění plánování

Celkový odhad zakázky (člověkohodiny), součty plánu/skutečnosti a upozornění na překročení. Prázdný odhad znamená nestanovený, nula je platný odhad. Přetahování pracovníků mezi dny a řádky; již zaznamenaná docházka blokuje přesun přiřazení. Přesun pracovníka nepřesouvá auta. Auta mají samostatné rezervace podle zakázky, dne a vozidla, hodiny se nenásobí počtem pracovníků. Přetahování auta přesouvá pouze tuto rezervaci, stejné auto na dalších zakázkách zůstává. Duplicitní cílová rezervace se neslučuje automaticky. Na mobilu slouží formulář přiřazení jako alternativa přetažení.

Ověřeno 11 doménovými testy a samostatným browser testem planning.cjs včetně drag-and-drop a obnovení stránky.
