package internal

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestConfigLoadIsStrictAndGetterReturnsCopy(t *testing.T) {

	_, err := GetConfig()

	if !errors.Is(err, ErrConfigNotLoaded) {

		t.Fatalf("expected ErrConfigNotLoaded, got %v", err)
	}

	path := filepath.Join(t.TempDir(), "config.json")

	invalid := []byte(`{"http":{"listen_address":"127.0.0.1:8080"},"unknown":true}`)

	err = os.WriteFile(path, invalid, 0o600)

	if err != nil {

		t.Fatal(err)
	}

	_, err = LoadConfig(path)

	if err == nil {

		t.Fatal("unknown configuration field accepted")
	}

	valid := []byte(`{"http":{"listen_address":"127.0.0.1:8080","read_header_timeout_seconds":5,"read_timeout_seconds":15,"write_timeout_seconds":15,"idle_timeout_seconds":60},"postgresql":{"url_environment_variable":"NARUTO_DATABASE_URL","connect_timeout_seconds":5}}`)

	err = os.WriteFile(path, valid, 0o600)

	if err != nil {

		t.Fatal(err)
	}

	cfg, err := LoadConfig(path)

	if err != nil {

		t.Fatal(err)
	}

	cfg.HTTP.ListenAddress = "modified"
	loaded, err := GetConfig()

	if err != nil {

		t.Fatal(err)
	}

	if loaded.HTTP.ListenAddress != "127.0.0.1:8080" {

		t.Fatalf("getter exposed mutable config: %q", loaded.HTTP.ListenAddress)
	}

	_, err = LoadConfig(path)

	if err == nil {

		t.Fatal("second configuration load accepted")
	}
}

func TestConnectionGetterBeforeSetup(t *testing.T) {

	_, err := GetPostgreSQL()

	if !errors.Is(err, ErrConnectionNotOpen) {

		t.Fatalf("expected ErrConnectionNotOpen, got %v", err)
	}

	err = CloseConnections()

	if err != nil {

		t.Fatal(err)
	}
}
