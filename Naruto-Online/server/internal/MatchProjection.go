package internal

type PublicMatchPhase string

type PublicControllerKind string

type PublicControllerState struct {
	Seat             int64                `json:"seat"`
	UserID           string               `json:"userId"`
	ParticipantKind  string               `json:"participantKind"`
	ControllerKind   PublicControllerKind `json:"controllerKind"`
	ControlEpoch     int64                `json:"controlEpoch"`
	ConnectionStatus string               `json:"connectionStatus"`
	Reason           *string              `json:"reason"`
	ReclaimPending   bool                 `json:"reclaimPending"`
}

type PublicPlayerState struct {
	UserID         string                `json:"userId"`
	Seat           int64                 `json:"seat"`
	DisplayName    string                `json:"displayName"`
	CharacterID    int64                 `json:"characterId"`
	Position       int64                 `json:"position"`
	Direction      *int64                `json:"direction"`
	Chakra         int64                 `json:"chakra"`
	SkillPoints    int64                 `json:"skillPoints"`
	Eliminated     bool                  `json:"eliminated"`
	Possessed      bool                  `json:"possessed"`
	SkipNextTurn   bool                  `json:"skipNextTurn"`
	HasScroll      bool                  `json:"hasScroll"`
	CrystalTileIDs []int64               `json:"crystalTileIds"`
	InventoryCount int64                 `json:"inventoryCount"`
	Controller     PublicControllerState `json:"controller"`
}

type PublicTileState struct {
	Id            int64    `json:"id"`
	TypeCode      int64    `json:"typeCode"`
	OwnerSeat     *int64   `json:"ownerSeat"`
	Level         int64    `json:"level"`
	Hp            int64    `json:"hp"`
	EffectID      int64    `json:"effectId"`
	RepairCounter int64    `json:"repairCounter"`
	X             int64    `json:"x"`
	Y             int64    `json:"y"`
	Neighbors     []*int64 `json:"neighbors"`
	PurchasePrice int64    `json:"purchasePrice"`
	UpgradeBase   int64    `json:"upgradeBase"`
	Rents         []int64  `json:"rents"`
}

type PublicHeldCard struct {
	Slot   int64 `json:"slot"`
	CardID int64 `json:"cardId"`
}

type PublicSelfState struct {
	Seat      int64            `json:"seat"`
	Cards     []PublicHeldCard `json:"cards"`
	CardUsed  bool             `json:"cardUsed"`
	JutsuUsed bool             `json:"jutsuUsed"`
}

type PublicRouletteState struct {
	Id                  string  `json:"id"`
	ActorSeat           int64   `json:"actorSeat"`
	Kind                string  `json:"kind"`
	Phase               string  `json:"phase"`
	Faces               []int64 `json:"faces"`
	Angle               int64   `json:"angle"`
	StartedAtTick       int64   `json:"startedAtTick"`
	StopRequestedAtTick *int64  `json:"stopRequestedAtTick"`
	Result              *int64  `json:"result"`
}

type PublicAllowedOption struct {
	Id             string `json:"id"`
	Label          string `json:"label"`
	Enabled        bool   `json:"enabled"`
	TargetSeat     *int64 `json:"targetSeat,omitempty"`
	TileID         *int64 `json:"tileId,omitempty"`
	CardSlot       *int64 `json:"cardSlot,omitempty"`
	CardID         *int64 `json:"cardId,omitempty"`
	TechniqueIndex *int64 `json:"techniqueIndex,omitempty"`
	ChakraCost     *int64 `json:"chakraCost,omitempty"`
	SkillPointCost *int64 `json:"skillPointCost,omitempty"`
}

type PublicAllowedAction struct {
	Type      string                `json:"type"`
	ChoiceID  *string               `json:"choiceId"`
	Options   []PublicAllowedOption `json:"options"`
	ExpiresAt *string               `json:"expiresAt"`
}

type PublicResultEntry struct {
	Seat        int64 `json:"seat"`
	CharacterID int64 `json:"characterId"`
	Chakra      int64 `json:"chakra"`
	BadgeID     int64 `json:"badgeId"`
}

type PublicMatchResult struct {
	Reason      string              `json:"reason"`
	WinnerSeat  *int64              `json:"winnerSeat"`
	Entries     []PublicResultEntry `json:"entries"`
	EndedAt     string              `json:"endedAt"`
	Description string              `json:"description"`
}

type PublicSha256 string

type PublicMatchSnapshot struct {
	Presentation      *PublicMatchPresentation `json:"presentation,omitempty"`
	Id                string                   `json:"id"`
	RoomID            string                   `json:"roomId"`
	ArenaID           string                   `json:"arenaId"`
	Status            string                   `json:"status"`
	Phase             PublicMatchPhase         `json:"phase"`
	StateVersion      int64                    `json:"stateVersion"`
	EventSequence     int64                    `json:"eventSequence"`
	ServerTick        int64                    `json:"serverTick"`
	TurnSeat          int64                    `json:"turnSeat"`
	Round             int64                    `json:"round"`
	TargetChakra      int64                    `json:"targetChakra"`
	Players           []PublicPlayerState      `json:"players"`
	Tiles             []PublicTileState        `json:"tiles"`
	Self              PublicSelfState          `json:"self"`
	Roulette          *PublicRouletteState     `json:"roulette"`
	AllowedActions    []PublicAllowedAction    `json:"allowedActions"`
	Result            *PublicMatchResult       `json:"result"`
	RulesHash         PublicSha256             `json:"rulesHash"`
	AiRulesHash       PublicSha256             `json:"aiRulesHash"`
	AiPolicyVersion   string                   `json:"aiPolicyVersion"`
	AssetManifestHash PublicSha256             `json:"assetManifestHash"`
}

type PublicMatchPresentation struct {
	Phase        string              `json:"phase"`
	ActorSeat    int16               `json:"actorSeat"`
	Remaining    int16               `json:"remaining"`
	LastRoll     int16               `json:"lastRoll"`
	Message      string              `json:"message"`
	Log          []string            `json:"log"`
	Chance       *PublicChanceOffer  `json:"chance,omitempty"`
	ChanceResult *PublicChanceResult `json:"chanceResult,omitempty"`
}

type PublicChanceCard struct {
	Slot   int16  `json:"slot"`
	CardID *int64 `json:"cardId,omitempty"`
}

type PublicChanceOffer struct {
	ChoiceID  string             `json:"choiceId"`
	ActorSeat int16              `json:"actorSeat"`
	FaceUp    bool               `json:"faceUp"`
	Cards     []PublicChanceCard `json:"cards"`
}

type PublicChanceResult struct {
	ActorSeat int16 `json:"actorSeat"`
	Slot      int16 `json:"slot"`
	CardID    int64 `json:"cardId"`
}
