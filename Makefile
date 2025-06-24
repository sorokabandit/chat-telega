start-postgres:
	brew services start postgresql

stop-postgres:
	brew services stop postgresql

start-backend:
	cd backend && node config/server.js

start-frontend:
	cd frontend && npm run dev