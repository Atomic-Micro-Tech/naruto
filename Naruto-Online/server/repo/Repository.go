package repo

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"narutoserver/internal"
)

type executor interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)

	QueryContext(context.Context, string, ...any) (*sql.Rows, error)

	QueryRowContext(context.Context, string, ...any) *sql.Row
}

type repository struct {
	ctx   context.Context
	query executor
}

func newRepository(ctx context.Context) (*repository, error) {

	if ctx == nil {

		return nil, errors.New("context required")
	}

	err := ctx.Err()

	if err != nil {

		return nil, err
	}

	db, err := internal.GetPostgreSQL()

	if err != nil {

		return nil, err
	}

	return &repository{ctx: ctx, query: db}, nil
}

func newRepositoryTx(ctx context.Context, tx *sql.Tx) (*repository, error) {

	if ctx == nil || tx == nil {

		return nil, errors.New("context and transaction required")
	}

	return &repository{ctx: ctx, query: tx}, nil
}

func WithinTransaction(ctx context.Context, fn func(*sql.Tx) error) error {

	db, err := internal.GetPostgreSQL()

	if err != nil {

		return err
	}

	tx, err := db.BeginTx(ctx, nil)

	if err != nil {

		return err
	}

	defer tx.Rollback()

	err = fn(tx)

	if err != nil {

		return err
	}

	return tx.Commit()
}

func translate(err error) error {

	if err == nil {

		return nil
	}

	if errors.Is(err, sql.ErrNoRows) {

		return internal.Reject("NOT_FOUND", "resource not found")
	}

	var pg *pgconn.PgError
	if errors.As(err, &pg) {

		if pg.Code == "23505" {

			if pg.ConstraintName == "users_email_key" {

				return internal.Reject("EMAIL_IN_USE", "email already registered")
			}

			return internal.Reject("CONFLICT", "resource already exists")
		}

		if pg.Code == "23503" || pg.Code == "23514" {

			return internal.Reject("INVALID_INPUT", "invalid resource or state")
		}
	}

	return err
}

func columns(value any) ([]string, []any) {

	row := reflect.ValueOf(value).Elem()

	typ := row.Type()

	names := []string{}
	dest := []any{}
	for i := 0; i < row.NumField(); i++ {

		name := typ.Field(i).Tag.Get("db")

		if name != "" {

			names = append(names, name)

			address := row.Field(i).Addr().Interface()

			message, ok := address.(*json.RawMessage)

			if ok {

				address = &jsonColumn{target: message}
			}

			dest = append(dest, address)
		}
	}

	return names, dest
}

type jsonColumn struct{ target *json.RawMessage }

func (c *jsonColumn) Scan(value any) error {

	switch data := value.(type) {

	case nil:
		*c.target = nil
	case []byte:
		*c.target = append(json.RawMessage(nil), data...)

	case string:
		*c.target = json.RawMessage(data)

	default:
		return fmt.Errorf("unsupported JSON column type %T", value)
	}

	return nil
}

func getRow[T any](r *repository, table string, keys []string, args ...any) (*T, error) {

	value := new(T)

	names, dest := columns(value)

	where := []string{}
	for i, key := range keys {

		where = append(where, fmt.Sprintf("%s=$%d", key, i+1))
	}

	err := r.query.QueryRowContext(r.ctx, "SELECT "+strings.Join(names, ",")+" FROM naruto."+table+" WHERE "+strings.Join(where, " AND "), args...).Scan(dest...)

	if err != nil {

		return nil, translate(err)
	}

	return value, nil
}

func createRow(r *repository, table string, value any, identity string) error {

	names, _ := columns(value)

	row := reflect.ValueOf(value).Elem()

	fields := []string{}
	marks := []string{}
	args := []any{}
	for i, name := range names {

		if name == identity {

			continue
		}

		fields = append(fields, name)

		args = append(args, row.Field(i).Interface())

		marks = append(marks, fmt.Sprintf("$%d", len(args)))
	}

	_, err := r.query.ExecContext(r.ctx, "INSERT INTO naruto."+table+" ("+strings.Join(fields, ",")+") VALUES ("+strings.Join(marks, ",")+")", args...)

	return translate(err)
}

func updateRow(r *repository, table string, value any, keys []string, identity string) error {

	names, _ := columns(value)

	row := reflect.ValueOf(value).Elem()

	sets := []string{}
	where := []string{}
	args := []any{}
	for i, name := range names {

		isKey := false
		for _, key := range keys {

			if name == key {

				isKey = true
			}
		}

		if isKey || name == identity {

			continue
		}

		args = append(args, row.Field(i).Interface())

		sets = append(sets, fmt.Sprintf("%s=$%d", name, len(args)))
	}

	for _, key := range keys {

		for i, name := range names {

			if name == key {

				args = append(args, row.Field(i).Interface())

				where = append(where, fmt.Sprintf("%s=$%d", key, len(args)))
			}
		}
	}

	result, err := r.query.ExecContext(r.ctx, "UPDATE naruto."+table+" SET "+strings.Join(sets, ",")+" WHERE "+strings.Join(where, " AND "), args...)

	if err != nil {

		return translate(err)
	}

	n, err := result.RowsAffected()

	if err != nil {

		return err
	}

	if n == 0 {

		return internal.Reject("NOT_FOUND", "resource not found")
	}

	return nil
}

func deleteRow(r *repository, table string, keys []string, args ...any) error {

	where := []string{}
	for i, key := range keys {

		where = append(where, fmt.Sprintf("%s=$%d", key, i+1))
	}

	_, err := r.query.ExecContext(r.ctx, "DELETE FROM naruto."+table+" WHERE "+strings.Join(where, " AND "), args...)

	return translate(err)
}
