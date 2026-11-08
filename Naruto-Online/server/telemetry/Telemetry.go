package telemetry

import (
	"context"

	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// Tracer uses the exact Go module path as its instrumentation scope.
var Tracer = otel.Tracer("narutoserver")

// Setup installs a local provider. An exporter is added with deployment telemetry.
func Setup() func(context.Context) error {

	provider := sdktrace.NewTracerProvider()

	otel.SetTracerProvider(provider)

	return provider.Shutdown
}
