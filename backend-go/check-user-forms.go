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

	// Check forms for organization PDQFNz4mIN5WcUGFfjiJ
	fmt.Println("=== Forms for Organization PDQFNz4mIN5WcUGFfjiJ ===")
	formIter := client.Collection("forms").
		Where("organizationId", "==", "PDQFNz4mIN5WcUGFfjiJ").
		Documents(ctx)
	
	formCount := 0
	for {
		doc, err := formIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		formCount++
		fmt.Printf("Form %d (ID: %s):\n", formCount, doc.Ref.ID)
		fmt.Printf("  Title: %v\n", data["title"])
		fmt.Printf("  Created At: %v\n", data["created_at"])
	}
	
	if formCount == 0 {
		fmt.Println("No forms found for this organization")
	}
	
	// Check forms for organization m9SxkIbKOMWbxwmNFFVu38dos923
	fmt.Println("\n=== Forms for Organization m9SxkIbKOMWbxwmNFFVu38dos923 (dtmain@gmail.com) ===")
	formIter2 := client.Collection("forms").
		Where("organizationId", "==", "m9SxkIbKOMWbxwmNFFVu38dos923").
		Documents(ctx)
	
	formCount2 := 0
	for {
		doc, err := formIter2.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		formCount2++
		fmt.Printf("Form %d (ID: %s):\n", formCount2, doc.Ref.ID)
		fmt.Printf("  Title: %v\n", data["title"])
		fmt.Printf("  Created At: %v\n", data["created_at"])
	}
	
	// Check responses for m9SxkIbKOMWbxwmNFFVu38dos923
	fmt.Println("\n=== Responses for Organization m9SxkIbKOMWbxwmNFFVu38dos923 ===")
	respIter := client.Collection("form_responses").
		Where("organization", "==", "m9SxkIbKOMWbxwmNFFVu38dos923").
		OrderBy("submitted_at", firestore.Desc).
		Limit(3).
		Documents(ctx)
	
	respCount := 0
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
		respCount++
		fmt.Printf("Response %d (ID: %s):\n", respCount, doc.Ref.ID)
		fmt.Printf("  Form: %v\n", data["form"])
		fmt.Printf("  Submitted At: %v\n", data["submitted_at"])
	}
}