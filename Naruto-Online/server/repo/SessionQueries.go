package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
)

func (r *WSTicketRepoImpl) Issue(sessionID uuid.UUID, hash []byte, origin string) (*models.WSTicket, error) {

	var id uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "INSERT INTO naruto.ws_tickets(session_id,token_hash,origin,created_at,expires_at) SELECT s.id,$2,$3,now(),least(now()+interval '30 seconds',s.expires_at) FROM naruto.sessions s JOIN naruto.users u ON u.id=s.user_id WHERE s.id=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' RETURNING id", sessionID, hash, origin).Scan(&id)

	if err == sql.ErrNoRows {

		return nil, internal.Reject("UNAUTHENTICATED", "session expired or invalid")
	}

	if err != nil {

		return nil, err
	}

	return r.GetByID(id)
}

func (r *SessionRepoImpl) Authenticate(hash []byte) (*models.Session, error) {

	var id uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "SELECT s.id FROM naruto.sessions s JOIN naruto.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active'", hash).Scan(&id)

	if err == sql.ErrNoRows {

		return nil, internal.Reject("UNAUTHENTICATED", "session expired or invalid")
	}

	if err != nil {

		return nil, err
	}

	return r.GetByID(id)
}

func (r *SessionRepoImpl) CreateForPassword(userID uuid.UUID, passwordHash string, s *models.Session) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var id uuid.UUID
		err := tx.QueryRowContext(r.ctx, "SELECT u.id FROM naruto.users u JOIN naruto.user_credentials c ON c.user_id=u.id WHERE u.id=$1 AND u.status='active' AND c.password_hash=$2 AND (c.locked_until IS NULL OR c.locked_until<=now()) FOR UPDATE OF u,c", userID, passwordHash).Scan(&id)

		if err == sql.ErrNoRows {

			return internal.Reject("INVALID_CREDENTIALS", "invalid credentials")
		}

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.user_credentials SET failed_login_count=0,locked_until=NULL WHERE user_id=$1", userID)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.sessions(id,user_id,token_hash,csrf_token_hash,expires_at) VALUES($1,$2,$3,$4,$5)", s.ID, userID, s.TokenHash, s.CSRFTokenHash, s.ExpiresAt)

		return err
	})
}

func revokeVoice(tx *sql.Tx, ctx context.Context, userID, sessionID uuid.UUID) error {

	_, err := tx.ExecContext(ctx, "WITH revoked AS (UPDATE naruto.voice_grants SET revoked_at=now(),revoke_reason='session_revoked' WHERE user_id=$1 AND ($2::uuid='00000000-0000-0000-0000-000000000000' OR session_id=$2) AND revoked_at IS NULL RETURNING id,room_id,provider_identity) INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) SELECT 'voice.remove',room_id,'revoke:'||id::text,jsonb_build_object('roomId',room_id,'identity',provider_identity) FROM revoked ON CONFLICT(deduplication_key) DO NOTHING", userID, sessionID)

	return err
}

func (r *SessionRepoImpl) Revoke(id, userID uuid.UUID) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		_, err := tx.ExecContext(r.ctx, "UPDATE naruto.sessions SET revoked_at=coalesce(revoked_at,now()),revoke_reason='logout' WHERE id=$1 AND user_id=$2", id, userID)

		if err != nil {

			return err
		}

		return revokeVoice(tx, r.ctx, userID, id)
	})
}

func (r *SessionRepoImpl) Rotate(oldID, userID uuid.UUID, s *models.Session) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var id uuid.UUID
		err := tx.QueryRowContext(r.ctx, "SELECT id FROM naruto.users WHERE id=$1 AND status='active' FOR UPDATE", userID).Scan(&id)

		if err != nil {

			return err
		}

		err = tx.QueryRowContext(r.ctx, "UPDATE naruto.sessions SET revoked_at=now(),revoke_reason='refresh' WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now() RETURNING id", oldID, userID).Scan(&id)

		if err == sql.ErrNoRows {

			return internal.Reject("UNAUTHENTICATED", "session expired or invalid")
		}

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.sessions(id,user_id,token_hash,csrf_token_hash,expires_at) VALUES($1,$2,$3,$4,$5)", s.ID, userID, s.TokenHash, s.CSRFTokenHash, s.ExpiresAt)

		if err != nil {

			return err
		}

		return revokeVoice(tx, r.ctx, userID, oldID)
	})
}

func (r *WSTicketRepoImpl) Consume(hash []byte, origin string) (*models.WSTicket, error) {

	var id uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "UPDATE naruto.ws_tickets t SET consumed_at=now() FROM naruto.sessions s,naruto.users u WHERE t.token_hash=$1 AND t.origin=$2 AND t.consumed_at IS NULL AND t.expires_at>now() AND s.id=t.session_id AND s.revoked_at IS NULL AND s.expires_at>now() AND u.id=s.user_id AND u.status='active' RETURNING t.id", hash, origin).Scan(&id)

	if err == sql.ErrNoRows {

		return nil, internal.Reject("UNAUTHENTICATED", "ticket expired or invalid")
	}

	if err != nil {

		return nil, err
	}

	return r.GetByID(id)
}
