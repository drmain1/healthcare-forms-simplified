package main

import (
    "context"
    "fmt"
    "log"
    "cloud.google.com/go/firestore"
)

func main() {
    ctx := context.Background()
    client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
    if err != nil {
        log.Fatalf("Failed: %v", err)
    }
    defer client.Close()

    // Check if b7vcMggxZFbzJT8x8X76TZ7q3CO2 exists
    orgID := "b7vcMggxZFbzJT8x8X76TZ7q3CO2"
    doc, err := client.Collection("organizations").Doc(orgID).Get(ctx)
    if err != nil {
        fmt.Printf("Organization %s NOT FOUND in organizations collection\n", orgID)
    } else {
        data := doc.Data()
        fmt.Printf("Organization %s EXISTS:\n", orgID)
        fmt.Printf("  Name: %v\n", data["name"])
        fmt.Printf("  Email: %v\n", data["email"])
    }

    // Check which form this org owns
    formDoc, err := client.Collection("forms").Doc("XDwttf31Fj8qVDfhNBLe").Get(ctx)
    if err == nil {
        data := formDoc.Data()
        fmt.Printf("\nForm XDwttf31Fj8qVDfhNBLe:\n")
        fmt.Printf("  Organization: %v\n", data["organizationId"])
        fmt.Printf("  Title: %v\n", data["title"])
        fmt.Printf("  CreatedBy: %v\n", data["createdBy"])
    }
}