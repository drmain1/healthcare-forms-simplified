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
		log.Fatal(err)
	}
	defer client.Close()

	// Get the MOST RECENT submission (from 13:28:01)
	fmt.Println("=== LATEST Form Response (submitted at 13:28:01) ===")
	doc, err := client.Collection("form_responses").Doc("M2HDu8UobWmBfddL6qu0").Get(ctx)
	if err != nil {
		fmt.Printf("Error getting response: %v\n", err)
		return
	}
	
	data := doc.Data()
	fmt.Printf("Response ID: %s\n", doc.Ref.ID)
	fmt.Printf("Submitted At: %v\n", data["submitted_at"])
	fmt.Printf("Organization: %v\n", data["organization"])
	fmt.Printf("Form ID (form field): %v\n", data["form"])
	fmt.Printf("Form ID (form_id field): %v\n", data["form_id"])
	fmt.Printf("Submitted By: %v\n", data["submitted_by"])
	
	// Check all fields
	fmt.Println("\nAll fields in response:")
	for key, value := range data {
		if key != "data" { // Skip the response data itself
			fmt.Printf("  %s: %v\n", key, value)
		}
	}
	
	// Now check the share link that was created at 13:27:47
	fmt.Println("\n=== Share Link Created at 13:27:47 ===")
	// Get share links for form wzBsRAUBljofmri4wVQs with token c78606cd...
	iter := client.Collection("share_links").
		Where("share_token", "==", "c78606cd36697d5a83f42280a868e7d3ab0f94cdadcbfb71e63b38e0b203f601").
		Limit(1).
		Documents(ctx)
	
	shareDoc, err := iter.Next()
	if err != nil {
		fmt.Printf("Share link not found: %v\n", err)
	} else {
		shareData := shareDoc.Data()
		fmt.Printf("Share Link ID: %s\n", shareDoc.Ref.ID)
		fmt.Printf("Form ID: %v\n", shareData["form_id"])
		fmt.Printf("Organization: %v\n", shareData["organization"])
		fmt.Printf("Created At: %v\n", shareData["created_at"])
		fmt.Printf("Response Count: %v\n", shareData["response_count"])
		
		// Check if timestamp matches
		if createdAt, ok := shareData["created_at"].(time.Time); ok {
			if createdAt.Hour() == 13 && createdAt.Minute() == 27 {
				fmt.Println("✓ This is the share link created at 13:27:47")
			}
		}
	}
}