// Package testsupport contains isolated integration-test infrastructure, never production fixtures.
package testsupport

import (
	"bufio"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"narutoserver/internal"
	"narutoserver/realtime"
	"narutoserver/worker"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type Mailbox struct {
	mu       sync.Mutex
	messages []string
}

func (m *Mailbox) Token(t *testing.T, email, purpose string) string {

	t.Helper()

	deadline := time.Now().Add(10 * time.Second)

	for time.Now().Before(deadline) {

		m.mu.Lock()

		all := append([]string{}, m.messages...)

		m.mu.Unlock()

		for i := len(all) - 1; i >= 0; i-- {

			text := all[i]
			if strings.Contains(text, "To: "+email) && strings.Contains(text, "Token "+purpose+":") {

				parts := strings.Split(text, "Token "+purpose+":")

				return strings.Fields(parts[1])[0]
			}
		}

		time.Sleep(20 * time.Millisecond)
	}

	t.Fatal("email token was not delivered")

	return ""
}

func Start(t *testing.T) *Mailbox {

	t.Helper()

	dsn := os.Getenv("NARUTO_TEST_DATABASE_URL")

	if dsn == "" {

		t.Skip("set NARUTO_TEST_DATABASE_URL to an isolated database with database-naruto.sql applied")
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")

	if err != nil {

		t.Fatal(err)
	}

	t.Cleanup(func() {

		listener.Close()
	})

	inbox := &Mailbox{}
	go func() {

		for {

			conn, err := listener.Accept()

			if err != nil {

				return
			}

			go func() {

				defer conn.Close()

				reader := bufio.NewReader(conn)

				fmt.Fprint(conn, "220 test SMTP\r\n")

				var body strings.Builder
				data := false
				for {

					line, err := reader.ReadString('\n')

					if err != nil {

						return
					}

					trim := strings.TrimSpace(line)

					if data {

						if trim == "." {

							inbox.mu.Lock()

							inbox.messages = append(inbox.messages, body.String())

							inbox.mu.Unlock()

							data = false
							fmt.Fprint(conn, "250 stored\r\n")
						} else {

							body.WriteString(line)
						}

						continue
					}

					switch {

					case strings.HasPrefix(trim, "EHLO"), strings.HasPrefix(trim, "HELO"), strings.HasPrefix(trim, "MAIL"), strings.HasPrefix(trim, "RCPT"):
						fmt.Fprint(conn, "250 OK\r\n")

					case trim == "DATA":
						data = true
						fmt.Fprint(conn, "354 continue\r\n")

					case trim == "QUIT":
						fmt.Fprint(conn, "221 bye\r\n")

						return
					default:
						fmt.Fprint(conn, "250 OK\r\n")
					}
				}
			}()
		}
	}()

	raw, err := os.ReadFile("../configs/config.json")

	if err != nil {

		t.Fatal(err)
	}

	var cfg internal.Config
	err = json.Unmarshal(raw, &cfg)

	if err != nil {

		t.Fatal(err)
	}

	cfg.Mail.Address = listener.Addr().String()

	cfg.PostgreSQL.URLEnvironmentVariable = "NARUTO_TEST_DATABASE_URL"
	cfg.PostgreSQL.URL = ""
	cfg.Auth.KeyEnvironmentVariable = "NARUTO_TEST_APP_KEY"
	cfg.Voice.KeyEnvironmentVariable = "NARUTO_TEST_VOICE_KEY"
	cfg.Voice.SecretEnvironmentVariable = "NARUTO_TEST_VOICE_SECRET"
	t.Setenv("NARUTO_TEST_APP_KEY", base64.StdEncoding.EncodeToString([]byte("0123456789abcdef0123456789abcdef")))

	t.Setenv("NARUTO_TEST_VOICE_KEY", "testkey")

	t.Setenv("NARUTO_TEST_VOICE_SECRET", "test-secret-for-local-signature-only")

	raw, err = json.Marshal(cfg)

	if err != nil {

		t.Fatal(err)
	}

	path := filepath.Join(t.TempDir(), "config.json")

	err = os.WriteFile(path, raw, 0600)

	if err != nil {

		t.Fatal(err)
	}

	_, err = internal.LoadConfig(path)

	if err != nil {

		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	err = internal.OpenConnections(ctx)

	if err != nil {

		t.Fatal(err)
	}

	var wg sync.WaitGroup
	wg.Add(1)

	go func() {

		defer wg.Done()

		worker.Run(ctx, realtime.Dispatch)
	}()

	t.Cleanup(func() {

		cancel()

		realtime.Close()

		wg.Wait()

		internal.CloseConnections()
	})

	return inbox
}
