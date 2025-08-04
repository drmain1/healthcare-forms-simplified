package main

import (
    "context"
    "fmt"
    "log"
    "cloud.google.com/go/firestore"
    "google.golang.org/api/iterator"
)

func main() {
    ctx := context.Background()
    client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
    if err != nil {
        log.Fatalf("Failed: %v", err)
    }
    defer client.Close()

    // Check organization b7vcMggxZFbzJT8x8X76TZ7q3CO2
    orgID := "b7vcMggxZFbzJT8x8X76TZ7q3CO2"
    fmt.Printf("=== Checking Organization %s ===\n", orgID)
    
    // Check form responses for this org
    iter := client.Collection("form_responses").
        Where("organization", "==", orgID).
        OrderBy("submitted_at", firestore.Desc).
        Limit(5).
        Documents(ctx)
    
    count := 0
    for {
        doc, err := iter.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            break
        }
        
        data := doc.Data()
        count++
        fmt.Printf("\nResponse %d (ID: %s):\n", count, doc.Ref.ID)
        fmt.Printf("  Form: %v\n", data["form"])
        fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
    }
    
    fmt.Printf("\nTotal responses for org %s: %d\n", orgID, count)
    
    // Now check responses with nil organization
    fmt.Println("\n=== Checking nil organization responses ===")
    iter2 := client.Collection("form_responses").
        Where("organization", "==", nil).
        OrderBy("submitted_at", firestore.Desc).
        Limit(5).
        Documents(ctx)
    
    nilCount := 0
    for {
        doc, err := iter2.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            fmt.Printf("Error: %v\n", err)
            break
        }
        
        data := doc.Data()
        nilCount++
        fmt.Printf("\nNil Response %d (ID: %s):\n", nilCount, doc.Ref.ID)
        fmt.Printf("  Form: %v\n", data["form"])
        fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
    }
    
    fmt.Printf("\nTotal responses with nil organization: %d\n", nilCount)
}