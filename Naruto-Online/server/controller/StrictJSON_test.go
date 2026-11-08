package controller

import (
	"narutoserver/internal"
	"testing"
)

func TestStrictJSONRejectsAmbiguousRequests(t *testing.T) {

	cases := []string{
		`{"email":"a@example.test","email":"b@example.test","password":"test"}`,
		`{"email":"a@example.test","Email":"b@example.test","password":"test"}`,
		`{"email":null,"password":"test"}`,
		`{"email":"a@example.test","password":"test","admin":true}`,
		`null`,
		`{"email":"a@example.test","password":"test"} {}`,
	}

	for _, raw := range cases {

		var value internal.RequestLoginEmail
		err := exactFields([]byte(raw), &value)

		if err == nil {

			t.Fatalf("accepted ambiguous input: %s", raw)
		}
	}

	var valid internal.RequestLoginEmail
	err := exactFields([]byte(`{"email":"a@example.test","password":"test"}`), &valid)

	if err != nil {

		t.Fatal(err)
	}
}
