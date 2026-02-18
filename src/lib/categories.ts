import type { CategoryGroup, AttributeDefinition } from "@/types";

// ─── Shared attribute definitions ────────────────────────────────

const frameSizeAttr: AttributeDefinition = {
  key: "frameSize",
  label: "Runkokoko",
  type: "select",
  options: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "Muu"],
  filterable: true,
};

const conditionAttr: AttributeDefinition = {
  key: "condition",
  label: "Kunto",
  type: "select",
  options: ["Uusi", "Erinomainen", "Hyvä", "Tyydyttävä", "Välttävä"],
  filterable: true,
  required: true,
};

const electricAttr: AttributeDefinition = {
  key: "electric",
  label: "Sähköpyörä",
  type: "select",
  options: ["Kyllä", "Ei"],
  filterable: true,
};

const bikeBrandAttr: AttributeDefinition = {
  key: "bikeBrand",
  label: "Merkki",
  type: "select",
  options: [
    "Bianchi", "BMC", "Cannondale", "FOCUS", "Giant", "Lapierre", "Liv",
    "Orbea", "SCOTT", "Simplon", "Specialized", "Trek", "Wilier", "Muu",
  ],
  filterable: true,
  searchable: true,
};

const gearsAttr: AttributeDefinition = {
  key: "gears",
  label: "Vaihteet (Voimansiirto)",
  type: "select",
  options: [
    "1 vaihde (Single Speed)",
    "2–7 vaihdetta",
    "1x8", "1x9", "1x10", "1x11", "1x12",
    "2x8", "2x9", "2x10", "2x11", "2x12",
    "3x8", "3x9", "3x10", "3x11", "3x12",
    "Muu",
  ],
  filterable: true,
};

const drivetrainTypeAttr: AttributeDefinition = {
  key: "drivetrainType",
  label: "Vaihteiston tyyppi",
  type: "select",
  options: ["Mekaaninen", "Sähköinen", "Muu"],
  filterable: true,
};

const groupsetMfrAttr: AttributeDefinition = {
  key: "groupsetMfr",
  label: "Osasarjan valmistaja",
  type: "select",
  options: ["Shimano", "SRAM", "Muu"],
  filterable: true,
};

const frameMaterialAttr: AttributeDefinition = {
  key: "frameMaterial",
  label: "Runkomateriaali",
  type: "select",
  options: ["Alumiini", "Hiilikuitu", "Teräs", "Titaani", "Muu"],
  filterable: true,
};

const bikeGenderAttr: AttributeDefinition = {
  key: "bikeGender",
  label: "Sukupuoli / Geometria",
  type: "select",
  options: ["Miehet", "Naiset", "Muu"],
  filterable: true,
};

const colorAttr: AttributeDefinition = {
  key: "color",
  label: "Väri",
  type: "select",
  options: [
    "Harmaa", "Musta", "Sininen", "Valkoinen", "Punainen", "Violetti",
    "Vihreä", "Vaaleanpunainen", "Beige", "Hopea", "Turkoosi", "Ruskea",
    "Oranssi", "Neon", "Oliivi", "Muu",
  ],
  filterable: true,
};

const bikeBrakeTypeAttr: AttributeDefinition = {
  key: "bikeBrakeType",
  label: "Jarrutyyppi",
  type: "select",
  options: ["Hydraulinen", "Mekaaninen", "Muu"],
  filterable: true,
};

const bikeBaseAttrs: AttributeDefinition[] = [
  conditionAttr,
  electricAttr,
  bikeBrandAttr,
  frameSizeAttr,
  frameMaterialAttr,
  gearsAttr,
  drivetrainTypeAttr,
  groupsetMfrAttr,
  bikeGenderAttr,
  colorAttr,
  bikeBrakeTypeAttr,
];

// ─── Category tree ───────────────────────────────────────────────

export const categoryGroups: CategoryGroup[] = [
  {
    id: "pyorat",
    name: "Polkupyörät",
    categories: [
      {
        id: "gravel",
        name: "Gravel-pyörä",
        slug: "gravel-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "maantie",
        name: "Maantiepyörä",
        slug: "maantiepyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "aero-maantie",
        name: "Aero-maantiepyörä",
        slug: "aero-maantiepyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "endurance",
        name: "Endurance-pyörä",
        slug: "endurance-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "fitness",
        name: "Fitnesspyörä",
        slug: "fitnesspyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "cyclocross",
        name: "Cyclocross-pyörä",
        slug: "cyclocross-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "aika-ajo-triathlon",
        name: "Aika-ajo/triathlon-pyörä",
        slug: "aika-ajo-triathlon-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "etujousitettu-maasto",
        name: "Etujousitettu maastopyörä",
        slug: "etujousitettu-maastopyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "taysjousto-maasto",
        name: "Täysjoustomaastopyörä",
        slug: "taysjousto-maastopyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "taysjaykka-maasto",
        name: "Täysjäykkä maastopyörä",
        slug: "taysjaykka-maastopyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "fatbike",
        name: "Fatbike",
        slug: "fatbike",
        attributes: bikeBaseAttrs,
      },
      {
        id: "bmx-dirt",
        name: "BMX/dirt-pyörä",
        slug: "bmx-dirt-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "retki-randonneur",
        name: "Retki/randonneur-pyörä",
        slug: "retki-randonneur-pyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "hybridi",
        name: "Hybridipyörä",
        slug: "hybridipyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "fiksi-sinkula",
        name: "Fiksi/sinkula",
        slug: "fiksi-sinkula",
        attributes: bikeBaseAttrs,
      },
      {
        id: "taittopyora",
        name: "Taittopyörä",
        slug: "taittopyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "nojapyora",
        name: "Nojapyörä",
        slug: "nojapyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "ratapyora",
        name: "Ratapyörä",
        slug: "ratapyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "tavarapyora",
        name: "Tavarapyörä",
        slug: "tavarapyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "lasten-potkupyora",
        name: "Lasten potkupyörä",
        slug: "lasten-potkupyora",
        attributes: bikeBaseAttrs,
      },
      {
        id: "muu",
        name: "Muu",
        slug: "muu",
        attributes: bikeBaseAttrs,
      },
    ],
  },
];

// ─── Helper functions ────────────────────────────────────────────

export function getAllCategories(): Array<{
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  groupId: string;
  sortOrder: number;
}> {
  const result: Array<{
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    groupId: string;
    sortOrder: number;
  }> = [];
  let order = 0;

  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.children) {
        result.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          groupId: group.id,
          sortOrder: order++,
        });
        for (const child of cat.children) {
          result.push({
            id: child.id,
            name: child.name,
            slug: child.slug,
            parentId: cat.id,
            groupId: group.id,
            sortOrder: order++,
          });
        }
      } else {
        result.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          groupId: group.id,
          sortOrder: order++,
        });
      }
    }
  }

  return result;
}

export function getAttributesForCategory(
  categoryId: string
): AttributeDefinition[] {
  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.id === categoryId && cat.attributes) {
        return cat.attributes;
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.id === categoryId && child.attributes) {
            return child.attributes;
          }
        }
      }
    }
  }
  return [];
}

export function getAllAttributeValues(): Array<{
  attributeKey: string;
  value: string;
  sortOrder: number;
}> {
  const seen = new Map<string, AttributeDefinition>();

  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.attributes) {
        for (const attr of cat.attributes) {
          if (!seen.has(attr.key)) seen.set(attr.key, attr);
        }
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.attributes) {
            for (const attr of child.attributes) {
              if (!seen.has(attr.key)) seen.set(attr.key, attr);
            }
          }
        }
      }
    }
  }

  const result: Array<{ attributeKey: string; value: string; sortOrder: number }> = [];
  for (const attr of seen.values()) {
    if (attr.options) {
      attr.options.forEach((opt, i) => {
        result.push({ attributeKey: attr.key, value: opt, sortOrder: i });
      });
    }
  }
  return result;
}

export function getAllAttributes(): Array<{
  key: string;
  label: string;
  type: string;
  filterable: boolean;
  required: boolean;
  unit: string | null;
}> {
  const seen = new Map<string, AttributeDefinition>();

  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.attributes) {
        for (const attr of cat.attributes) {
          if (!seen.has(attr.key)) seen.set(attr.key, attr);
        }
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.attributes) {
            for (const attr of child.attributes) {
              if (!seen.has(attr.key)) seen.set(attr.key, attr);
            }
          }
        }
      }
    }
  }

  return Array.from(seen.values()).map((attr) => ({
    key: attr.key,
    label: attr.label,
    type: attr.type,
    filterable: attr.filterable ?? false,
    required: attr.required ?? false,
    unit: attr.unit ?? null,
  }));
}

export function getCategoryAttributeMappings(): Array<{
  categoryId: string;
  attributeKey: string;
  sortOrder: number;
}> {
  const result: Array<{ categoryId: string; attributeKey: string; sortOrder: number }> = [];

  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.attributes) {
        cat.attributes.forEach((attr, i) => {
          result.push({ categoryId: cat.id, attributeKey: attr.key, sortOrder: i });
        });
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.attributes) {
            child.attributes.forEach((attr, i) => {
              result.push({ categoryId: child.id, attributeKey: attr.key, sortOrder: i });
            });
          }
        }
      }
    }
  }

  return result;
}

export function getCategoryById(
  categoryId: string
): { id: string; name: string; slug: string; groupId: string } | null {
  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.id === categoryId) {
        return { id: cat.id, name: cat.name, slug: cat.slug, groupId: group.id };
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.id === categoryId) {
            return {
              id: child.id,
              name: child.name,
              slug: child.slug,
              groupId: group.id,
            };
          }
        }
      }
    }
  }
  return null;
}
