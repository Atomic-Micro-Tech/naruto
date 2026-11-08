package internal

type AuthConfig struct {
	AllowedOrigins         []string `json:"allowed_origins"`
	KeyEnvironmentVariable string   `json:"key_environment_variable"`
	CookieSecure           bool     `json:"cookie_secure"`
	SessionHours           int      `json:"session_hours"`
}

type MailConfig struct {
	Address   string `json:"address"`
	From      string `json:"from"`
	PublicURL string `json:"public_url"`
}

type VoiceConfig struct {
	URL                       string `json:"url"`
	KeyEnvironmentVariable    string `json:"key_environment_variable"`
	SecretEnvironmentVariable string `json:"secret_environment_variable"`
}
