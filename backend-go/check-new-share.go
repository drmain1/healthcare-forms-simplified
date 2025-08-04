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
		log.Fatal(err)
	}
	defer client.Close()

	// Check the most recent share link for form wzBsRAUBljofmri4wVQs
	shareLinks := client.Collection("share_links").
		Where("form_id", "==", "wzBsRAUBljofmri4wVQs").
		OrderBy("created_at", firestore.Desc).
		Limit(3)
	
	shareDocs, err := shareLinks.Documents(ctx).GetAll()
	if err != nil {
		fmt.Printf("Error getting share links: %v\n", err)
	} else {
		fmt.Printf("Found %d share links for form wzBsRAUBljofmri4wVQs\n\n", len(shareDocs))
		for i, shareDoc := range shareDocs {
			shareData := shareDoc.Data()
			fmt.Printf("Share Link #%d:\n", i+1)
			fmt.Printf("  Share Link ID: %s\n", shareDoc.Ref.ID)
			fmt.Printf("  Organization in share_link: %v\n", shareData["organization"])
			fmt.Printf("  Response Count: %v\n", shareData["response_count"])
			fmt.Printf("  Created At: %v\n", shareData["created_at"])
			if token, ok := shareData["share_token"].(string); ok && len(token) > 20 {
				fmt.Printf("  Share Token: %.20s...\n", token)
			}
			fmt.Printf("  Is Active: %v\n", shareData["is_active"])
			fmt.Println()
		}
	}
	
	// Check the form itself
	formDoc, err := client.Collection("forms").Doc("wzBsRAUBljofmri4wVQs").Get(ctx)
	if err == nil {
		formData := formDoc.Data()
		fmt.Printf("Form wzBsRAUBljofmri4wVQs:\n")
		fmt.Printf("  Title: %v\n", formData["title"])
		fmt.Printf("  Organization: %v\n", formData["organizationId"])
		fmt.Println()
	}
	
	// Check recent form responses
	fmt.Printf("=== Recent Form Responses ===\n")
	respIter := client.Collection("form_responses").
		OrderBy("submitted_at", firestore.Desc).
		Limit(5).
		Documents(ctx)
	
	count := 0
	for {
		doc, err := respIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		count++
		fmt.Printf("Response %d (ID: %s):\n", count, doc.Ref.ID)
		fmt.Printf("  Form ID: %v\n", data["form_id"])
		fmt.Printf("  Organization: %v\n", data["organization"])
		fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
		fmt.Printf("  Submitted By: %v\n", data["submitted_by"])
		fmt.Println()
	}
	
	// Check responses for user's organization
	fmt.Printf("=== Responses for Organization PDQFNz4mIN5WcUGFfjiJ ===\n")
	orgRespIter := client.Collection("form_responses").
		Where("organization", "==", "PDQFNz4mIN5WcUGFfjiJ").
		OrderBy("submitted_at", firestore.Desc).
		Limit(5).
		Documents(ctx)
	
	count = 0
	for {
		doc, err := orgRespIter.Next()
		if err == iterator.Done {
			if count == 0 {
				fmt.Println("No responses found for organization PDQFNz4mIN5WcUGFfjiJ")
			}
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		count++
		fmt.Printf("Response %d (ID: %s):\n", count, doc.Ref.ID)
		fmt.Printf("  Form ID: %v\n", data["form_id"])
		fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
		fmt.Println()
	}
}