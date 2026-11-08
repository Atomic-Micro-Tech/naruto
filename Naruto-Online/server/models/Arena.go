package models

import (
	"time"
)

// Arena maps naruto.arenas. The database remains the source of constraints and defaults.
type Arena struct {
	ID                string    `db:"id" json:"-"`
	MapID             int16     `db:"map_id" json:"-"`
	Name              string    `db:"name" json:"-"`
	Enabled           bool      `db:"enabled" json:"-"`
	TileCount         int16     `db:"tile_count" json:"-"`
	WorldWidth        int32     `db:"world_width" json:"-"`
	WorldHeight       int32     `db:"world_height" json:"-"`
	ThumbnailPath     string    `db:"thumbnail_path" json:"-"`
	BoardDataPath     string    `db:"board_data_path" json:"-"`
	AssetManifestPath string    `db:"asset_manifest_path" json:"-"`
	RulesHash         string    `db:"rules_hash" json:"-"`
	AIRulesHash       string    `db:"ai_rules_hash" json:"-"`
	BoardDataHash     string    `db:"board_data_hash" json:"-"`
	AssetManifestHash string    `db:"asset_manifest_hash" json:"-"`
	CreatedAt         time.Time `db:"created_at" json:"-"`
	UpdatedAt         time.Time `db:"updated_at" json:"-"`
}

// ArenaRepo is the data-access contract for naruto.arenas.
type ArenaRepo interface {
	GetByID(id string) (*Arena, error)
	Create(value *Arena) error
	Update(value *Arena) error
}

// NewArena constructs a row value for scanning or persistence.
func NewArena() *Arena {

	return &Arena{}
}

func (m *Arena) GetID() string {

	return m.ID
}

func (m *Arena) SetID(value string) {

	m.ID = value
}

func (m *Arena) GetMapID() int16 {

	return m.MapID
}

func (m *Arena) SetMapID(value int16) {

	m.MapID = value
}

func (m *Arena) GetName() string {

	return m.Name
}

func (m *Arena) SetName(value string) {

	m.Name = value
}

func (m *Arena) GetEnabled() bool {

	return m.Enabled
}

func (m *Arena) SetEnabled(value bool) {

	m.Enabled = value
}

func (m *Arena) GetTileCount() int16 {

	return m.TileCount
}

func (m *Arena) SetTileCount(value int16) {

	m.TileCount = value
}

func (m *Arena) GetWorldWidth() int32 {

	return m.WorldWidth
}

func (m *Arena) SetWorldWidth(value int32) {

	m.WorldWidth = value
}

func (m *Arena) GetWorldHeight() int32 {

	return m.WorldHeight
}

func (m *Arena) SetWorldHeight(value int32) {

	m.WorldHeight = value
}

func (m *Arena) GetThumbnailPath() string {

	return m.ThumbnailPath
}

func (m *Arena) SetThumbnailPath(value string) {

	m.ThumbnailPath = value
}

func (m *Arena) GetBoardDataPath() string {

	return m.BoardDataPath
}

func (m *Arena) SetBoardDataPath(value string) {

	m.BoardDataPath = value
}

func (m *Arena) GetAssetManifestPath() string {

	return m.AssetManifestPath
}

func (m *Arena) SetAssetManifestPath(value string) {

	m.AssetManifestPath = value
}

func (m *Arena) GetRulesHash() string {

	return m.RulesHash
}

func (m *Arena) SetRulesHash(value string) {

	m.RulesHash = value
}

func (m *Arena) GetAIRulesHash() string {

	return m.AIRulesHash
}

func (m *Arena) SetAIRulesHash(value string) {

	m.AIRulesHash = value
}

func (m *Arena) GetBoardDataHash() string {

	return m.BoardDataHash
}

func (m *Arena) SetBoardDataHash(value string) {

	m.BoardDataHash = value
}

func (m *Arena) GetAssetManifestHash() string {

	return m.AssetManifestHash
}

func (m *Arena) SetAssetManifestHash(value string) {

	m.AssetManifestHash = value
}

func (m *Arena) GetCreatedAt() time.Time {

	return m.CreatedAt
}

func (m *Arena) SetCreatedAt(value time.Time) {

	m.CreatedAt = value
}

func (m *Arena) GetUpdatedAt() time.Time {

	return m.UpdatedAt
}

func (m *Arena) SetUpdatedAt(value time.Time) {

	m.UpdatedAt = value
}
