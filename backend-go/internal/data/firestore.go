package data

import (
	"context"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

// NewFirestoreClient creates a new Firestore client.
func NewFirestoreClient(ctx context.Context, projectID string, opts ...option.ClientOption) (*firestore.Client, error) {
	client, err := firestore.NewClient(ctx, projectID, opts...)
	if err != nil {
		return nil, err
	}
	return client, nil
}

// NewFirebaseAuthClient creates a new Firebase Auth client.
func NewFirebaseAuthClient(ctx context.Context, projectID string) (*auth.Client, *firebase.App, error) {
	conf := &firebase.Config{
		ProjectID: projectID,
	}
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		return nil, nil, err
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, nil, err
	}

	return client, app, nil
}