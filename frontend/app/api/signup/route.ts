import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate the data (e.g., check for required fields)
    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // Simulate saving the user data (e.g., to a database)
    console.log("User data received:", body);

    // Respond with success
    return NextResponse.json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { message: "An error occurred during signup." },
      { status: 500 }
    );
  }
}