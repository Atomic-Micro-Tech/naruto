package internal

type RequestGetHealth struct{}
type ParamGetHealth struct{}
type DataGetHealth struct {
	Status string `json:"status"`
}

type RequestGetReadiness struct{}
type ParamGetReadiness struct{}
type DataGetReadiness struct {
	Status string `json:"status"`
}

type SystemUseCase interface {
	GetHealth(param ParamGetHealth) (*DataGetHealth, error)
	GetReadiness(param ParamGetReadiness) (*DataGetReadiness, error)
}
