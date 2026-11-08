package repo

import (
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/models"
	"time"
)

func (r *RealtimeConnectionRepoImpl) Connect(sessionID uuid.UUID) (*models.RealtimeConnection, error) {

	var value *models.RealtimeConnection
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var userID uuid.UUID
		err := tx.QueryRowContext(r.ctx, "SELECT user_id FROM naruto.sessions WHERE id=$1", sessionID).Scan(&userID)

		if err != nil {

			return err
		}

		var epoch int64
		err = tx.QueryRowContext(r.ctx, "UPDATE naruto.users SET session_epoch=session_epoch+1 WHERE id=$1 AND status='active' RETURNING session_epoch", userID).Scan(&epoch)

		if err != nil {

			return err
		}

		var valid uuid.UUID
		err = tx.QueryRowContext(r.ctx, "SELECT id FROM naruto.sessions WHERE id=$1 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE", sessionID).Scan(&valid)

		if err == sql.ErrNoRows {

			return internal.Reject("UNAUTHENTICATED", "session expired")
		}

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.realtime_connections SET disconnected_at=now(),disconnect_reason='replaced' WHERE user_id=$1 AND disconnected_at IS NULL", userID)

		if err != nil {

			return err
		}

		id := uuid.New()

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.realtime_connections(id,user_id,session_id,session_epoch) VALUES($1,$2,$3,$4)", id, userID, sessionID, epoch)

		if err != nil {

			return err
		}

		rr, err := NewRealtimeConnectionRepoTx(r.ctx, tx)

		if err != nil {

			return err
		}

		value, err = rr.GetByID(id)

		if err != nil {

			return err
		}

		var roomID uuid.UUID
		err = tx.QueryRowContext(r.ctx, "SELECT r.id FROM naruto.rooms r JOIN naruto.room_members m ON m.room_id=r.id WHERE m.user_id=$1 FOR UPDATE OF r", userID).Scan(&roomID)

		if err == sql.ErrNoRows {

			return nil
		}

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.room_members SET connection_status='connected',reconnect_deadline_at=NULL WHERE user_id=$1", userID)

		if err != nil {

			return err
		}

		return changeRoom(tx, r.ctx, roomID)
	})

	return value, err
}

func (r *RealtimeConnectionRepoImpl) Alive(id uuid.UUID) (bool, error) {

	var ok bool
	err := r.query.QueryRowContext(r.ctx, "SELECT EXISTS(SELECT 1 FROM naruto.realtime_connections c JOIN naruto.sessions s ON s.id=c.session_id JOIN naruto.users u ON u.id=c.user_id WHERE c.id=$1 AND c.disconnected_at IS NULL AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' AND u.session_epoch=c.session_epoch)", id).Scan(&ok)

	return ok, err
}

func (r *RealtimeConnectionRepoImpl) Heartbeat(id uuid.UUID) error {

	_, err := r.query.ExecContext(r.ctx, "UPDATE naruto.realtime_connections SET last_heartbeat_at=now() WHERE id=$1 AND disconnected_at IS NULL", id)

	return err
}

func (r *RealtimeConnectionRepoImpl) Disconnect(id uuid.UUID) error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		var userID uuid.UUID
		err := tx.QueryRowContext(r.ctx, "UPDATE naruto.realtime_connections SET disconnected_at=now(),disconnect_reason='disconnected' WHERE id=$1 AND disconnected_at IS NULL RETURNING user_id", id).Scan(&userID)

		if err == sql.ErrNoRows {

			return nil
		}

		if err != nil {

			return err
		}

		var roomID uuid.UUID
		err = tx.QueryRowContext(r.ctx, "SELECT r.id FROM naruto.rooms r JOIN naruto.room_members m ON m.room_id=r.id WHERE m.user_id=$1 FOR UPDATE OF r", userID).Scan(&roomID)

		if err == sql.ErrNoRows {

			return nil
		}

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.room_members SET ready=false,connection_status='reconnecting',reconnect_deadline_at=now()+interval '30 seconds' WHERE user_id=$1 AND NOT EXISTS(SELECT 1 FROM naruto.realtime_connections WHERE user_id=$1 AND disconnected_at IS NULL)", userID)

		if err != nil {

			return err
		}

		return changeRoom(tx, r.ctx, roomID)
	})
}

func (r *RealtimeConnectionRepoImpl) RecoverStale() error {

	rows, err := listRows[models.RealtimeConnection](r.repository, "realtime_connections", "WHERE disconnected_at IS NULL AND last_heartbeat_at<$1", time.Now().Add(-15*time.Second))

	if err != nil {

		return err
	}

	for _, row := range rows {

		err = r.Disconnect(row.ID)

		if err != nil {

			return err
		}
	}

	return nil
}

func (r *RoomRepoImpl) ExpireWaiting() error {

	return WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		rows, err := tx.QueryContext(r.ctx, "SELECT id FROM naruto.rooms WHERE status='waiting' AND EXISTS(SELECT 1 FROM naruto.room_members m WHERE m.room_id=rooms.id AND reconnect_deadline_at<=now()) FOR UPDATE SKIP LOCKED")

		if err != nil {

			return err
		}

		ids := []uuid.UUID{}
		for rows.Next() {

			var id uuid.UUID
			err = rows.Scan(&id)

			if err != nil {

				rows.Close()

				return err
			}

			ids = append(ids, id)
		}

		err = rows.Err()

		rows.Close()

		if err != nil {

			return err
		}

		for _, id := range ids {

			members, err := NewRoomMemberRepoTx(r.ctx, tx)

			if err != nil {

				return err
			}

			roster, err := members.List(id)

			if err != nil {

				return err
			}

			rooms, err := NewRoomRepoTx(r.ctx, tx)

			if err != nil {

				return err
			}

			for _, member := range roster {

				if member.ReconnectDeadlineAt != nil && !member.ReconnectDeadlineAt.After(time.Now()) && member.ConnectionStatus != "connected" {

					err = rooms.RemoveMember(id, member.UserID)

					if err != nil {

						return err
					}
				}
			}

			err = changeRoom(tx, r.ctx, id)

			if err != nil {

				return err
			}
		}

		return nil
	})
}
