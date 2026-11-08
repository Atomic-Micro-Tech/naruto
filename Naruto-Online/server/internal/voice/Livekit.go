package voice

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"narutoserver/internal"
	"net/http"
	"os"
	"strings"
	"time"
)

// Claims follow https://docs.livekit.io/frontends/reference/tokens-grants/.
func Sign(identity, room, id string, expires time.Time, admin bool) (string, error) {

	cfg, err := internal.GetConfig()

	if err != nil {

		return "", err
	}

	key := os.Getenv(cfg.Voice.KeyEnvironmentVariable)

	secret := os.Getenv(cfg.Voice.SecretEnvironmentVariable)

	if key == "" || secret == "" || cfg.Voice.URL == "" {

		return "", errors.New("voice service is not configured")
	}

	grant := map[string]any{"room": room, "roomJoin": true, "canPublish": true, "canPublishSources": []string{"microphone"}, "canSubscribe": true, "canPublishData": false}
	if admin {

		grant = map[string]any{"room": room, "roomAdmin": true}
	}

	claims := jwt.MapClaims{"iss": key, "sub": identity, "jti": id, "nbf": time.Now().Add(-5 * time.Second).Unix(), "iat": time.Now().Unix(), "exp": expires.Unix(), "video": grant}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func Remove(ctx context.Context, room, identity string) error {

	cfg, err := internal.GetConfig()

	if err != nil {

		return err
	}

	token, err := Sign("server", room, "", time.Now().Add(time.Minute), true)

	if err != nil {

		return err
	}

	address := strings.Replace(strings.Replace(cfg.Voice.URL, "wss://", "https://", 1), "ws://", "http://", 1) + "/twirp/livekit.RoomService/RemoveParticipant"
	body, err := json.Marshal(map[string]string{"room": room, "identity": identity})

	if err != nil {

		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, address, bytes.NewReader(body))

	if err != nil {

		return err
	}

	request.Header.Set("Authorization", "Bearer "+token)

	request.Header.Set("Content-Type", "application/json")

	client := http.Client{Timeout: 5 * time.Second}
	response, err := client.Do(request)

	if err != nil {

		return err
	}

	defer response.Body.Close()

	if response.StatusCode == http.StatusNotFound {

		return nil
	}

	if response.StatusCode < 200 || response.StatusCode >= 300 {

		return errors.New("voice participant removal failed")
	}

	return nil
}
