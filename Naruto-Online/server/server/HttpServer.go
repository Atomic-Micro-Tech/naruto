package server

import (
	"context"
	"errors"
	"net/http"
	"time"

	"narutoserver/internal"
)

type HttpServer struct {
	server *http.Server
}

func NewHttpServer(cfg internal.HTTPConfig, handler http.Handler) (*HttpServer, error) {

	if handler == nil || cfg.ListenAddress == "" {

		return nil, errors.New("invalid HTTP server configuration")
	}

	result := &HttpServer{server: &http.Server{
		Addr:              cfg.ListenAddress,
		Handler:           handler,
		ReadHeaderTimeout: time.Duration(cfg.ReadHeaderTimeoutSeconds) * time.Second,
		ReadTimeout:       time.Duration(cfg.ReadTimeoutSeconds) * time.Second,
		WriteTimeout:      time.Duration(cfg.WriteTimeoutSeconds) * time.Second,
		IdleTimeout:       time.Duration(cfg.IdleTimeoutSeconds) * time.Second,
		MaxHeaderBytes:    16 << 10,
	}}

	return result, nil
}

func (s *HttpServer) Start() error {

	err := s.server.ListenAndServe()

	if errors.Is(err, http.ErrServerClosed) {

		return nil
	}

	return err
}

func (s *HttpServer) Shutdown(ctx context.Context) error {

	return s.server.Shutdown(ctx)
}
