package internal

import (
	"errors"
	"os"
)

// PostgreSQLConfig provides local Compose defaults and an optional environment override.
type PostgreSQLConfig struct {
	URL                    string `json:"url"`
	URLEnvironmentVariable string `json:"url_environment_variable"`
	ConnectTimeoutSeconds  int    `json:"connect_timeout_seconds"`
}

func (cfg PostgreSQLConfig) ConnectionURL() (string, error) {

	value, exists := os.LookupEnv(cfg.URLEnvironmentVariable)

	if exists {

		if value == "" {

			return "", errors.New("database URL environment variable is empty")
		}

		return value, nil
	}

	if cfg.URL == "" {

		return "", errors.New("database URL is not configured")
	}

	return cfg.URL, nil
}
