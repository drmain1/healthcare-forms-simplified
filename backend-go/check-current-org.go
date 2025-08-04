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

	// Check organization 8Ng9JR1aMbhXezBt9a7Wy3YgS5G3
	fmt.Println("=== Organization 8Ng9JR1aMbhXezBt9a7Wy3YgS5G3 ===")
	orgDoc, err := client.Collection("organizations").Doc("8Ng9JR1aMbhXezBt9a7Wy3YgS5G3").Get(ctx)
	if err != nil {
		fmt.Printf("Error getting org: %v\n", err)
	} else {
		orgData := orgDoc.Data()
		fmt.Printf("Name: %v\n", orgData["name"])
		fmt.Printf("Email: %v\n", orgData["email"])
		fmt.Printf("UID: %v\n", orgData["uid"])
	}
	
	// Check responses for this organization
	fmt.Println("\n=== Responses for Organization 8Ng9JR1aMbhXezBt9a7Wy3YgS5G3 ===")
	respIter := client.Collection("form_responses").
		Where("organization", "==", "8Ng9JR1aMbhXezBt9a7Wy3YgS5G3").
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
		fmt.Printf("  Submitted By: %v\n", data["submitted_by"])
	}
	
	fmt.Printf("\nTotal responses for this organization: %d\n", respCount)
	
	// List all organizations to understand the situation
	fmt.Println("\n=== All Organizations ===")
	orgIter := client.Collection("organizations").Documents(ctx)
	for {
		doc, err := orgIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			break
		}
		data := doc.Data()
		fmt.Printf("Org %s:\n", doc.Ref.ID)
		fmt.Printf("  Name: %v\n", data["name"])
		fmt.Printf("  Email: %v\n", data["email"])
		fmt.Printf("  UID: %v\n", data["uid"])
	}
}