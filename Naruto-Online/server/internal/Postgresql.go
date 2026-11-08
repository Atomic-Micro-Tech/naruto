package internal

// PostgreSQLConfig names the environment variable holding the connection URL.
type PostgreSQLConfig struct {
	URLEnvironmentVariable string `json:"url_environment_variable"`
	ConnectTimeoutSeconds  int    `json:"connect_timeout_seconds"`
}
