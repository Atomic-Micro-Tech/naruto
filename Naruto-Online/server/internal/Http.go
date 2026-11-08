package internal

// HTTPConfig describes only the HTTP section present in configs/config.json.
type HTTPConfig struct {
	ListenAddress            string `json:"listen_address"`
	ReadHeaderTimeoutSeconds int    `json:"read_header_timeout_seconds"`
	ReadTimeoutSeconds       int    `json:"read_timeout_seconds"`
	WriteTimeoutSeconds      int    `json:"write_timeout_seconds"`
	IdleTimeoutSeconds       int    `json:"idle_timeout_seconds"`
}
