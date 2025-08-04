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
	client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	// Check the form ulo2KaFAQj9H5GGC7mhd
	fmt.Println("=== Form ulo2KaFAQj9H5GGC7mhd ===")
	formDoc, err := client.Collection("forms").Doc("ulo2KaFAQj9H5GGC7mhd").Get(ctx)
	if err != nil {
		fmt.Printf("Error getting form: %v\n", err)
	} else {
		formData := formDoc.Data()
		fmt.Printf("Title: %v\n", formData["title"])
		fmt.Printf("Organization ID: %v\n", formData["organizationId"])
		fmt.Printf("Created By: %v\n", formData["created_by"])
		
		// Check what organization this is
		if orgID, ok := formData["organizationId"].(string); ok {
			orgDoc, err := client.Collection("organizations").Doc(orgID).Get(ctx)
			if err == nil {
				orgData := orgDoc.Data()
				fmt.Printf("Organization Name: %v\n", orgData["name"])
				fmt.Printf("Organization Email: %v\n", orgData["email"])
			}
		}
	}
	
	// Check the share link created at 13:36:40
	fmt.Println("\n=== Share Link Created at 13:36:40 ===")
	shareIter := client.Collection("share_links").
		Where("share_token", "==", "8c31ed29e96bf1014163ac5b0cd38032b4250137b384aacea73e433d59446c9a").
		Limit(1).
		Documents(ctx)
	
	shareDoc, err := shareIter.Next()
	if err != nil {
		fmt.Printf("Share link not found: %v\n", err)
	} else {
		shareData := shareDoc.Data()
		fmt.Printf("Share Link ID: %s\n", shareDoc.Ref.ID)
		fmt.Printf("Form ID: %v\n", shareData["form_id"])
		fmt.Printf("Organization: %v\n", shareData["organization"])
		fmt.Printf("Created At: %v\n", shareData["created_at"])
		fmt.Printf("Response Count: %v\n", shareData["response_count"])
	}
	
	// Get the MOST RECENT form response (should be from 13:36:51)
	fmt.Println("\n=== Most Recent Form Response ===")
	respIter := client.Collection("form_responses").
		OrderBy("submitted_at", firestore.Desc).
		Limit(1).
		Documents(ctx)
	
	respDoc, err := respIter.Next()
	if err != nil {
		fmt.Printf("Error getting response: %v\n", err)
	} else {
		respData := respDoc.Data()
		fmt.Printf("Response ID: %s\n", respDoc.Ref.ID)
		fmt.Printf("Submitted At: %v\n", respData["submitted_at"])
		fmt.Printf("Organization: %v\n", respData["organization"])
		fmt.Printf("Form (form field): %v\n", respData["form"])
		fmt.Printf("Submitted By: %v\n", respData["submitted_by"])
		
		// Check if this is the 13:36:51 submission
		if submittedAt, ok := respData["submitted_at"].(time.Time); ok {
			if submittedAt.Hour() == 13 && submittedAt.Minute() == 36 {
				fmt.Println("✓ This is the submission from 13:36:51")
			}
		}
	}
	
	// Check responses for the organization that owns form ulo2KaFAQj9H5GGC7mhd
	fmt.Println("\n=== All Responses for Form ulo2KaFAQj9H5GGC7mhd ===")
	formRespIter := client.Collection("form_responses").
		Where("form", "==", "ulo2KaFAQj9H5GGC7mhd").
		Documents(ctx)
	
	respCount := 0
	for {
		doc, err := formRespIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		respCount++
		fmt.Printf("Response %d (ID: %s):\n", respCount, doc.Ref.ID)
		fmt.Printf("  Organization: %v\n", data["organization"])
		fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
	}
	
	if respCount == 0 {
		fmt.Println("No responses found for form ulo2KaFAQj9H5GGC7mhd")
	}
}