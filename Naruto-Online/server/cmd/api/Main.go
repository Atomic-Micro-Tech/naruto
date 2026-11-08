package main

import (
	"context"
	"fmt"
	"narutoserver/internal/auth"
	"narutoserver/internal/game"
	"narutoserver/realtime"
	"narutoserver/usecase"
	"narutoserver/worker"
	"os"
	"os/signal"
	"sync"
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

	configPath := os.Getenv(internal.ConfigEnvironmentVariable)

	if configPath == "" {

		configPath = internal.DefaultConfigPath
	}

	cfg, err := internal.LoadConfig(configPath)

	if err != nil {

		return err

	}

	_, err = auth.Key()

	if err != nil {

		return err

	}

	err = game.Prepare()

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

	health, err := usecase.NewSystemUseCase(startupCtx)

	if err != nil {

		return err

	}

	_, err = health.GetReadiness(internal.ParamGetReadiness{})

	if err != nil {

		return err

	}

	stopTelemetry := telemetry.Setup()

	defer stopTelemetry(context.Background())

	handler := routes.NewRoutes()

	httpServer, err := server.NewHttpServer(cfg.HTTP, handler)

	if err != nil {

		return err

	}

	signalCtx, stopSignal := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	defer stopSignal()

	workerCtx, stopWorkers := context.WithCancel(signalCtx)

	var wg sync.WaitGroup
	wg.Add(3)

	go func() {

		defer wg.Done()

		worker.RunMatches(workerCtx, advanceMatches)

	}()

	go func() {

		defer wg.Done()

		worker.Run(workerCtx, realtime.Dispatch)

	}()

	go func() {

		defer wg.Done()

		realtime.Maintain(workerCtx)

	}()

	defer func() {

		stopWorkers()

		realtime.Close()

		wg.Wait()

	}()

	shutdownDone := make(chan error, 1)

	go func() {

		<-signalCtx.Done()

		realtime.Close()

		shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)

		defer cancelShutdown()

		shutdownErr := httpServer.Shutdown(shutdownCtx)

		wsErr := realtime.Wait(shutdownCtx)

		if shutdownErr != nil {

			shutdownDone <- shutdownErr
			return

		}

		shutdownDone <- wsErr

	}()

	err = httpServer.Start()

	if err != nil {

		return err

	}

	return <-shutdownDone

}

func advanceMatches(ctx context.Context) error {

	service, err := usecase.NewMatchUseCase(ctx)

	if err != nil {

		return err
	}

	_, err = service.AdvanceMatches(internal.ParamAdvanceMatches{})

	return err

}
