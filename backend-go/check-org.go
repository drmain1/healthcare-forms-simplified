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
    if err \!= nil {
        log.Fatalf("Failed to create client: %v", err)
    }
    defer client.Close()

    fmt.Println("=== All Organizations ===")
    iter := client.Collection("organizations").Documents(ctx)
    orgCount := 0
    for {
        doc, err := iter.Next()
        if err == iterator.Done {
            break
        }
        if err \!= nil {
            break
        }
        
        data := doc.Data()
        orgCount++
        fmt.Printf("\nOrg ID: %s\n", doc.Ref.ID)
        fmt.Printf("  Name: %v\n", data["name"])
        fmt.Printf("  Email: %v\n", data["email"])
    }
    fmt.Printf("\nTotal organizations: %d\n", orgCount)

    fmt.Println("\n=== Latest Form (XDwttf31Fj8qVDfhNBLe) ===")
    formDoc, err := client.Collection("forms").Doc("XDwttf31Fj8qVDfhNBLe").Get(ctx)
    if err == nil {
        data := formDoc.Data()
        fmt.Printf("Organization ID: %v\n", data["organizationId"])
        fmt.Printf("Title: %v\n", data["title"])
        fmt.Printf("Created By: %v\n", data["createdBy"])
    }

    fmt.Println("\n=== Forms Per Organization ===")
    orgForms := make(map[string]int)
    iter2 := client.Collection("forms").Documents(ctx)
    for {
        doc, err := iter2.Next()
        if err == iterator.Done {
            break
        }
        if err \!= nil {
            break
        }
        data := doc.Data()
        orgID := fmt.Sprintf("%v", data["organizationId"])
        orgForms[orgID]++
    }
    
    for orgID, count := range orgForms {
        fmt.Printf("Org %s: %d forms\n", orgID, count)
    }
}
