package controller

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"reflect"
	"strings"
)

func exactFields(raw []byte, value any) error {

	d := json.NewDecoder(bytes.NewReader(raw))

	err := uniqueValue(d)

	if err != nil {

		return err
	}

	_, err = d.Token()

	if err != io.EOF {

		return errors.New("one JSON value required")
	}

	return objectFields(raw, reflect.TypeOf(value))
}

func uniqueValue(d *json.Decoder) error {

	token, err := d.Token()

	if err != nil {

		return err
	}

	delim, ok := token.(json.Delim)

	if !ok {

		return nil
	}

	if delim == '{' {

		seen := map[string]bool{}
		for d.More() {

			key, err := d.Token()

			if err != nil {

				return err
			}

			name, ok := key.(string)

			if !ok || seen[name] {

				return errors.New("duplicate JSON field")
			}

			seen[name] = true
			err = uniqueValue(d)

			if err != nil {

				return err
			}
		}

		_, err = d.Token()

		return err
	}

	if delim == '[' {

		for d.More() {

			err = uniqueValue(d)

			if err != nil {

				return err
			}
		}

		_, err = d.Token()

		return err
	}

	return errors.New("invalid JSON delimiter")
}

func objectFields(raw []byte, typ reflect.Type) error {

	for typ.Kind() == reflect.Pointer {

		typ = typ.Elem()
	}

	if typ.Kind() != reflect.Struct {

		return nil
	}

	var fields map[string]json.RawMessage
	err := json.Unmarshal(raw, &fields)

	if err != nil || fields == nil {

		return errors.New("JSON object required")
	}

	allowed := map[string]reflect.Type{}
	for i := 0; i < typ.NumField(); i++ {

		field := typ.Field(i)

		name := strings.Split(field.Tag.Get("json"), ",")[0]
		if name != "" && name != "-" {

			allowed[name] = field.Type
		}
	}

	for name, value := range fields {

		field, ok := allowed[name]
		if !ok || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {

			return errors.New("invalid JSON field")
		}

		for field.Kind() == reflect.Pointer {

			field = field.Elem()
		}

		if field.Kind() == reflect.Struct {

			isTime := field.PkgPath() == "time" && field.Name() == "Time"
			if !isTime {

				err = objectFields(value, field)

				if err != nil {

					return err
				}
			}
		}
	}

	return nil
}
