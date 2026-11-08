package controller

import (
	"bytes"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/google/uuid"
	"io"
	"mime"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"net/http"
	"net/mail"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

func decode(w http.ResponseWriter, r *http.Request, dst any, required ...string) error {

	media, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))

	if err != nil || media != "application/json" {

		return errors.New("JSON body required")
	}

	raw, err := io.ReadAll(http.MaxBytesReader(w, r.Body, internal.MaxMessageBytes))

	if err != nil {

		return err
	}

	err = exactFields(raw, dst)

	if err != nil {

		return err
	}

	var fields map[string]json.RawMessage
	err = json.Unmarshal(raw, &fields)

	if err != nil || fields == nil {

		return errors.New("JSON object required")
	}

	for _, key := range required {

		value, ok := fields[key]
		if !ok || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {

			return errors.New("required field missing")
		}
	}

	decoder := json.NewDecoder(bytes.NewReader(raw))

	decoder.DisallowUnknownFields()

	return decoder.Decode(dst)
}

func noBody(r *http.Request) bool {

	if r.Body == nil {

		return true
	}

	buf := make([]byte, 1)

	n, err := r.Body.Read(buf)

	return n == 0 && err == io.EOF
}

func length(s string, min, max int) bool {

	return utf8.ValidString(s) && utf8.RuneCountInString(s) >= min && utf8.RuneCountInString(s) <= max
}

func email(s string) bool {

	address, err := mail.ParseAddress(s)

	return err == nil && address.Address == s && len(s) <= 254 && strings.Contains(s, "@") && !strings.ContainsAny(s, "\r\n")
}

func identifier(s string) (uuid.UUID, bool) {

	id, err := uuid.Parse(s)

	return id, err == nil && len(s) == 36 && id != uuid.Nil
}

func invite(s string) bool {

	if !length(s, 6, 32) {

		return false
	}

	for _, c := range s {

		if !(c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-') {

			return false
		}
	}

	return true
}

func validSettings(s *internal.RoomSettingsInput) bool {

	return s != nil && s.ArenaID == "arena-1" && s.Capacity != nil && *s.Capacity >= 2 && *s.Capacity <= 4 && s.TargetChakra != nil && *s.TargetChakra >= 0 && *s.TargetChakra <= 99999 && s.Rule == "normal" && s.VoiceEnabled != nil
}

func page(r *http.Request) (internal.PageParam, error) {

	p := internal.PageParam{Limit: 20}
	q := r.URL.Query()

	for _, values := range q {

		if len(values) != 1 {

			return p, errors.New("duplicate query")
		}
	}

	raw := q.Get("limit")

	if raw != "" {

		value, err := strconv.Atoi(raw)

		if err != nil || value < 1 || value > 50 {

			return p, errors.New("invalid limit")
		}

		p.Limit = value
	}

	principal, err := internal.CurrentPrincipal(r.Context())

	if err != nil {

		return p, err
	}

	q.Del("cursor")

	q.Del("limit")

	p.Scope = auth.Hash([]byte(principal.UserID.String() + ":" + r.URL.Path + ":" + q.Encode()))

	raw = r.URL.Query().Get("cursor")

	if raw == "" {

		return p, nil
	}

	if len(raw) > 1024 {

		return p, errors.New("invalid cursor")
	}

	cipher, err := base64.RawURLEncoding.DecodeString(raw)

	if err != nil {

		return p, err
	}

	clear, err := auth.Open(cipher)

	if err != nil {

		return p, err
	}

	var cursor internal.Cursor
	err = json.Unmarshal(clear, &cursor)

	if err != nil || cursor.ID == uuid.Nil || cursor.CreatedAt.IsZero() || subtle.ConstantTimeCompare([]byte(cursor.Scope), []byte(p.Scope)) != 1 {

		return p, errors.New("invalid cursor")
	}

	p.Cursor = &cursor
	return p, nil
}

func sessionCookie(w http.ResponseWriter, token string, expires time.Time) {

	cfg, _ := internal.GetConfig()

	cookie := &http.Cookie{Name: internal.SessionCookieName, Value: token, Path: "/", HttpOnly: true, Secure: cfg.Auth.CookieSecure, SameSite: http.SameSiteLaxMode, Expires: expires}
	if token == "" {

		cookie.MaxAge = -1
	}

	http.SetCookie(w, cookie)
}
