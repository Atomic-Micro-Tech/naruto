package repo

import (
	"database/sql"
	"fmt"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
	"strings"
	"time"
)

func (r *MatchRepoImpl) ReadProjection(matchID, userID uuid.UUID) (*models.Match, []*models.MatchPlayer, error) {

	var match *models.Match
	var players []*models.MatchPlayer
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var id uuid.UUID
		err := tx.QueryRowContext(r.ctx, "SELECT m.id FROM naruto.matches m JOIN naruto.match_players p ON p.match_id=m.id WHERE m.id=$1 AND p.user_id=$2 FOR SHARE OF m", matchID, userID).Scan(&id)

		if err != nil {

			return translate(err)
		}

		matches, err := NewMatchRepoTx(r.ctx, tx)

		if err != nil {

			return err
		}

		match, err = matches.GetByID(id)

		if err != nil {

			return err
		}

		roster, err := NewMatchPlayerRepoTx(r.ctx, tx)

		if err != nil {

			return err
		}

		players, err = roster.List(id)

		return err
	})

	return match, players, err
}

func listRows[T any](r *repository, table, suffix string, args ...any) ([]*T, error) {

	names, _ := columns(new(T))

	rows, err := r.query.QueryContext(r.ctx, "SELECT "+strings.Join(names, ",")+" FROM naruto."+table+" "+suffix, args...)

	if err != nil {

		return nil, err
	}

	defer rows.Close()

	result := []*T{}
	for rows.Next() {

		value := new(T)

		_, dest := columns(value)

		err = rows.Scan(dest...)

		if err != nil {

			return nil, err
		}

		result = append(result, value)
	}

	return result, rows.Err()
}

func (r *ArenaRepoImpl) ListEnabled() ([]*models.Arena, error) {

	return listRows[models.Arena](r.repository, "arenas", "WHERE enabled AND id='arena-1' ORDER BY id")
}

func (r *RoomRepoImpl) Search(query, status string, open bool, limit int, at *time.Time, id *uuid.UUID) ([]*models.Room, error) {

	query = strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_").Replace(query)

	return listRows[models.Room](r.repository, "rooms", "WHERE visibility='public' AND closed_at IS NULL AND status=$1 AND name ILIKE $2 AND (NOT $3 OR (status='waiting' AND (SELECT count(*) FROM naruto.room_members m WHERE m.room_id=rooms.id)<capacity)) AND ($4::timestamptz IS NULL OR (created_at,id)<($4,$5::uuid)) ORDER BY created_at DESC,id DESC LIMIT $6", status, "%"+query+"%", open, at, id, limit)
}

func (r *RoomRepoImpl) Lock(id uuid.UUID) (*models.Room, error) {

	var result uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.rooms WHERE id=$1 AND closed_at IS NULL FOR UPDATE", id).Scan(&result)

	if err != nil {

		return nil, translate(err)
	}

	return r.GetByID(id)
}

func (r *RoomRepoImpl) FindByInvite(hash []byte) (*models.Room, error) {

	var id uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.rooms WHERE invite_code_hash=$1 AND visibility='private' AND closed_at IS NULL", hash).Scan(&id)

	if err != nil {

		return nil, translate(err)
	}

	return r.GetByID(id)
}

func (r *RoomRepoImpl) MemberExists(roomID, userID uuid.UUID) (bool, error) {

	var found bool
	err := r.query.QueryRowContext(r.ctx, "SELECT EXISTS(SELECT 1 FROM naruto.room_members m JOIN naruto.rooms r ON r.id=m.room_id WHERE m.room_id=$1 AND m.user_id=$2 AND r.closed_at IS NULL)", roomID, userID).Scan(&found)

	return found, err
}

func (r *RoomRepoImpl) IncrementVersion(id uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "UPDATE naruto.rooms SET room_version=room_version+1 WHERE id=$1", id)

	return err
}

func (r *RoomMemberRepoImpl) List(roomID uuid.UUID) ([]*models.RoomMember, error) {

	return listRows[models.RoomMember](r.repository, "room_members", "WHERE room_id=$1 ORDER BY seat", roomID)
}

func (r *RoomMemberRepoImpl) Current(userID uuid.UUID) (*models.RoomMember, error) {

	values, err := listRows[models.RoomMember](r.repository, "room_members", "WHERE user_id=$1", userID)

	if err != nil {

		return nil, err
	}

	if len(values) == 0 {

		return nil, nil
	}

	return values[0], nil
}

func (r *RoomMemberRepoImpl) Add(roomID, userID uuid.UUID, capacity, seat int16) error {

	_, err := r.query.ExecContext(r.ctx, "INSERT INTO naruto.room_members(room_id,user_id,room_capacity,seat,character_id,connection_status,reconnect_deadline_at) VALUES($1,$2,$3,$4,0,CASE WHEN EXISTS(SELECT 1 FROM naruto.realtime_connections WHERE user_id=$2 AND disconnected_at IS NULL) THEN 'connected' ELSE 'reconnecting' END,CASE WHEN EXISTS(SELECT 1 FROM naruto.realtime_connections WHERE user_id=$2 AND disconnected_at IS NULL) THEN NULL ELSE now()+interval '30 seconds' END)", roomID, userID, capacity, seat)

	return translate(err)
}

func (r *RoomRepoImpl) EnqueueChanged(roomID uuid.UUID, version int64) error {

	_, err := r.query.ExecContext(r.ctx, "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) VALUES('room.changed',$1,$2,jsonb_build_object('roomId',$1::uuid)) ON CONFLICT(deduplication_key) DO NOTHING", roomID, fmt.Sprintf("room:%s:%d", roomID, version))

	return err
}

func (r *MatchRepoImpl) ForParticipant(matchID, userID uuid.UUID) (*models.Match, error) {

	var found bool
	err := r.query.QueryRowContext(r.ctx, "SELECT EXISTS(SELECT 1 FROM naruto.match_players WHERE match_id=$1 AND user_id=$2)", matchID, userID).Scan(&found)

	if err != nil {

		return nil, err
	}

	if !found {

		return nil, internal.Reject("NOT_FOUND", "match not found")
	}

	return r.GetByID(matchID)
}

func (r *MatchPlayerRepoImpl) ByUser(matchID, userID uuid.UUID) (*models.MatchPlayer, error) {

	values, err := listRows[models.MatchPlayer](r.repository, "match_players", "WHERE match_id=$1 AND user_id=$2", matchID, userID)

	if err != nil {

		return nil, err
	}

	if len(values) == 0 {

		return nil, internal.Reject("NOT_FOUND", "participant not found")
	}

	return values[0], nil
}

func (r *MatchPlayerRepoImpl) List(matchID uuid.UUID) ([]*models.MatchPlayer, error) {

	return listRows[models.MatchPlayer](r.repository, "match_players", "WHERE match_id=$1 ORDER BY seat", matchID)
}

func noRows(err error) bool {

	return err == sql.ErrNoRows
}
