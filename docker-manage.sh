#!/bin/bash

# Docker Compose Management Script

set -e

COMPOSE_FILE="docker compose.yaml"

function usage() {
    echo "Usage: $0 {start|stop|restart|logs|reset|build|status|shell}"
    echo ""
    echo "Commands:"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  restart - Restart all services"
    echo "  logs    - Show logs from all services"
    echo "  reset   - Stop services and remove volumes (fresh start)"
    echo "  build   - Rebuild the application"
    echo "  status  - Show status of all services"
    echo "  shell   - Open a shell in the app container"
    exit 1
}

function start_services() {
    echo "Starting all services..."
    docker compose up -d
    echo "Services started. Access the app at http://localhost:8080"
    echo "API endpoints:"
    echo "  - Eckchen: http://localhost:8080/api/eckchen/"
    echo "  - Wortiger: http://localhost:8080/api/wortiger/"
}

function stop_services() {
    echo "Stopping all services..."
    docker compose down
    echo "Services stopped."
}

function restart_services() {
    echo "Restarting all services..."
    docker compose down
    docker compose up -d
    echo "Services restarted."
}

function show_logs() {
    docker compose logs -f
}

function reset_services() {
    echo "Resetting services (this will remove all data)..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        docker compose up -d
        echo "Services reset with fresh data."
    else
        echo "Reset cancelled."
    fi
}

function build_app() {
    echo "Rebuilding the application..."
    docker compose up --build -d app
    echo "Application rebuilt."
}

function show_status() {
    docker compose ps
}

function open_shell() {
    echo "Opening shell in app container..."
    docker compose exec app sh
}

# Main command handling
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    reset)
        reset_services
        ;;
    build)
        build_app
        ;;
    status)
        show_status
        ;;
    shell)
        open_shell
        ;;
    *)
        usage
        ;;
esac
