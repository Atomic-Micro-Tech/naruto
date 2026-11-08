package internal

type RequestListArenas struct{}
type ParamListArenas struct{}
type DataListArenas struct {
	Items []ArenaData `json:"items"`
}

type ArenaUseCase interface {
	ListArenas(param ParamListArenas) (*DataListArenas, error)
}
