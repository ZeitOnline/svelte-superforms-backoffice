# Docker Compose Setup

This Docker Compose setup provides a complete development environment with:

- **SvelteKit App**: Your main application running on port 3000
- **PostgreSQL**: Database with two schemas (eckchen, wortiger) on port 5432
- **PostgREST APIs**:
  - Eckchen API on port 3001
  - Wortiger API on port 3002
- **Nginx Reverse Proxy**: Routes API requests on port 8080

## Quick Start

1. **Start all services:**

  ```bash
  docker compose up -d
  ```

2. **View logs:**

  ```bash
  docker compose logs -f
  ```

3. **Stop all services:**

  ```bash
  docker compose down
  ```

## Access Points

### Application

- **Main App**: http://localhost:8080
- **Direct App Access**: http://localhost:3000

### APIs (via Nginx Proxy)

- **Eckchen API**: http://localhost:8080/api/eckchen/
- **Wortiger API**: http://localhost:8080/api/wortiger/

### Direct API Access

- **Eckchen PostgREST**: http://localhost:3001
- **Wortiger PostgREST**: http://localhost:3002

### Database

- **PostgreSQL**: localhost:5432
  - Database: `main`
  - Username: `postgres`
  - Password: `postgres`
  - Schemas: `eckchen`, `wortiger`

## API Usage Examples

### Eckchen API

```bash
# Get all games
curl http://localhost:8080/api/eckchen/games

# Get a specific game
curl http://localhost:8080/api/eckchen/games?id=eq.1

# Create a new game
curl -X POST http://localhost:8080/api/eckchen/games \
  -H "Content-Type: application/json" \
  -d '{"title": "New Game", "description": "A new exciting game"}'

# Get all players
curl http://localhost:8080/api/eckchen/players
```

### Wortiger API

```bash
# Get all words
curl http://localhost:8080/api/wortiger/words

# Get words by difficulty
curl http://localhost:8080/api/wortiger/words?difficulty=eq.1

# Create a new word
curl -X POST http://localhost:8080/api/wortiger/words \
  -H "Content-Type: application/json" \
  -d '{"word": "Katze", "definition": "Ein kleines Haustier", "difficulty": 1, "language": "de"}'

# Get all categories
curl http://localhost:8080/api/wortiger/categories
```

## Database Schema

### Eckchen Schema

- `games`: Game definitions
- `players`: Player information
- `game_sessions`: Individual game sessions with scores

### Wortiger Schema

- `words`: Word definitions with difficulty levels
- `categories`: Word categories
- `word_categories`: Many-to-many relationship between words and categories
- `game_results`: Game session results

## Development

### Rebuild the app after changes

```bash
docker compose up --build app
```

### Access database directly:

```bash
docker compose exec postgres psql -U postgres -d main
```

### View PostgREST schema information:

```bash
# Eckchen schema
curl http://localhost:3001/

# Wortiger schema
curl http://localhost:3002/
```

## Configuration

### Environment Variables

The app service has access to these environment variables:

- `DATABASE_URL`: Direct PostgreSQL connection
- `POSTGREST_ECKCHEN_URL`: Internal URL for Eckchen API
- `POSTGREST_WORTIGER_URL`: Internal URL for Wortiger API

### Security Notes

- The JWT secret in the PostgREST configuration should be changed for production
- Database credentials should be secured for production use
- The `web_anon` role has full CRUD access - consider restricting permissions as needed

## Troubleshooting

### Check service health

```bash
docker compose ps
```

### View specific service logs

```bash
docker compose logs postgres
docker compose logs postgrest_eckchen
docker compose logs postgrest_wortiger
docker compose logs app
docker compose logs nginx
```

### Reset database data

```bash
docker compose down -v
docker compose up -d
```
