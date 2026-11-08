package repo

import (
	"database/sql"
	"narutoserver/models"
)

func (r *OutboxEventRepoImpl) Deliver(id int64, send func(*models.OutboxEvent) error) (bool, error) {

	delivered := false
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		row := new(models.OutboxEvent)

		names, dest := columns(row)

		_ = names
		err := tx.QueryRowContext(r.ctx, "SELECT id,topic,aggregate_id,deduplication_key,payload,created_at,available_at,attempts,delivered_at,last_error FROM naruto.outbox_events WHERE ($1::bigint=0 OR id=$1) AND delivered_at IS NULL AND available_at<=now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1", id).Scan(dest...)

		if err == sql.ErrNoRows {

			return nil
		}

		if err != nil {

			return err
		}

		deliveryErr := send(row)

		if deliveryErr != nil {

			_, err = tx.ExecContext(r.ctx, "UPDATE naruto.outbox_events SET attempts=attempts+1,last_error='delivery failed',available_at=now()+interval '30 seconds' WHERE id=$1", row.ID)

			return err
		}

		_, err = tx.ExecContext(r.ctx, "UPDATE naruto.outbox_events SET attempts=attempts+1,delivered_at=now(),last_error=NULL WHERE id=$1", row.ID)

		delivered = err == nil
		return err
	})

	return delivered, err
}
