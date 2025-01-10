import { NextResponse } from "next/server";

export async function POST(req, res: NextResponse) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Invalid request method" },
      { status: 405 }
    );
  }

  const { message, accessToken, pageId } = req.body;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${1020554606779409}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          access_token:
            "EAAKQif6VLu8BO3GboqpwHnOT1AK5LJh0vJXQ3EBoIV1cWG1mlENq2iNV6GZCgVGhZAZCGJPb38xxHF7eXw5Gz2prvUZCvvqDv6818SaEbcMlh7ar2frFHWI2VeYU7LtJevgZC6Ah5kqCdpLmeZApscX3ZAGXopUerKFWePQoWcZASCwOLSZCZBr8hvez6hOcnndVNpxctum5EZD,",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message);
    }

    const result = await response.json();
    return new NextResponse(
      { message: "Successfully posted to Facebook" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}
