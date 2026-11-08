package testcase

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"narutoserver/internal"
	"narutoserver/internal/auth"
	"narutoserver/repo"
	"narutoserver/testsupport"
	"narutoserver/usecase"
	"sync"
	"testing"
)

func fail(t *testing.T, err error) {

	t.Helper()

	if err != nil {

		var f *internal.InternalError
		if errors.As(err, &f) {

			t.Fatalf("business failure: %v", f.Cause)

		}

		t.Fatal(err)

	}

}

func expect(t *testing.T, err error, code string) {

	t.Helper()

	var input *internal.InputError
	if !errors.As(err, &input) || input.Code != code {

		t.Fatalf("expected %s, got %v", code, err)

	}

}

func account(t *testing.T, n int) (context.Context, string, string) {

	t.Helper()

	service, err := usecase.NewAuthUseCase(context.Background())

	fail(t, err)

	fixture := usecase.MockRegisterRequest
	email := uuid.NewString() + "@example.test"
	fixture.Email = email
	fixture.DisplayName = fmt.Sprintf("Test %d", n)

	registered, err := service.RegisterEmail(internal.ParamRegisterEmail(fixture))

	fail(t, err)

	if !registered.VerificationEmailSent {

		t.Fatal("SMTP not delivered")

	}

	logged, err := service.LoginEmail(internal.ParamLoginEmail{Email: email, Password: fixture.Password})

	fail(t, err)

	sessions, err := repo.NewSessionRepo(context.Background())

	fail(t, err)

	row, err := sessions.Authenticate(auth.Digest(logged.CookieToken))

	fail(t, err)

	p := internal.Principal{UserID: row.UserID, SessionID: row.ID, ExpiresAt: row.ExpiresAt, CSRFToken: logged.CSRFToken, TokenHash: row.TokenHash}
	return internal.WithPrincipal(context.Background(), p), email, logged.CookieToken

}

func TestBusinessTransactions(t *testing.T) {

	inbox := testsupport.Start(t)

	t.Run("match lifecycle", matchLifecycle)

	contexts := make([]context.Context, 4)

	emails := make([]string, 4)

	tokens := make([]string, 4)

	for i := range contexts {

		contexts[i], emails[i], tokens[i] = account(t, i)

	}

	authCase, err := usecase.NewAuthUseCase(contexts[0])

	fail(t, err)

	_, err = authCase.VerifyEmail(internal.ParamVerifyEmail{Token: inbox.Token(t, emails[0], "verify_email")})

	fail(t, err)

	_, err = authCase.VerifyEmail(internal.ParamVerifyEmail{Token: inbox.Token(t, emails[0], "verify_email")})

	expect(t, err, "INVALID_TOKEN")

	cap := int16(2)

	chakra := int32(3000)

	voice := true
	host, err := usecase.NewRoomUseCase(contexts[0])

	fail(t, err)

	request := internal.ParamCreateRoom{Name: usecase.MockRoomName, Visibility: "private", Settings: &internal.RoomSettingsInput{ArenaID: "arena-1", Capacity: &cap, TargetChakra: &chakra, Rule: "normal", VoiceEnabled: &voice}, IdempotencyKey: uuid.New()}
	created, err := host.CreateRoom(request)

	fail(t, err)

	duplicate, err := host.CreateRoom(request)

	fail(t, err)

	if duplicate.Room.ID != created.Room.ID || *duplicate.InviteCode != *created.InviteCode {

		t.Fatal("idempotency changed result")

	}

	changed := request
	changed.Name = "changed"
	_, err = host.CreateRoom(changed)

	expect(t, err, "IDEMPOTENCY_CONFLICT")

	visitor, err := usecase.NewRoomUseCase(contexts[1])

	fail(t, err)

	_, err = visitor.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	expect(t, err, "NOT_FOUND")

	results := make(chan error, 3)

	winners := make(chan int, 3)

	var wg sync.WaitGroup
	for i := 1; i < 4; i++ {

		wg.Add(1)

		go func(i int) {

			defer wg.Done()

			rooms, e := usecase.NewRoomUseCase(contexts[i])

			if e != nil {

				results <- e
				return

			}

			joined, e := rooms.JoinRoomByCode(internal.ParamJoinRoomByCode{InviteCode: *created.InviteCode, IdempotencyKey: uuid.New()})

			if e == nil {

				if joined.InviteCode != nil {

					e = errors.New("private code leaked to guest")

				} else {

					winners <- i

				}

			}

			results <- e

		}(i)

	}

	wg.Wait()

	close(results)

	success := 0
	for e := range results {

		if e == nil {

			success++

		} else {

			expect(t, e, "ROOM_FULL")

		}

	}

	if success != 1 {

		t.Fatalf("joined=%d, want exactly one free seat", success)

	}

	winner := <-winners
	rooms, err := host.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	fail(t, err)

	if len(rooms.Members) != 2 {

		t.Fatal("capacity violation")

	}

	realtimeCase, err := usecase.NewRealtimeUseCase(contexts[winner])

	fail(t, err)

	ticket, err := realtimeCase.CreateWebSocketTicket(internal.ParamCreateWebSocketTicket{Origin: "http://localhost:5173"})

	fail(t, err)

	connected, err := realtimeCase.UpgradeWebSocket(internal.ParamUpgradeWebSocket{Ticket: ticket.Ticket, Origin: "http://localhost:5173"})

	fail(t, err)

	_, err = realtimeCase.UpgradeWebSocket(internal.ParamUpgradeWebSocket{Ticket: ticket.Ticket, Origin: "http://localhost:5173"})

	expect(t, err, "UNAUTHENTICATED")

	command := internal.ParamLobbyCommand{ConnectionID: connected.ConnectionID, RequestID: uuid.New(), Type: "chat.send", RoomID: created.Room.ID, ClientMessageID: uuid.New(), Text: "hello"}
	ack, err := realtimeCase.ExecuteLobby(command)

	fail(t, err)

	if ack.Duplicate {

		t.Fatal("new message marked duplicate")

	}

	ack, err = realtimeCase.ExecuteLobby(command)

	fail(t, err)

	if !ack.Duplicate {

		t.Fatal("retry not deduplicated")

	}

	command.RequestID = uuid.New()

	command.Text = "changed"
	_, err = realtimeCase.ExecuteLobby(command)

	expect(t, err, "IDEMPOTENCY_CONFLICT")

	chat, err := usecase.NewChatUseCase(contexts[0])

	fail(t, err)

	page, err := chat.ListRoomMessages(internal.ParamListRoomMessages{RoomID: created.Room.ID, PageParam: internal.PageParam{Limit: 20}})

	fail(t, err)

	if len(page.Items) != 1 {

		t.Fatalf("chat count %d", len(page.Items))

	}

	p, _ := internal.CurrentPrincipal(contexts[winner])

	moderation, err := usecase.NewModerationUseCase(contexts[0])

	fail(t, err)

	_, err = moderation.CreateReport(internal.ParamCreateReport{RoomID: created.Room.ID, TargetUserID: p.UserID, MessageID: &page.Items[0].ID, Category: "chat_abuse", Description: "test report", IdempotencyKey: uuid.New()})

	fail(t, err)

	_, err = moderation.BlockUser(internal.ParamBlockUser{UserID: p.UserID})

	fail(t, err)

	page, err = chat.ListRoomMessages(internal.ParamListRoomMessages{RoomID: created.Room.ID, PageParam: internal.PageParam{Limit: 20}})

	fail(t, err)

	if len(page.Items) != 0 {

		t.Fatal("blocked chat visible")

	}

	_, err = moderation.UnblockUser(internal.ParamUnblockUser{UserID: p.UserID})

	fail(t, err)

	outsider := 1
	if outsider == winner {

		outsider = 2

	}

	projectionPrivacy(t, created.Room.ID, contexts[0], contexts[winner], contexts[outsider])

	hostRealtime, err := usecase.NewRealtimeUseCase(contexts[0])

	fail(t, err)

	hostTicket, err := hostRealtime.CreateWebSocketTicket(internal.ParamCreateWebSocketTicket{Origin: "http://localhost:5173"})

	fail(t, err)

	hostConnection, err := hostRealtime.UpgradeWebSocket(internal.ParamUpgradeWebSocket{Ticket: hostTicket.Ticket, Origin: "http://localhost:5173"})

	fail(t, err)

	current, err := host.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	fail(t, err)

	rotate := internal.ParamLobbyCommand{ConnectionID: hostConnection.ConnectionID, RequestID: uuid.New(), Type: "room.invite.rotate", RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion}
	rotated, err := hostRealtime.ExecuteLobby(rotate)

	fail(t, err)

	replayed, err := hostRealtime.ExecuteLobby(rotate)

	fail(t, err)

	if rotated.InviteCode == nil || replayed.InviteCode == nil || *rotated.InviteCode != *replayed.InviteCode || !replayed.Duplicate {

		t.Fatal("invite rotation replay changed private result")

	}

	_, err = visitor.JoinRoomByCode(internal.ParamJoinRoomByCode{InviteCode: *created.InviteCode, IdempotencyKey: uuid.New()})

	expect(t, err, "NOT_FOUND")

	current, err = host.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	fail(t, err)

	_, err = hostRealtime.ExecuteLobby(internal.ParamLobbyCommand{ConnectionID: hostConnection.ConnectionID, RequestID: uuid.New(), Type: "room.leave", RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion})

	fail(t, err)

	guestRooms, err := usecase.NewRoomUseCase(contexts[winner])

	fail(t, err)

	current, err = guestRooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	fail(t, err)

	if current.HostUserID != p.UserID {

		t.Fatal("host did not migrate to remaining member")

	}

	_, err = realtimeCase.ExecuteLobby(internal.ParamLobbyCommand{ConnectionID: connected.ConnectionID, RequestID: uuid.New(), Type: "room.leave", RoomID: created.Room.ID, ExpectedRoomVersion: current.RoomVersion})

	fail(t, err)

	_, err = guestRooms.GetRoom(internal.ParamGetRoom{RoomID: created.Room.ID})

	expect(t, err, "NOT_FOUND")

	refreshed, err := authCase.RefreshSession(internal.ParamRefreshSession{})

	fail(t, err)

	sessions, err := repo.NewSessionRepo(context.Background())

	fail(t, err)

	_, err = sessions.Authenticate(auth.Digest(tokens[0]))

	expect(t, err, "UNAUTHENTICATED")

	_, err = authCase.ForgotPassword(internal.ParamForgotPassword{Email: emails[0]})

	fail(t, err)

	_, err = authCase.ResetPassword(internal.ParamResetPassword{Token: inbox.Token(t, emails[0], "reset_password"), NewPassword: "Another-strong-password-123!"})

	fail(t, err)

	_, err = sessions.Authenticate(auth.Digest(refreshed.CookieToken))

	expect(t, err, "UNAUTHENTICATED")

	_, err = authCase.LoginEmail(internal.ParamLoginEmail{Email: emails[0], Password: "Another-strong-password-123!"})

	fail(t, err)

	ctx, cancel := context.WithCancel(contexts[0])

	cancel()

	cancelled, err := usecase.NewRoomUseCase(ctx)

	fail(t, err)

	data, err := cancelled.ListRooms(internal.ParamListRooms{PageParam: internal.PageParam{Limit: 20}, Status: "waiting"})

	if data != nil || !errors.Is(err, context.Canceled) {

		t.Fatalf("cancellation not propagated: %v", err)

	}

}
