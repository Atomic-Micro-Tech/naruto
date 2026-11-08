package worker

import (
	"context"
	"log/slog"
	"time"
)

func RunMatches(ctx context.Context, advance func(context.Context) error) {

	ticker := time.NewTicker(500 * time.Millisecond)

	defer ticker.Stop()

	for {

		select {

		case <-ctx.Done():
			return
		case <-ticker.C:
			err := advance(ctx)

			if err != nil && ctx.Err() == nil {

				slog.Error("match maintenance failed", "error", err)
			}

		}

	}

}
