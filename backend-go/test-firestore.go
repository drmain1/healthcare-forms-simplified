package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

func main() {
	ctx := context.Background()
	
	// Create Firestore client
	client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer client.Close()

	// Check form_responses
	fmt.Println("=== Recent form_responses ===")
	iter := client.Collection("form_responses").
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
			log.Printf("Error getting doc: %v", err)
			break
		}
		
		data := doc.Data()
		count++
		fmt.Printf("\nID: %s\n", doc.Ref.ID)
		fmt.Printf("  Organization: %v\n", data["organization"])
		fmt.Printf("  Form: %v\n", data["form"])
		fmt.Printf("  Submitted By: %v\n", data["submitted_by"])
		if submittedAt, ok := data["submitted_at"].(time.Time); ok {
			fmt.Printf("  Submitted At: %v\n", submittedAt.Format("2006-01-02 15:04:05"))
		}
	}
	fmt.Printf("\nTotal responses found: %d\n", count)

	// Check share_links
	fmt.Println("\n=== Active share_links ===")
	iter2 := client.Collection("share_links").
		Where("is_active", "==", true).
		Limit(3).
		Documents(ctx)
	
	for {
		doc, err := iter2.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error getting share link: %v", err)
			break
		}
		
		data := doc.Data()
		fmt.Printf("\nShare Link ID: %s\n", doc.Ref.ID)
		fmt.Printf("  Form ID: %v\n", data["form_id"])
		fmt.Printf("  Organization: %v\n", data["organization"])
		fmt.Printf("  Response Count: %v\n", data["response_count"])
	}

	// Check specific organization's responses
	fmt.Println("\n=== Checking specific organization ===")
	// First get an org ID
	orgDoc, err := client.Collection("organizations").Limit(1).Documents(ctx).Next()
	if err == nil {
		orgData := orgDoc.Data()
		orgID := orgDoc.Ref.ID
		fmt.Printf("Using Organization: %s (%v)\n", orgID, orgData["name"])
		
		// Now query responses for this org
		iter3 := client.Collection("form_responses").
			Where("organization", "==", orgID).
			Limit(3).
			Documents(ctx)
		
		orgCount := 0
		for {
			_, err := iter3.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				break
			}
			orgCount++
		}
		fmt.Printf("  Responses for this org: %d\n", orgCount)
	}
}