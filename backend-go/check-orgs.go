package main

import (
	"context"
	"fmt"
	"log"
	"cloud.google.com/go/firestore"
)

func main() {
	ctx := context.Background()
	client, err := firestore.NewClient(ctx, "healthcare-forms-v2")
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	// Check the organization that owns the form
	fmt.Println("=== Organization m9SxkIbKOMWbxwmNFFVu38dos923 (form owner) ===")
	orgDoc1, err := client.Collection("organizations").Doc("m9SxkIbKOMWbxwmNFFVu38dos923").Get(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		data := orgDoc1.Data()
		fmt.Printf("Name: %v\n", data["name"])
		fmt.Printf("UID: %v\n", data["uid"])
		fmt.Printf("Email: %v\n", data["email"])
	}
	
	// Check the user's actual organization
	fmt.Println("\n=== Organization PDQFNz4mIN5WcUGFfjiJ (user's org) ===")
	orgDoc2, err := client.Collection("organizations").Doc("PDQFNz4mIN5WcUGFfjiJ").Get(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		data := orgDoc2.Data()
		fmt.Printf("Name: %v\n", data["name"])
		fmt.Printf("UID: %v\n", data["uid"])
		fmt.Printf("Email: %v\n", data["email"])
	}
	
	// Check the form to see which organization owns it
	fmt.Println("\n=== Form wzBsRAUBljofmri4wVQs ===")
	formDoc, err := client.Collection("forms").Doc("wzBsRAUBljofmri4wVQs").Get(ctx)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		data := formDoc.Data()
		fmt.Printf("Title: %v\n", data["title"])
		fmt.Printf("Organization ID: %v\n", data["organizationId"])
		fmt.Printf("Created By: %v\n", data["created_by"])
	}
}