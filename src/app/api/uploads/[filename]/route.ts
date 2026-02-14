import { NextRequest, NextResponse } from "next/server";
import { getImagePath } from "@/lib/images";
import fs from "fs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = getImagePath(filename);

  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const isWebp = filename.endsWith(".webp");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": isWebp ? "image/webp" : "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
