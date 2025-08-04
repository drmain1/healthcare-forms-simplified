package main

import (
    "context"
    "fmt"
    "log"
    "time"
    "cloud.google.com/go/firestore"
)

func main() {
    ctx := context.Background()
    client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
    if err != nil {
        log.Fatalf("Failed: %v", err)
    }
    defer client.Close()

    // Create organization for b7vcMggxZFbzJT8x8X76TZ7q3CO2
    orgID := "b7vcMggxZFbzJT8x8X76TZ7q3CO2"
    
    // Check if it already exists
    _, err = client.Collection("organizations").Doc(orgID).Get(ctx)
    if err == nil {
        fmt.Printf("Organization %s already exists\n", orgID)
        return
    }

    // Create the organization document
    orgData := map[string]interface{}{
        "name": "David Main's Organization",
        "email": "dtmain@gmail.com",
        "uid": orgID,
        "createdAt": time.Now(),
        "updatedAt": time.Now(),
    }

    _, err = client.Collection("organizations").Doc(orgID).Set(ctx, orgData)
    if err != nil {
        log.Fatalf("Failed to create organization: %v", err)
    }

    fmt.Printf("Successfully created organization %s\n", orgID)
    fmt.Println("You should now be able to see your form submissions in the dashboard!")
}