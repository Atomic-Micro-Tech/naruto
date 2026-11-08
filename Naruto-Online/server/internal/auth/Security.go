package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/argon2"
	"narutoserver/internal"
)

func Key() ([]byte, error) {

	cfg, err := internal.GetConfig()

	if err != nil {

		return nil, err
	}

	key, err := base64.StdEncoding.DecodeString(os.Getenv(cfg.Auth.KeyEnvironmentVariable))

	if err != nil || len(key) != 32 {

		return nil, errors.New("application key must contain 32 base64-encoded bytes")
	}

	return key, nil
}

func Token() string {

	b := make([]byte, 32)

	_, err := rand.Read(b)

	if err != nil {

		panic(err)
	}

	return base64.RawURLEncoding.EncodeToString(b)
}

func Digest(value string) []byte {

	h := sha256.Sum256([]byte(value))

	return h[:]
}

func Hash(value []byte) string {

	h := sha256.Sum256(value)

	return hex.EncodeToString(h[:])
}

func MAC(purpose, value string) ([]byte, error) {

	key, err := Key()

	if err != nil {

		return nil, err
	}

	h := hmac.New(sha256.New, key)

	h.Write([]byte(purpose + "\x00" + value))

	return h.Sum(nil), nil
}

func CSRF(token string) (string, error) {

	value, err := MAC("csrf", token)

	if err != nil {

		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(value), nil
}

func Seal(value []byte) ([]byte, error) {

	key, err := Key()

	if err != nil {

		return nil, err
	}

	block, err := aes.NewCipher(key)

	if err != nil {

		return nil, err
	}

	gcm, err := cipher.NewGCM(block)

	if err != nil {

		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())

	_, err = rand.Read(nonce)

	if err != nil {

		return nil, err
	}

	return gcm.Seal(nonce, nonce, value, []byte("narutoserver:v1")), nil
}

func Open(value []byte) ([]byte, error) {

	key, err := Key()

	if err != nil {

		return nil, err
	}

	block, err := aes.NewCipher(key)

	if err != nil {

		return nil, err
	}

	gcm, err := cipher.NewGCM(block)

	if err != nil {

		return nil, err
	}

	if len(value) < gcm.NonceSize() {

		return nil, errors.New("invalid ciphertext")
	}

	return gcm.Open(nil, value[:gcm.NonceSize()], value[gcm.NonceSize():], []byte("narutoserver:v1"))
}

func HashPassword(password string) (string, error) {

	salt := make([]byte, 16)

	_, err := rand.Read(salt)

	if err != nil {

		return "", err
	}

	key := argon2.IDKey([]byte(password), salt, 2, 65536, 1, 32)

	return fmt.Sprintf("$argon2id$v=19$m=65536,t=2,p=1$%s$%s", base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(key)), nil
}

func VerifyPassword(encoded, password string) bool {

	parts := strings.Split(encoded, "$")

	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" || parts[3] != "m=65536,t=2,p=1" {

		return false
	}

	salt, e1 := base64.RawStdEncoding.DecodeString(parts[4])

	want, e2 := base64.RawStdEncoding.DecodeString(parts[5])

	if e1 != nil || e2 != nil || len(salt) != 16 || len(want) != 32 {

		return false
	}

	got := argon2.IDKey([]byte(password), salt, 2, 65536, 1, 32)

	return subtle.ConstantTimeCompare(got, want) == 1
}
