# JoinnGo

Aplikacja do zarządzania i dołączania do wydarzeń.

## Pobranie projektu

Aby rozpocząć pracę z projektem, sklonuj repozytorium:

```bash
git clone https://github.com/jakubiwanca/JoinnGo.git
cd JoinnGo
```

---

## Wymagania wstępne (Prerequisites)

Aby uruchomić projekt, upewnij się, że masz zainstalowane:

1.  **Git** - do pobrania repozytorium.
2.  **.NET SDK** (wersja 8.0 lub nowsza) - do uruchomienia backendu.
    - Możesz sprawdzić wersję wpisując: `dotnet --version`
3.  **Node.js** (wersja 16+ lub nowsza) oraz **npm** - do uruchomienia frontendu.
    - Sprawdź: `node -v` oraz `npm -v`
4.  **Docker** (opcjonalnie, ale zalecane) - do łatwego uruchomienia bazy danych PostgreSQL.
    - Alternatywnie: Lokalnie zainstalowany serwer PostgreSQL.

---

## 1. Uruchomienie Bazy Danych (Backend)

Projekt korzysta z bazy danych **PostgreSQL**. Najłatwiej uruchomić ją przez Dockera (w projekcie znajduje się plik `docker-compose.yaml`).

1.  W folderze głównym projektu otwórz terminal.
2.  Uruchom kontener z bazą danych:

    ```bash
    docker-compose up -d db
    ```

    - To uruchomi bazę danych dostępną na porcie `5433` (wg konfiguracji w `docker-compose.yaml` i `JoinnGoApp/appsettings.json`).
    - Domyślne dane (z `appsettings.json`):
      - Host: `localhost`
      - Port: `5433`
      - User: `postgres`
      - Password: `postgres`
      - Database: `JoinnGoDb`

**Uwaga:** Jeśli nie używasz Dockera, musisz zainstalować PostgreSQL, utworzyć bazę `JoinnGoDb` i zaktualizować `ConnectionString` w pliku `JoinnGoApp/appsettings.json`, aby pasował do Twojej lokalnej konfiguracji.

---

## 2. Konfiguracja zmiennych środowiskowych

Przed uruchomieniem backendu musisz skonfigurować zmienne środowiskowe:

1. W folderze głównym projektu utwórz plik `.env`:

   ```bash
   touch .env
   ```

2. Dodaj następującą zawartość (edytuj wartości według potrzeb):

   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=JoinnGoDb
   DB_USERNAME=postgres
   DB_PASSWORD=postgres

   # Email - Brevo SMTP API (zarejestruj się na brevo.com)
   Brevo__ApiKey=TWOJ_KLUCZ_BREVO_API
   Email__SenderEmail=twoj_email@zweryfikowany_w_brevo.com
   Email__SenderName=JoinnGo

   # Frontend URL (dla linków w emailach weryfikacyjnych)
   Frontend__BaseUrl=http://localhost:3000

   # JWT - wygeneruj losowy klucz (min 32 znaki)
   JWT_KEY=TWOJ_LOSOWY_KLUCZ_MIN_32_ZNAKI
   JWT_ISSUER=JoinnGoApp
   JWT_AUDIENCE=JoinnGoAppUsers
   JWT_EXPIRES_MINUTES=60
   ```

   **Jak wygenerować JWT_KEY:**

   ```bash
   # Linux/Mac:
   openssl rand -base64 32

   # Windows PowerShell:
   [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

3. Dla frontendu, utwórz plik `joinngo-front/.env`:

   ```bash
   cd joinngo-front
   touch .env
   ```

   Dodaj:

   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

---

## 3. Uruchomienie Backendu (.NET)

1.  Przejdź do katalogu backendu:
    ```bash
    cd JoinnGoApp
    ```
2.  Przywróć pakiety i zbuduj projekt:
    ```bash
    dotnet restore
    dotnet build
    ```
3.  Zaaplikuj migracje (utworzenie tabel w bazie danych):

    ```bash
    dotnet ef database update
    ```

    - _Jeśli komenda `dotnet ef` nie działa, zainstaluj narzędzie globalnie:_ `dotnet tool install --global dotnet-ef`

4.  Uruchom serwer API:

    ```bash
    dotnet run
    ```

    - Backend domyślnie nasłuchuje na `http://localhost:5000` lub `https://localhost:5001`.

---

## 4. Uruchomienie Frontendu (React)

1.  Otwórz nowe okno terminala i przejdź do katalogu frontendu:
    ```bash
    cd joinngo-front
    ```
2.  Zainstaluj zależności (tylko przy pierwszym uruchomieniu):
    ```bash
    npm install
    ```
3.  Uruchom aplikację deweloperską:

    ```bash
    npm start
    ```

    - Aplikacja otworzy się w przeglądarce pod adresem: `http://localhost:3000`.

## 5. Konto Administratora

Przy pierwszym uruchomieniu aplikacja automatycznie tworzy domyślne konto administratora (jeśli nie istnieje):

- **Email:** `admin@example.com`
- **Hasło:** `admin123`

Zaleca się zmianę hasła po pierwszym zalogowaniu.

---

## 6. Funkcjonalności

### Wydarzenia Cykliczne

- Automatyczna generacja instancji na **2 tygodnie naprzód**
- Background service odświeża wydarzenia **co 24h**
- Brak potrzeby ręcznej konfiguracji

### Obserwowanie Twórców

- Kliknij gwiazdkę ⭐ przy wydarzeniu aby obserwować organizatora
- Wydarzenia od obserwowanych twórców wyświetlają się wyżej na liście

---

## Rozwiązywanie problemów

- **Błąd połączenia z bazą:** Upewnij się, że kontener Dockera działa (`docker ps`) lub że Twoja lokalna baza Postgres jest aktywna i dane w `appsettings.json` są poprawne.
- **Porty zajęte:** Jeśli port 5433, 5000 lub 3000 jest zajęty, musisz zwolnić go lub zmienić konfigurację w plikach `launchSettings.json` (backend) lub `package.json` (frontend).

---

## Wdrożenie produkcyjne

Aby wdrożyć aplikację na serwer produkcyjny (VPS, Cloud), zapoznaj się z szczegółową instrukcją:

**📄 [DEPLOYMENT.md](DEPLOYMENT.md)** - Pełna instrukcja wdrożenia z Docker Compose

Dokumentacja zawiera:

- Konfigurację zmiennych środowiskowych produkcyjnych
- Uruchomienie z Docker Compose
- Backup bazy danych
- Troubleshooting

---
