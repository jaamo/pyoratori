import OpenAI from "openai";
import type { AttributeDefinition } from "@/types";

interface ClassifierInput {
  title: string;
  description: string;
  attributes: AttributeDefinition[];
}

/**
 * Uses OpenAI to detect product attribute values from title and description.
 * Returns a map of attribute keys to detected values (only for attributes it could determine).
 */
export async function classifyProduct(
  input: ClassifierInput
): Promise<Record<string, string>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const client = new OpenAI({ apiKey });

  const attributeDescriptions = input.attributes
    .filter((a) => a.options && a.options.length > 0)
    .map(
      (a) =>
        `- "${a.key}" (${a.label}): allowed values: ${JSON.stringify(a.options)}`
    )
    .join("\n");

  const prompt = `You are a bicycle product attribute classifier. Given a product title and description, extract attribute values.

RULES:
- Only return attributes you can confidently determine from the text.
- Values MUST be exactly one of the allowed options listed for each attribute.
- If you cannot determine an attribute, omit it from the result.
- The text is in Finnish. Attribute labels and options are also in Finnish.
- For "bikeBrand": match the brand name from the title/description to the closest allowed option. If the brand is not in the list, use "Muu".
- For "frameSize": look for frame size numbers (e.g., 52, 54, 56) or letter sizes (S, M, L, etc.).
- For "electric": default to "Ei" unless there are clear indicators of an e-bike (sähköpyörä, e-bike, motor, etc.).
- For "condition": look for condition descriptions (uusi/new, hyvä/good, etc.).
- For "color": identify the dominant color from descriptions or title.
- For "frameMaterial": look for carbon/hiilikuitu, aluminum/alumiini, steel/teräs, titanium/titaani.
- For "gears": look for drivetrain specs like "2x11", "1x12", "Shimano 105 2x11" etc.
- For "drivetrainType": mechanical (mekaaninen) vs electronic (sähköinen, Di2, eTap, AXS).
- For "groupsetMfr": Shimano, SRAM, or other.
- For "bikeBrakeType": hydraulic disc (hydraulinen), mechanical (mekaaninen), rim brakes (mekaaninen).
- For "bikeGender": look for mentions of women's/men's specific geometry.

ATTRIBUTES:
${attributeDescriptions}

PRODUCT TITLE: ${input.title}

PRODUCT DESCRIPTION:
${input.description}

Return a JSON object mapping attribute keys to their detected values. Only include attributes you can determine.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const result = JSON.parse(content) as Record<string, string>;

  // Validate that returned values are among allowed options
  const validResult: Record<string, string> = {};
  for (const attr of input.attributes) {
    const value = result[attr.key];
    if (value && attr.options?.includes(value)) {
      validResult[attr.key] = value;
    }
  }

  return validResult;
}
