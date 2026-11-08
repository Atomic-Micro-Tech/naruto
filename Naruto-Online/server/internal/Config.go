package internal

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"strings"
	"sync"
)

type Config struct {
	HTTP       HTTPConfig       `json:"http"`
	PostgreSQL PostgreSQLConfig `json:"postgresql"`
	Auth       AuthConfig       `json:"auth"`
	Mail       MailConfig       `json:"mail"`
	Voice      VoiceConfig      `json:"voice"`
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
		cfg.PostgreSQL.ConnectTimeoutSeconds <= 0 || cfg.Auth.KeyEnvironmentVariable == "" || cfg.Auth.SessionHours < 1 || cfg.Auth.SessionHours > 720 || len(cfg.Auth.AllowedOrigins) == 0 || cfg.Mail.Address == "" || cfg.Mail.From == "" || strings.ContainsAny(cfg.Mail.From, "\r\n") {

		return Config{}, errors.New("configuration contains missing or invalid values")
	}

	for _, origin := range cfg.Auth.AllowedOrigins {

		u, err := url.Parse(origin)

		if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") || u.Path != "" || u.RawQuery != "" || u.Fragment != "" || u.User != nil {

			return Config{}, errors.New("invalid allowed origin")
		}
	}

	configMu.Lock()

	defer configMu.Unlock()

	if loadedConfig != nil {

		return Config{}, errors.New("configuration already loaded")
	}

	stored := cfg
	stored.Auth.AllowedOrigins = append([]string(nil), cfg.Auth.AllowedOrigins...)

	loadedConfig = &stored

	return cfg, nil
}

// GetConfig returns a copy and never rereads the configuration file.
func GetConfig() (Config, error) {

	configMu.RLock()

	defer configMu.RUnlock()

	if loadedConfig == nil {

		return Config{}, ErrConfigNotLoaded
	}

	copy := *loadedConfig
	copy.Auth.AllowedOrigins = append([]string(nil), loadedConfig.Auth.AllowedOrigins...)

	return copy, nil
}
