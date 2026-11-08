package repo

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
)

func changeRoom(tx *sql.Tx, ctx context.Context, id uuid.UUID) error {

	r, err := NewRoomRepoTx(ctx, tx)

	if err != nil {

		return err

	}

	err = r.IncrementVersion(id)

	if err != nil {

		return err

	}

	room, err := r.GetByID(id)

	if err != nil {

		return err

	}

	return r.EnqueueChanged(id, room.RoomVersion)

}

func (r *RoomRepoImpl) RemoveMember(id, userID uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "DELETE FROM naruto.room_members WHERE room_id=$1 AND user_id=$2", id, userID)

	if err != nil {

		return err

	}

	_, err = r.query.ExecContext(r.ctx, "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) VALUES('room.member_removed',$1,$2,jsonb_build_object('userId',$3::uuid))", id, "member-left:"+uuid.NewString(), userID)

	if err != nil {

		return err

	}

	// Host migration and closure happen in one UPDATE to satisfy immediate checks.
	_, err = r.query.ExecContext(r.ctx, "UPDATE naruto.rooms r SET host_user_id=(SELECT user_id FROM naruto.room_members WHERE room_id=r.id ORDER BY join_order LIMIT 1),status=CASE WHEN EXISTS(SELECT 1 FROM naruto.room_members WHERE room_id=r.id) THEN status ELSE 'closed' END,active_match_id=CASE WHEN EXISTS(SELECT 1 FROM naruto.room_members WHERE room_id=r.id) THEN active_match_id ELSE NULL END,closed_at=CASE WHEN EXISTS(SELECT 1 FROM naruto.room_members WHERE room_id=r.id) THEN closed_at ELSE now() END WHERE r.id=$1 AND NOT EXISTS(SELECT 1 FROM naruto.room_members WHERE room_id=r.id AND user_id=r.host_user_id)", id)

	if err != nil {

		return err

	}

	_, err = r.query.ExecContext(r.ctx, "WITH revoked AS(UPDATE naruto.voice_grants SET revoked_at=now(),revoke_reason='room_left' WHERE room_id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id,provider_identity) INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) SELECT 'voice.remove',$1,'leave:'||id::text,jsonb_build_object('roomId',$1::uuid,'identity',provider_identity) FROM revoked ON CONFLICT(deduplication_key) DO NOTHING", id, userID)

	return err

}

func (r *RoomMemberRepoImpl) ResetReady(id uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "UPDATE naruto.room_members SET ready=false WHERE room_id=$1", id)

	return err

}

func (r *ChatMessageRepoImpl) Send(roomID, userID, clientID uuid.UUID, text, hash string) (*models.ChatMessage, bool, error) {

	var id uuid.UUID
	var previous string
	err := r.query.QueryRowContext(r.ctx, "SELECT id,request_hash FROM naruto.chat_messages WHERE room_id=$1 AND sender_user_id=$2 AND client_message_id=$3", roomID, userID, clientID).Scan(&id, &previous)

	if err == nil {

		if previous != hash {

			return nil, false, internal.Reject("IDEMPOTENCY_CONFLICT", "message ID used with different text")

		}

		m, err := r.GetByID(id)

		return m, true, err

	}

	if err != sql.ErrNoRows {

		return nil, false, err

	}

	var recent int
	err = r.query.QueryRowContext(r.ctx, "SELECT count(*) FROM naruto.chat_messages WHERE sender_user_id=$1 AND created_at>now()-interval '10 seconds'", userID).Scan(&recent)

	if err != nil {

		return nil, false, err

	}

	if recent >= 5 {

		return nil, false, internal.Reject("RATE_LIMITED", "chat rate limit reached")

	}

	id = uuid.New()

	_, err = r.query.ExecContext(r.ctx, "INSERT INTO naruto.chat_messages(id,room_id,sender_user_id,sender_display_name,body,client_message_id,request_hash) SELECT $1,$2,id,display_name,$4,$5,$6 FROM naruto.users WHERE id=$3", id, roomID, userID, text, clientID, hash)

	if err != nil {

		return nil, false, err

	}

	_, err = r.query.ExecContext(r.ctx, "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) VALUES('chat.message',$1,$2,jsonb_build_object('messageId',$3::uuid))", roomID, "chat:"+id.String(), id)

	if err != nil {

		return nil, false, err

	}

	m, err := r.GetByID(id)

	return m, false, err

}

func (r *UserBlockRepoImpl) Exists(userID, target uuid.UUID) (bool, error) {

	var found bool
	err := r.query.QueryRowContext(r.ctx, "SELECT EXISTS(SELECT 1 FROM naruto.user_blocks WHERE user_id=$1 AND target_user_id=$2)", userID, target).Scan(&found)

	return found, err

}
