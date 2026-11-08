package repo

import (
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
)

func (r *VoiceGrantRepoImpl) Grant(value *models.VoiceGrant) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var id uuid.UUID
		err := tx.QueryRowContext(r.ctx, "SELECT id FROM naruto.sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE", value.SessionID, value.UserID).Scan(&id)

		if err == sql.ErrNoRows {

			return internal.Reject("UNAUTHENTICATED", "session expired or invalid")
		}

		if err != nil {

			return err
		}

		var enabled bool
		err = tx.QueryRowContext(r.ctx, "SELECT r.voice_enabled FROM naruto.rooms r JOIN naruto.room_members m ON m.room_id=r.id WHERE r.id=$1 AND m.user_id=$2 AND r.closed_at IS NULL FOR UPDATE OF r", value.RoomID, value.UserID).Scan(&enabled)

		if err == sql.ErrNoRows {

			return internal.Reject("NOT_FOUND", "room not found")
		}

		if err != nil {

			return err
		}

		if !enabled {

			return internal.Reject("VOICE_DISABLED", "voice is disabled for this room")
		}

		rr, err := NewVoiceGrantRepoTx(r.ctx, tx)

		if err != nil {

			return err
		}

		return rr.Create(value)
	})
}

func (r *VoiceGrantRepoImpl) RevokeRoom(id uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "WITH revoked AS(UPDATE naruto.voice_grants SET revoked_at=now(),revoke_reason='voice_disabled' WHERE room_id=$1 AND revoked_at IS NULL RETURNING id,provider_identity) INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) SELECT 'voice.remove',$1,'disabled:'||id::text,jsonb_build_object('roomId',$1::uuid,'identity',provider_identity) FROM revoked ON CONFLICT(deduplication_key) DO NOTHING", id)

	return err
}
