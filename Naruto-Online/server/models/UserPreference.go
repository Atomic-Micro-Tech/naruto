package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"time"
)

// UserPreference maps naruto.user_preferences. The database remains the source of constraints and defaults.
type UserPreference struct {
	UserID        uuid.UUID       `db:"user_id" json:"-"`
	Language      string          `db:"language" json:"-"`
	MusicVolume   decimal.Decimal `db:"music_volume" json:"-"`
	SFXVolume     decimal.Decimal `db:"sfx_volume" json:"-"`
	VoiceVolume   decimal.Decimal `db:"voice_volume" json:"-"`
	TouchSettings json.RawMessage `db:"touch_settings" json:"-"`
	UpdatedAt     time.Time       `db:"updated_at" json:"-"`
}

// UserPreferenceRepo is the data-access contract for naruto.user_preferences.
type UserPreferenceRepo interface {
	GetByUserID(userID uuid.UUID) (*UserPreference, error)
	Create(value *UserPreference) error
	Update(value *UserPreference) error
}

// NewUserPreference constructs a row value for scanning or persistence.
func NewUserPreference() *UserPreference {

	return &UserPreference{}
}

func (m *UserPreference) GetUserID() uuid.UUID {

	return m.UserID
}

func (m *UserPreference) SetUserID(value uuid.UUID) {

	m.UserID = value
}

func (m *UserPreference) GetLanguage() string {

	return m.Language
}

func (m *UserPreference) SetLanguage(value string) {

	m.Language = value
}

func (m *UserPreference) GetMusicVolume() decimal.Decimal {

	return m.MusicVolume
}

func (m *UserPreference) SetMusicVolume(value decimal.Decimal) {

	m.MusicVolume = value
}

func (m *UserPreference) GetSFXVolume() decimal.Decimal {

	return m.SFXVolume
}

func (m *UserPreference) SetSFXVolume(value decimal.Decimal) {

	m.SFXVolume = value
}

func (m *UserPreference) GetVoiceVolume() decimal.Decimal {

	return m.VoiceVolume
}

func (m *UserPreference) SetVoiceVolume(value decimal.Decimal) {

	m.VoiceVolume = value
}

func (m *UserPreference) GetTouchSettings() json.RawMessage {

	return append(json.RawMessage(nil), m.TouchSettings...)
}

func (m *UserPreference) SetTouchSettings(value json.RawMessage) {

	m.TouchSettings = append(json.RawMessage(nil), value...)
}

func (m *UserPreference) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *UserPreference) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
