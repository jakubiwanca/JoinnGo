# Wdrożenie aplikacji JoinnGo - Instrukcja

## Wymagania

- Docker Desktop (lub Docker Engine + Docker Compose)
- Git

## Krok 1: Przygotowanie środowiska

### 1.1 Sklonuj repozytorium (jeśli jeszcze nie masz)

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

### 2.1 Backend - skopiuj i edytuj plik środowiskowy

```bash
cp JoinnGoApp/.env.production.template JoinnGoApp/.env.production
```

Edytuj plik `JoinnGoApp/.env.production` i uzupełnij:

```bash
# Database - zmień hasło
DB_PASSWORD=TWOJE_SILNE_HASLO

# Email - podaj swoje dane SMTP
SMTP_USERNAME=twoj_email@gmail.com
SMTP_PASSWORD=twoje_haslo_aplikacji
SENDER_EMAIL=twoj_email@gmail.com

# JWT - wygeneruj silny klucz (min 32 znaki)
JWT_KEY=WYGENERUJ_LOSOWY_KLUCZ_MIN_32_ZNAKI
```

**Jak wygenerować JWT_KEY:**

```bash
# Linux/Mac
openssl rand -base64 32

# Lub użyj online generatora
```

### 2.2 Frontend (opcjonalnie)

Jeśli chcesz zmienić URL backendu, edytuj:

```bash
nano joinngo-front/.env.production
```

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

### 3.3 Sprawdź status kontenerów

```bash
docker-compose ps
```

Powinieneś zobaczyć:

- ✅ JoinnGoDb (postgres)
- ✅ JoinnGoApp (backend)
- ✅ JoinnGoFront (frontend)
- ✅ pgadmin (opcjonalnie)

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
3. **pgAdmin**: `http://localhost:8080`

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
    - _Uwaga: Po pierwszym zalogowaniu należy uzupełnić nazwę użytkownika w profilu._

## Krok 5: Zatrzymanie aplikacji

```bash
# Zatrzymaj wszystkie kontenery
docker-compose down

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
