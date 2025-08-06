package main

import (
    "context"
    "fmt"
    "log"
    "cloud.google.com/go/firestore"
    "google.golang.org/api/option"
)

func main() {
    ctx := context.Background()
    
    client, err := firestore.NewClient(ctx, "healthcare-forms-v2",
        option.WithCredentialsFile("healthcare-forms-v2-credentials.json"))
    if err != nil {
        log.Fatalf("Failed to create client: %v", err)
    }
    defer client.Close()

    // Get a few form_response documents
    docs, err := client.Collection("form_responses").Limit(3).Documents(ctx).GetAll()
    if err != nil {
        log.Fatalf("Failed to get documents: %v", err)
    }

    if len(docs) == 0 {
        fmt.Println("No documents found in form_responses collection")
        return
    }

    for _, doc := range docs {
        fmt.Printf("\n==============================\n")
        fmt.Printf("Document ID: %s\n", doc.Ref.ID)
        data := doc.Data()
        fmt.Printf("Document structure:\n")
        for key, value := range data {
            if key == "response_data" || key == "data" {
                fmt.Printf("  %s: (%T)\n", key, value)
                if m, ok := value.(map[string]interface{}); ok {
                    for k, v := range m {
                        fmt.Printf("    -> %s: %v\n", k, v)
                    }
                }
            } else {
                fmt.Printf("  %s: (%T) %v\n", key, value, value)
            }
        }
    }
}