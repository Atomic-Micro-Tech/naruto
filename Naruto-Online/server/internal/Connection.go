package internal

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"sync"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	connectionMu sync.RWMutex
	postgresDB   *sql.DB
)

// OpenConnections opens and verifies the PostgreSQL pool during startup.
func OpenConnections(ctx context.Context) error {

	cfg, err := GetConfig()

	if err != nil {

		return err
	}

	dsn := os.Getenv(cfg.PostgreSQL.URLEnvironmentVariable)

	if dsn == "" {

		return errors.New("database URL environment variable is empty")
	}

	db, err := sql.Open("pgx", dsn)

	if err != nil {

		return errors.New("cannot open database pool")
	}

	db.SetMaxOpenConns(20)

	db.SetMaxIdleConns(5)

	db.SetConnMaxLifetime(30 * time.Minute)

	checkCtx, cancel := context.WithTimeout(ctx, time.Duration(cfg.PostgreSQL.ConnectTimeoutSeconds)*time.Second)

	defer cancel()

	err = db.PingContext(checkCtx)

	if err != nil {

		db.Close()

		return errors.New("cannot reach PostgreSQL")
	}

	connectionMu.Lock()

	defer connectionMu.Unlock()

	if postgresDB != nil {

		db.Close()

		return errors.New("database pool already open")
	}

	postgresDB = db
	return nil
}

func GetPostgreSQL() (*sql.DB, error) {

	connectionMu.RLock()

	defer connectionMu.RUnlock()

	if postgresDB == nil {

		return nil, ErrConnectionNotOpen
	}

	return postgresDB, nil
}

func PingPostgreSQL(ctx context.Context) error {

	db, err := GetPostgreSQL()

	if err != nil {

		return err
	}

	return db.PingContext(ctx)
}

// CloseConnections is safe to repeat and prevents future getters from succeeding.
func CloseConnections() error {

	connectionMu.Lock()

	db := postgresDB
	postgresDB = nil
	connectionMu.Unlock()

	if db == nil {

		return nil
	}

	return db.Close()
}
