package repo

import (
	"database/sql"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"time"
)

// Execute keeps the receipt and all mutations in the same transaction.
func (r *RequestReceiptRepoImpl) Execute(userID uuid.UUID, transport, operation string, key uuid.UUID, requestHash string, fn func(*sql.Tx) ([]byte, error)) ([]byte, bool, error) {

	var result []byte
	duplicate := false
	err := WithinTransaction(r.ctx, func(tx *sql.Tx) error {

		lockKey := userID.String() + ":" + transport + ":" + operation + ":" + key.String()

		_, err := tx.ExecContext(r.ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1,0))", lockKey)

		if err != nil {

			return err
		}

		_, err = tx.ExecContext(r.ctx, "DELETE FROM naruto.request_receipts WHERE user_id=$1 AND transport=$2 AND operation=$3 AND request_id=$4 AND expires_at<=now()", userID, transport, operation, key)

		if err != nil {

			return err
		}

		var previous string
		var cipher []byte
		err = tx.QueryRowContext(r.ctx, "SELECT request_hash,response_ciphertext FROM naruto.request_receipts WHERE user_id=$1 AND transport=$2 AND operation=$3 AND request_id=$4", userID, transport, operation, key).Scan(&previous, &cipher)

		if err == nil {

			if previous != requestHash {

				return internal.Reject("IDEMPOTENCY_CONFLICT", "request ID used with different input")
			}

			result, err = auth.Open(cipher)

			duplicate = true
			return err
		}

		if err != sql.ErrNoRows {

			return err
		}

		result, err = fn(tx)

		if err != nil {

			return err
		}

		cipher, err = auth.Seal(result)

		if err != nil {

			return err
		}

		var expires *time.Time
		var status *int
		if transport == "http" {

			deadline := time.Now().Add(24*time.Hour + time.Minute)

			expires = &deadline
			code := 200
			if operation == "createRoom" || operation == "createReport" {

				code = 201
			}

			status = &code
		}

		_, err = tx.ExecContext(r.ctx, "INSERT INTO naruto.request_receipts(user_id,transport,operation,request_id,request_hash,http_status,response_ciphertext,response_key_id,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,'app-v1',$8)", userID, transport, operation, key, requestHash, status, cipher, expires)

		return err
	})

	return result, duplicate, err
}
