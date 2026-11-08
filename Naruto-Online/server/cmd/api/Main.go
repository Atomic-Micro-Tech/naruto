package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"narutoserver/internal"
	"narutoserver/routes"
	"narutoserver/server"
	"narutoserver/telemetry"
)

func main() {

	err := run()

	if err != nil {

		fmt.Fprintln(os.Stderr, err)

		os.Exit(1)
	}
}

func run() error {

	cfg, err := internal.LoadConfig(internal.DefaultConfigPath)

	if err != nil {

		return err
	}

	startupCtx, cancelStartup := context.WithTimeout(context.Background(), 15*time.Second)

	defer cancelStartup()

	err = internal.OpenConnections(startupCtx)

	if err != nil {

		return err
	}

	defer internal.CloseConnections()
	stopTelemetry := telemetry.Setup()

	defer stopTelemetry(context.Background())

	handler := routes.NewRoutes()

	httpServer, err := server.NewHttpServer(cfg.HTTP, handler)

	if err != nil {

		return err
	}

	signalCtx, stopSignal := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	defer stopSignal()

	go func() {

		<-signalCtx.Done()
		shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)

		defer cancelShutdown()

		httpServer.Shutdown(shutdownCtx)
	}()

	return httpServer.Start()
}
