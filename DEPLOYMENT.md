# Wdrożenie aplikacji JoinnGo - Instrukcja

## Wymagania

- Docker Desktop (lub Docker Engine + Docker Compose)
- Git

## Krok 1: Przygotowanie środowiska

### 1.1 Sklonuj repozytorium

```bash
git clone https://github.com/jakubiwanca/JoinnGo.git
cd JoinnGo
```

### 1.2 Przełącz się na branch main (produkcja)

```bash
git checkout main
git pull
```

## Krok 2: Konfiguracja zmiennych środowiskowych

### 2.1 Backend - utwórz plik .env

W katalogu głównym projektu utwórz plik `.env` i uzupełnij:

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=JoinnGoDb
DB_USERNAME=postgres
DB_PASSWORD=TWOJE_SILNE_HASLO

# Email - Brevo API
Brevo__ApiKey=TWOJ_KLUCZ_BREVO_API  # Zarejestruj się na brevo.com
Email__SenderEmail=twoj_email@zweryfikowany_w_brevo.com
Email__SenderName=JoinnGo

# Frontend (dla linków w emailach)
Frontend__BaseUrl=https://twoja-domena.com

# JWT
JWT_KEY=WYGENERUJ_LOSOWY_KLUCZ_MIN_32_ZNAKI
JWT_ISSUER=JoinnGoApp
JWT_AUDIENCE=JoinnGoAppUsers
JWT_EXPIRES_MINUTES=60
```

**Jak wygenerować JWT_KEY:**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2.2 Frontend - utwórz plik .env.production

W katalogu `joinngo-front` utwórz plik `.env.production`:

```bash
REACT_APP_API_URL=https://twoja-domena-backendu.com
```

**Uwaga:** Dla lokalnego developmentu Frontend używa `REACT_APP_API_URL=http://localhost:5000` (można ustawić w pliku `joinngo-front/.env`).

## Krok 3: Uruchomienie aplikacji

### 3.1 Zbuduj obrazy Docker

```bash
docker-compose build
```

To może potrwać 5-10 minut przy pierwszym buildzie.

### 3.2 Uruchom wszystkie serwisy

```bash
docker-compose up -d
```

**Uwaga:** Backend automatycznie aplikuje migracje przy starcie (DbInitializer).  
Tabele w bazie zostaną utworzone automatycznie - nie musisz ręcznie uruchamiać `dotnet ef database update`.

### 3.3 Sprawdź status kontenerów

```bash
docker-compose ps
```

Powinieneś zobaczyć:

- ✅ JoinnGoDb (postgres)
- ✅ JoinnGoApp (backend)
- ✅ JoinnGoFront (frontend)

## Krok 4: Weryfikacja

### 4.1 Sprawdź logi

```bash
# Wszystkie serwisy
docker-compose logs -f

# Tylko backend
docker-compose logs -f backend

# Tylko frontend
docker-compose logs -f frontend
```

### 4.2 Testuj aplikację

1. **Frontend**: Otwórz przeglądarkę → `http://localhost`
2. **Backend API**: `http://localhost:5000/swagger`

### 4.3 Test funkcjonalności

- Zarejestruj nowe konto
- Sprawdź email weryfikacyjny
- Zaloguj się
- Utwórz wydarzenie

### 4.4 Domyślne konta testowe

Po pierwszym uruchomieniu aplikacja utworzy dwóch użytkowników:

1.  **Administrator**:
    - Email: `admin@example.com`
    - Hasło: `admin123`
    - Rola: Admin

2.  **Użytkownik Testowy**:
    - Email: `jan.kowalski@example.com`
    - Hasło: `user123`
    - Rola: User
    - _Uwaga: Po pierwszym zalogowaniu należy uzupełnić nazwę użytkownika w profilu w przypadku konta jan.kowalski@example.com._

---

## Krok 5: Automatyczne Usługi (Background Services)

### RecurrenceGenerationService

Aplikacja automatycznie uruchamia background service który:

- Działa **co 24 godziny** (pierwszy run 1 minutę po starcie aplikacji)
- Generuje nowe instancje wydarzeń cyklicznych
- Utrzymuje zawsze wydarzenia na **2 tygodnie naprzód**
- **Nie wymaga żadnej konfiguracji** ani ręcznej interwencji

**Weryfikacja czy service działa:**

```bash
# Sprawdź logi czy service wystartował
docker logs JoinnGoApp | grep "RecurrenceGenerationService"

# Powinieneś zobaczyć:
# RecurrenceGenerationService started
# Starting automatic recurrence instance generation
```

## Krok 6: Zatrzymanie aplikacji

```bash
# Zatrzymaj wszystkie kontenery
docker-compose stop

# Zatrzymaj i usuń wolumeny
docker-compose down -v
```

## Troubleshooting

### Problem: Backend nie może połączyć się z bazą

**Rozwiązanie:**

```bash
# Sprawdź logi bazy danych
docker-compose logs db

# Zrestartuj serwisy
docker-compose restart backend db
```

### Problem: Frontend pokazuje błąd połączenia z API

**Rozwiązanie:**
Sprawdź czy backend działa:

```bash
curl http://localhost:5000/swagger
```

Jeśli nie, sprawdź logi:

```bash
docker-compose logs backend
```

### Problem: Port jest już zajęty

**Rozwiązanie:**
Zmień porty w `docker-compose.yaml`:

```yaml
ports:
  - '8000:80' # zamiast 80:80
```

## Aktualizacja aplikacji

```bash
# 1. Zatrzymaj aplikację
docker-compose down

# 2. Pobierz najnowszy kod
git pull

# 3. Przebuduj obrazy
docker-compose build

# 4. Uruchom ponownie
docker-compose up -d
```

## Backup bazy danych

```bash
# Export bazy
docker exec JoinnGoDb pg_dump -U postgres JoinnGoDb > backup_$(date +%Y%m%d).sql

# Import bazy
docker exec -i JoinnGoDb psql -U postgres JoinnGoDb < backup_20260130.sql
```

## Produkcja - dodatkowe kroki

Dla wdrożenia na serwerze produkcyjnym (VPS, Cloud):

1. **Ustaw HTTPS** (certyfikat SSL)
   - Użyj nginx/Caddy jako reverse proxy
   - Let's Encrypt dla darmowych certyfikatów

2. **Zmień porty**
   - Frontend: port 443 (HTTPS)
   - Backend: ukryty za reverse proxy

3. **Zabezpiecz sekrety**
   - Użyj Docker secrets lub vault
   - Nigdy nie commituj plików .env

4. **Monitoring**
   - Dodaj health checks
   - Logging (ELK stack)

## Support

W razie problemów sprawdź:

- Dokumentację Docker: https://docs.docker.com
- Issues projektu: https://github.com/jakubiwanca/JoinnGo/issues
