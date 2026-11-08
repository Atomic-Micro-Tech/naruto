package integration

import (
	"encoding/json"
	"os"
	"testing"
)

func capture(t *testing.T, record any) {

	t.Helper()

	path := os.Getenv("NARUTO_CONTRACT_CAPTURE")

	if path == "" {

		return
	}

	data, err := json.Marshal(record)

	if err != nil {

		t.Fatal(err)
	}

	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0600)

	if err != nil {

		t.Fatal(err)
	}

	defer file.Close()

	_, err = file.Write(append(data, '\n'))

	if err != nil {

		t.Fatal(err)
	}
}
