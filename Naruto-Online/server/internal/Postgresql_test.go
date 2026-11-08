package internal

import (
	"os"
	"testing"
)

func TestPostgreSQLConnectionURLPrecedence(t *testing.T) {

	variable := "NARUTO_CONFIG_TEST_DATABASE_URL"
	t.Setenv(variable, "temporary")

	err := os.Unsetenv(variable)

	if err != nil {

		t.Fatal(err)
	}

	cfg := PostgreSQLConfig{URL: "postgres://dev@127.0.0.1/dev", URLEnvironmentVariable: variable}
	value, err := cfg.ConnectionURL()

	if err != nil || value != cfg.URL {

		t.Fatalf("config default was not selected: %v", err)
	}

	t.Setenv(variable, "postgres://test@127.0.0.1/test")

	value, err = cfg.ConnectionURL()

	if err != nil || value != "postgres://test@127.0.0.1/test" {

		t.Fatalf("environment override was not selected: %v", err)
	}

	t.Setenv(variable, "")

	_, err = cfg.ConnectionURL()

	if err == nil {

		t.Fatal("empty override silently fell back to the development database")
	}

	err = os.Unsetenv(variable)

	if err != nil {

		t.Fatal(err)
	}

	cfg.URL = ""
	_, err = cfg.ConnectionURL()

	if err == nil {

		t.Fatal("missing database configuration accepted")
	}
}
