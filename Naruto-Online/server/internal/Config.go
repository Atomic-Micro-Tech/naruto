package internal

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
)

type Config struct {
	HTTP       HTTPConfig       `json:"http"`
	PostgreSQL PostgreSQLConfig `json:"postgresql"`
}

var (
	configMu     sync.RWMutex
	loadedConfig *Config
)

// LoadConfig accepts one strict JSON object and publishes an immutable value copy.
func LoadConfig(path string) (Config, error) {

	var cfg Config
	data, err := os.ReadFile(path)

	if err != nil {

		return cfg, fmt.Errorf("read configuration: %w", err)
	}

	decoder := json.NewDecoder(bytes.NewReader(data))

	decoder.DisallowUnknownFields()

	err = decoder.Decode(&cfg)

	if err != nil {

		return Config{}, fmt.Errorf("decode configuration: %w", err)
	}

	var trailing any
	err = decoder.Decode(&trailing)

	if !errors.Is(err, io.EOF) {

		return Config{}, errors.New("configuration must contain one JSON object")
	}

	if cfg.HTTP.ListenAddress == "" || cfg.HTTP.ReadHeaderTimeoutSeconds <= 0 ||
		cfg.HTTP.ReadTimeoutSeconds <= 0 || cfg.HTTP.WriteTimeoutSeconds <= 0 ||
		cfg.HTTP.IdleTimeoutSeconds <= 0 || cfg.PostgreSQL.URLEnvironmentVariable == "" ||
		cfg.PostgreSQL.ConnectTimeoutSeconds <= 0 {

		return Config{}, errors.New("configuration contains missing or invalid values")
	}

	configMu.Lock()

	defer configMu.Unlock()

	if loadedConfig != nil {

		return Config{}, errors.New("configuration already loaded")
	}

	loadedConfig = &cfg

	return cfg, nil
}

// GetConfig returns a copy and never rereads the configuration file.
func GetConfig() (Config, error) {

	configMu.RLock()

	defer configMu.RUnlock()

	if loadedConfig == nil {

		return Config{}, ErrConfigNotLoaded
	}

	return *loadedConfig, nil
}
