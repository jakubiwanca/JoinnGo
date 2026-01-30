# JoinnGo

Aplikacja do zarządzania i dołączania do wydarzeń.

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

## 2. Uruchomienie Backendu (.NET)

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

## 3. Uruchomienie Frontendu (React)

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

    ## Konto Administratora

Przy pierwszym uruchomieniu aplikacja automatycznie tworzy domyślne konto administratora (jeśli nie istnieje):

- **Email:** `admin@example.com`
- **Hasło:** `admin123`

Zaleca się zmianę hasła po pierwszym zalogowaniu.

---

## Rozwiązywanie problemów

- **Błąd połączenia z bazą:** Upewnij się, że kontener Dockera działa (`docker ps`) lub że Twoja lokalna baza Postgres jest aktywna i dane w `appsettings.json` są poprawne.
- **Porty zajęte:** Jeśli port 5433, 5000 lub 3000 jest zajęty, musisz zwolnić go lub zmienić konfigurację w plikach `launchSettings.json` (backend) lub `package.json` (frontend).

---
