package repo

import (
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
	"time"
)

func (r *UserRepoImpl) Lock(id uuid.UUID) error {

	var result uuid.UUID
	return translate(r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.users WHERE id=$1 AND status='active' FOR UPDATE", id).Scan(&result))
}

func (r *UserRepoImpl) FindCredentials(email string) (*models.User, *models.UserCredential, error) {

	var id uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.users WHERE email=$1 AND status='active'", email).Scan(&id)

	if err == sql.ErrNoRows {

		return nil, nil, nil
	}

	if err != nil {

		return nil, nil, err
	}

	user, err := r.GetByID(id)

	if err != nil {

		return nil, nil, err
	}

	cred, err := getRow[models.UserCredential](r.repository, "user_credentials", []string{"user_id"}, id)

	if err != nil {

		return nil, nil, err
	}

	return user, cred, nil
}

func (r *UserRepoImpl) Register(user *models.User, passwordHash string, token *models.EmailToken, mailCipher []byte) (int64, error) {

	var jobID int64
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		_, err := tx.ExecContext(r.ctx, "INSERT INTO naruto.users(id,email,display_name) VALUES($1,$2,$3)", user.ID, user.Email, user.DisplayName)

		if err != nil {

			return translate(err)
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.user_credentials(user_id,password_hash) VALUES($1,$2)", user.ID, passwordHash)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.user_preferences(user_id) VALUES($1)", user.ID)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.email_tokens(id,user_id,purpose,email,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6)", token.ID, user.ID, token.Purpose, user.Email, token.TokenHash, token.ExpiresAt)

		if err != nil {

			return err
		}

		return tx.QueryRowContext(r.ctx, "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) VALUES('email',$1,$2,jsonb_build_object('ciphertext',$3::text)) RETURNING id", user.ID, token.ID.String(), string(mailCipher)).Scan(&jobID)
	})

	return jobID, err
}

func (r *UserRepoImpl) QueueEmail(userID uuid.UUID, purpose string, tokenID uuid.UUID, hash []byte, expires time.Time, mailCipher string) (int64, error) {

	var jobID int64
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var email string
		err := tx.QueryRowContext(r.ctx, "SELECT email FROM naruto.users WHERE id=$1 AND status='active' FOR UPDATE", userID).Scan(&email)

		if err != nil {

			return translate(err)
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.email_tokens SET revoked_at=now() WHERE user_id=$1 AND purpose=$2 AND used_at IS NULL AND revoked_at IS NULL", userID, purpose)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.email_tokens(id,user_id,purpose,email,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6)", tokenID, userID, purpose, email, hash, expires)

		if err != nil {

			return err
		}

		return tx.QueryRowContext(r.ctx, "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) VALUES('email',$1,$2,jsonb_build_object('ciphertext',$3::text)) RETURNING id", userID, tokenID.String(), mailCipher).Scan(&jobID)
	})

	return jobID, err
}

func (r *UserRepoImpl) ConsumeEmailToken(hash []byte, purpose, passwordHash string) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var userID uuid.UUID
		var email string
		err := tx.QueryRowContext(r.ctx, "SELECT user_id FROM naruto.email_tokens WHERE token_hash=$1 AND purpose=$2", hash, purpose).Scan(&userID)

		if err == sql.ErrNoRows {

			return internal.Reject("INVALID_TOKEN", "token is invalid or expired")
		}

		if err != nil {

			return err
		}

		var currentEmail string
		err = tx.QueryRowContext(r.ctx, "SELECT email FROM naruto.users WHERE id=$1 AND status='active' FOR UPDATE", userID).Scan(&currentEmail)

		if err != nil {

			return err
		}

		err = tx.QueryRowContext(r.ctx, "UPDATE naruto.email_tokens SET used_at=now() WHERE token_hash=$1 AND purpose=$2 AND used_at IS NULL AND revoked_at IS NULL AND expires_at>now() RETURNING email", hash, purpose).Scan(&email)

		if err == sql.ErrNoRows {

			return internal.Reject("INVALID_TOKEN", "token is invalid or expired")
		}

		if err != nil {

			return err
		}

		if email != currentEmail {

			return internal.Reject("INVALID_TOKEN", "token is invalid or expired")
		}

		if purpose == "verify_email" {

			_, err = tx.ExecContext(r.ctx, "UPDATE naruto.users SET email_verified_at=coalesce(email_verified_at,now()) WHERE id=$1", userID)

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.user_credentials SET password_hash=$2,password_changed_at=now(),failed_login_count=0,locked_until=NULL WHERE user_id=$1", userID, passwordHash)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.sessions SET revoked_at=coalesce(revoked_at,now()),revoke_reason='password_reset' WHERE user_id=$1", userID)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.email_tokens SET revoked_at=now() WHERE user_id=$1 AND purpose='reset_password' AND used_at IS NULL AND revoked_at IS NULL", userID)

		if err != nil {

			return err
		}

		return revokeVoice(tx, r.ctx, userID, uuid.Nil)
	})
}

func (r *UserRepoImpl) LoginFailure(id uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "UPDATE naruto.user_credentials SET failed_login_count=CASE WHEN locked_until<now() THEN 1 ELSE failed_login_count+1 END,locked_until=CASE WHEN failed_login_count>=4 AND (locked_until IS NULL OR locked_until>now()) THEN now()+interval '15 minutes' WHEN locked_until<now() THEN NULL ELSE locked_until END WHERE user_id=$1", id)

	return err
}
