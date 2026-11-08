package internal

import "errors"

var (
	ErrConfigNotLoaded = errors.New("configuration not loaded")

	ErrConnectionNotOpen = errors.New("database connection not open")
)
