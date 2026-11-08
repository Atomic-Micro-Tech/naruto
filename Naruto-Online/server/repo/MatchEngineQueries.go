package repo

import "github.com/google/uuid"
import "narutoserver/models"

// Every writer locks room before match, including CPU and controller changes.
func (r *MatchRepoImpl) Lock(id uuid.UUID) (*models.Match, error) {

	var roomID uuid.UUID
	err := r.query.QueryRowContext(r.ctx, "SELECT room_id FROM naruto.matches WHERE id=$1", id).Scan(&roomID)

	if err != nil {

		return nil, translate(err)
	}

	err = r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.rooms WHERE id=$1 FOR UPDATE", roomID).Scan(&roomID)

	if err != nil {

		return nil, translate(err)
	}

	err = r.query.QueryRowContext(r.ctx, "SELECT id FROM naruto.matches WHERE id=$1 FOR UPDATE", id).Scan(&id)

	if err != nil {

		return nil, translate(err)
	}

	return r.GetByID(id)

}

func (r *MatchRepoImpl) RunningIDs() ([]uuid.UUID, error) {

	rows, err := r.query.QueryContext(r.ctx, "SELECT id FROM naruto.matches WHERE status='running' ORDER BY updated_at LIMIT 100")

	if err != nil {

		return nil, err
	}

	defer rows.Close()

	result := []uuid.UUID{}
	for rows.Next() {

		var id uuid.UUID
		err = rows.Scan(&id)

		if err != nil {

			return nil, err
		}

		result = append(result, id)
	}

	return result, rows.Err()

}

func (r *RealtimeConnectionRepoImpl) UserConnected(userID uuid.UUID) (bool, error) {

	var connected bool
	err := r.query.QueryRowContext(r.ctx, `SELECT EXISTS(SELECT 1 FROM naruto.realtime_connections c
 JOIN naruto.sessions s ON s.id=c.session_id JOIN naruto.users u ON u.id=c.user_id
 WHERE c.user_id=$1 AND c.disconnected_at IS NULL AND c.last_heartbeat_at>now()-interval '15 seconds'
 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' AND u.session_epoch=c.session_epoch)`, userID).Scan(&connected)

	return connected, err

}
