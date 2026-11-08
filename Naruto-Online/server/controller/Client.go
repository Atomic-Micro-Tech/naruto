package controller

import (
	"narutoserver/internal"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func HandleGameAssets(writer http.ResponseWriter, request *http.Request) {

	// Serve the canonical asset library; the frontend never copies it into its bundle.
	writer.Header().Set("X-Content-Type-Options", "nosniff")

	writer.Header().Set("Cache-Control", "public, max-age=3600")

	http.StripPrefix("/assets/", http.FileServer(http.Dir(internal.GameAssetsDirectory))).ServeHTTP(writer, request)

}

func HandleGameClient(writer http.ResponseWriter, request *http.Request) {

	path := request.URL.Path
	if path == "/" || path == "/verify_email" || path == "/reset_password" {

		http.ServeFile(writer, request, filepath.Join(internal.GameClientDirectory, "index.html"))

		return

	}

	// Only built frontend files are public. Unknown API paths remain a 404.
	if strings.HasPrefix(path, "/v1/") {

		http.NotFound(writer, request)

		return

	}

	_, err := os.Stat(filepath.Join(internal.GameClientDirectory, filepath.Clean("/"+path)))

	if err != nil {

		http.NotFound(writer, request)

		return
	}

	http.FileServer(http.Dir(internal.GameClientDirectory)).ServeHTTP(writer, request)

}
