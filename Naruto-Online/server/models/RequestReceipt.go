package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// RequestReceipt maps naruto.request_receipts. The database remains the source of constraints and defaults.
type RequestReceipt struct {
	UserID             uuid.UUID       `db:"user_id" json:"-"`
	Transport          string          `db:"transport" json:"-"`
	Operation          string          `db:"operation" json:"-"`
	RequestID          uuid.UUID       `db:"request_id" json:"-"`
	RequestHash        string          `db:"request_hash" json:"-"`
	HTTPStatus         *int16          `db:"http_status" json:"-"`
	Response           json.RawMessage `db:"response" json:"-"`
	ResponseCiphertext []byte          `db:"response_ciphertext" json:"-"`
	ResponseKeyID      *string         `db:"response_key_id" json:"-"`
	CreatedAt          time.Time       `db:"created_at" json:"-"`
	ExpiresAt          *time.Time      `db:"expires_at" json:"-"`
}

// RequestReceiptRepo is the data-access contract for naruto.request_receipts.
type RequestReceiptRepo interface {
	GetByKey(userID uuid.UUID, transport string, operation string, requestID uuid.UUID) (*RequestReceipt, error)
	Create(value *RequestReceipt) error
}

// NewRequestReceipt constructs a row value for scanning or persistence.
func NewRequestReceipt() *RequestReceipt {

	return &RequestReceipt{}
}

func (m *RequestReceipt) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *RequestReceipt) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *RequestReceipt) GetTransport() string {

	return m.Transport
}

func (m *RequestReceipt) SetTransport(value string) {

	m.Transport = value
}

func (m *RequestReceipt) GetOperation() string {

	return m.Operation
}

func (m *RequestReceipt) SetOperation(value string) {

	m.Operation = value
}

func (m *RequestReceipt) GetRequestID() uuid.UUID {

	return m.RequestID
}

func (m *RequestReceipt) SetRequestID(value uuid.UUID) {

	m.RequestID = value
}

func (m *RequestReceipt) GetRequestHash() string {

	return m.RequestHash
}

func (m *RequestReceipt) SetRequestHash(value string) {

	m.RequestHash = value
}

func (m *RequestReceipt) GetHTTPStatus() *int16 {

	return m.HTTPStatus
}

func (m *RequestReceipt) SetHTTPStatus(value *int16) {

	m.HTTPStatus = value
}

func (m *RequestReceipt) GetResponse() json.RawMessage {

	return append(json.RawMessage(nil), m.Response...)
}

func (m *RequestReceipt) SetResponse(value json.RawMessage) {

	m.Response = append(json.RawMessage(nil), value...)
}

func (m *RequestReceipt) GetResponseCiphertext() []byte {

	return append([]byte(nil), m.ResponseCiphertext...)
}

func (m *RequestReceipt) SetResponseCiphertext(value []byte) {

	m.ResponseCiphertext = append([]byte(nil), value...)
}

func (m *RequestReceipt) GetResponseKeyID() *string {

	return m.ResponseKeyID
}

func (m *RequestReceipt) SetResponseKeyID(value *string) {

	m.ResponseKeyID = value
}

func (m *RequestReceipt) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *RequestReceipt) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *RequestReceipt) GetExpiresAt() *time.Time {

	return m.ExpiresAt
}

func (m *RequestReceipt) SetExpiresAt(value *time.Time) {

	m.ExpiresAt = value
}
