package worker

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/smtp"
	"time"

	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/models"
	"narutoserver/repo"
)

type Mail struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func EncryptedMail(to, purpose, token string) (string, error) {

	cfg, err := internal.GetConfig()

	if err != nil {

		return "", err
	}

	mail := Mail{To: to, Subject: "Naruto Online: " + purpose, Body: fmt.Sprintf("Token %s:\n%s\n\n%s/%s?token=%s\n", purpose, token, cfg.Mail.PublicURL, purpose, token)}
	encoded, err := json.Marshal(mail)

	if err != nil {

		return "", err
	}

	sealed, err := auth.Seal(encoded)

	if err != nil {

		return "", err
	}

	return base64.StdEncoding.EncodeToString(sealed), nil
}

func deliverEmail(ctx context.Context, event *models.OutboxEvent) error {

	cfg, err := internal.GetConfig()

	if err != nil {

		return err
	}

	var payload struct {
		Ciphertext string `json:"ciphertext"`
	}

	err = json.Unmarshal(event.Payload, &payload)

	if err != nil {

		return err
	}

	encrypted, err := base64.StdEncoding.DecodeString(payload.Ciphertext)

	if err != nil {

		return err
	}

	clear, err := auth.Open(encrypted)

	if err != nil {

		return err
	}

	var mail Mail
	err = json.Unmarshal(clear, &mail)

	if err != nil {

		return err
	}

	host, _, err := net.SplitHostPort(cfg.Mail.Address)

	if err != nil {

		return err
	}

	dialer := net.Dialer{Timeout: 5 * time.Second}
	conn, err := dialer.DialContext(ctx, "tcp", cfg.Mail.Address)

	if err != nil {

		return err
	}

	defer conn.Close()

	err = conn.SetDeadline(time.Now().Add(10 * time.Second))

	if err != nil {

		return err
	}

	client, err := smtp.NewClient(conn, host)

	if err != nil {

		return err
	}

	defer client.Close()

	err = client.Mail(cfg.Mail.From)

	if err != nil {

		return err
	}

	err = client.Rcpt(mail.To)

	if err != nil {

		return err
	}

	writer, err := client.Data()

	if err != nil {

		return err
	}

	_, err = fmt.Fprintf(writer, "From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n%s", cfg.Mail.From, mail.To, mail.Subject, mail.Body)

	if err != nil {

		return err
	}

	err = writer.Close()

	if err != nil {

		return err
	}

	return client.Quit()
}

func DeliverEmail(ctx context.Context, id int64) (bool, error) {

	outbox, err := repo.NewOutboxEventRepo(ctx)

	if err != nil {

		return false, err
	}

	return outbox.Deliver(id, func(event *models.OutboxEvent) error {

		return deliverEmail(ctx, event)
	})
}

func Run(ctx context.Context, other func(context.Context, *models.OutboxEvent) error) {

	ticker := time.NewTicker(time.Second)

	defer ticker.Stop()

	for {

		select {

		case <-ctx.Done():
			return
		case <-ticker.C:
			r, err := repo.NewOutboxEventRepo(ctx)

			if err != nil {

				continue
			}

			for n := 0; n < 50; n++ {

				ok, err := r.Deliver(0, func(event *models.OutboxEvent) error {

					if event.Topic == "email" {

						return deliverEmail(ctx, event)
					}

					return other(ctx, event)
				})

				if err != nil || !ok {

					break
				}
			}
		}
	}
}
