import type { CategoryGroup, AttributeDefinition } from "@/types";

// ─── Shared attribute definitions ────────────────────────────────

const frameSizeAttr: AttributeDefinition = {
  key: "frameSize",
  label: "Rungon koko",
  type: "select",
  options: ["XS", "S", "M", "L", "XL", "XXL"],
  filterable: true,
};

const wheelSizeAttr: AttributeDefinition = {
  key: "wheelSize",
  label: "Rengaskoko",
  type: "select",
  options: ['26"', '27.5"', '29"', '650b', '700c', '20"', '24"', '16"'],
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

const yearAttr: AttributeDefinition = {
  key: "year",
  label: "Vuosimalli",
  type: "number",
  min: 1970,
  max: new Date().getFullYear() + 1,
  filterable: true,
};

const brandAttr: AttributeDefinition = {
  key: "brand",
  label: "Merkki",
  type: "text",
  filterable: true,
};

const modelAttr: AttributeDefinition = {
  key: "model",
  label: "Malli",
  type: "text",
};

const materialAttr: AttributeDefinition = {
  key: "material",
  label: "Materiaali",
  type: "select",
  options: ["Alumiini", "Hiili (Carbon)", "Teräs", "Titaani", "Muu"],
  filterable: true,
};

const genderAttr: AttributeDefinition = {
  key: "gender",
  label: "Sukupuoli",
  type: "select",
  options: ["Unisex", "Miesten", "Naisten"],
  filterable: true,
};

const bikeBaseAttrs: AttributeDefinition[] = [
  conditionAttr,
  brandAttr,
  modelAttr,
  yearAttr,
  frameSizeAttr,
  wheelSizeAttr,
  materialAttr,
  genderAttr,
];

const componentBaseAttrs: AttributeDefinition[] = [
  conditionAttr,
  brandAttr,
  modelAttr,
];

const gearBaseAttrs: AttributeDefinition[] = [conditionAttr, brandAttr];

// ─── Category tree ───────────────────────────────────────────────

export const categoryGroups: CategoryGroup[] = [
  {
    id: "pyorat",
    name: "Polkupyörät",
    categories: [
      {
        id: "tasamaapyorat",
        name: "Tasamaapyörät",
        slug: "tasamaapyorat",
        children: [
          {
            id: "tasamaa-triathlon",
            name: "Triathlon / Aika-ajo",
            slug: "triathlon-aika-ajo",
            attributes: bikeBaseAttrs,
          },
          {
            id: "tasamaa-maantie",
            name: "Maantie",
            slug: "maantie",
            attributes: bikeBaseAttrs,
          },
          {
            id: "tasamaa-cyclocross-gravel",
            name: "Cyclocross / Gravel",
            slug: "cyclocross-gravel",
            attributes: bikeBaseAttrs,
          },
          {
            id: "tasamaa-hybrid-fitness",
            name: "Hybrid / Fitness",
            slug: "hybrid-fitness",
            attributes: bikeBaseAttrs,
          },
          {
            id: "tasamaa-rata",
            name: "Rata",
            slug: "rata",
            attributes: bikeBaseAttrs,
          },
        ],
      },
      {
        id: "maastopyorat",
        name: "Maastopyörät",
        slug: "maastopyorat",
        children: [
          {
            id: "maasto-rigid",
            name: "Joustamattomat (Rigid)",
            slug: "joustamattomat",
            attributes: bikeBaseAttrs,
          },
          {
            id: "maasto-fatbike",
            name: "Fatbike",
            slug: "fatbike",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "tireWidth",
                label: "Renkaan leveys",
                type: "select",
                options: ['3.8"', '4.0"', '4.5"', '4.8"', '5.0"'],
                filterable: true,
              },
            ],
          },
          {
            id: "maasto-hardtail",
            name: "Hardtail (Etujousitetut)",
            slug: "hardtail",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "forkTravel",
                label: "Keulan jousto (mm)",
                type: "number",
                min: 80,
                max: 200,
                unit: "mm",
                filterable: true,
              },
            ],
          },
          {
            id: "maasto-full-80-125",
            name: "Täysjousto 80–125mm",
            slug: "taysjousto-80-125",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "rearTravel",
                label: "Takajousto (mm)",
                type: "number",
                min: 80,
                max: 125,
                unit: "mm",
                filterable: true,
              },
            ],
          },
          {
            id: "maasto-full-130-155",
            name: "Täysjousto 130–155mm",
            slug: "taysjousto-130-155",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "rearTravel",
                label: "Takajousto (mm)",
                type: "number",
                min: 130,
                max: 155,
                unit: "mm",
                filterable: true,
              },
            ],
          },
          {
            id: "maasto-full-160-185",
            name: "Täysjousto 160–185mm",
            slug: "taysjousto-160-185",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "rearTravel",
                label: "Takajousto (mm)",
                type: "number",
                min: 160,
                max: 185,
                unit: "mm",
                filterable: true,
              },
            ],
          },
          {
            id: "maasto-full-190-210",
            name: "Täysjousto 190–210mm",
            slug: "taysjousto-190-210",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "rearTravel",
                label: "Takajousto (mm)",
                type: "number",
                min: 190,
                max: 210,
                unit: "mm",
                filterable: true,
              },
            ],
          },
        ],
      },
      {
        id: "peruspyorat",
        name: "Peruspyörät",
        slug: "peruspyorat",
        children: [
          {
            id: "perus-lasten",
            name: "Lasten pyörät",
            slug: "lasten-pyorat",
            attributes: [
              conditionAttr,
              brandAttr,
              modelAttr,
              yearAttr,
              wheelSizeAttr,
            ],
          },
          {
            id: "perus-yksivaihteiset",
            name: "Yksivaihteiset",
            slug: "yksivaihteiset",
            attributes: bikeBaseAttrs,
          },
          {
            id: "perus-napavaihteiset",
            name: "Napavaihteiset",
            slug: "napavaihteiset",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "gearCount",
                label: "Vaihdemäärä",
                type: "select",
                options: ["3", "5", "7", "8", "11", "14"],
                filterable: true,
              },
            ],
          },
          {
            id: "perus-ketjuvaihteiset",
            name: "Ketjuvaihteiset",
            slug: "ketjuvaihteiset",
            attributes: bikeBaseAttrs,
          },
        ],
      },
      {
        id: "sahkopyorat",
        name: "Sähköpyörät",
        slug: "sahkopyorat",
        children: [
          {
            id: "sahko-tasamaa",
            name: "Sähkö - Tasamaa",
            slug: "sahko-tasamaa",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "motorBrand",
                label: "Moottorin merkki",
                type: "text",
                filterable: true,
              },
              {
                key: "batteryWh",
                label: "Akun kapasiteetti (Wh)",
                type: "number",
                min: 200,
                max: 1000,
                unit: "Wh",
                filterable: true,
              },
            ],
          },
          {
            id: "sahko-maasto",
            name: "Sähkö - Maasto",
            slug: "sahko-maasto",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "motorBrand",
                label: "Moottorin merkki",
                type: "text",
                filterable: true,
              },
              {
                key: "batteryWh",
                label: "Akun kapasiteetti (Wh)",
                type: "number",
                min: 200,
                max: 1000,
                unit: "Wh",
                filterable: true,
              },
            ],
          },
          {
            id: "sahko-muut",
            name: "Muut sähköpyörät",
            slug: "muut-sahkopyorat",
            attributes: [
              ...bikeBaseAttrs,
              {
                key: "motorBrand",
                label: "Moottorin merkki",
                type: "text",
                filterable: true,
              },
              {
                key: "batteryWh",
                label: "Akun kapasiteetti (Wh)",
                type: "number",
                min: 200,
                max: 1000,
                unit: "Wh",
                filterable: true,
              },
            ],
          },
        ],
      },
      {
        id: "muut-pyorat",
        name: "Muut pyörät",
        slug: "muut-pyorat",
        children: [
          {
            id: "muut-fixie",
            name: "Fixed Gear (Fiksit)",
            slug: "fixed-gear",
            attributes: bikeBaseAttrs,
          },
          {
            id: "muut-vintage",
            name: "Vintage / Retro",
            slug: "vintage-retro",
            attributes: bikeBaseAttrs,
          },
          {
            id: "muut-bmx",
            name: "BMX",
            slug: "bmx",
            attributes: [
              conditionAttr,
              brandAttr,
              modelAttr,
              yearAttr,
              wheelSizeAttr,
            ],
          },
          {
            id: "muut-dirt-street",
            name: "Dirt / Street",
            slug: "dirt-street",
            attributes: [
              conditionAttr,
              brandAttr,
              modelAttr,
              yearAttr,
              wheelSizeAttr,
            ],
          },
          {
            id: "muut-tavara",
            name: "Tavarapyörät (Cargo)",
            slug: "tavarapyorat",
            attributes: bikeBaseAttrs,
          },
          {
            id: "muut-sekalaiset",
            name: "Muille osastoille sopimattomat",
            slug: "muut-sekalaiset",
            attributes: [conditionAttr, brandAttr],
          },
        ],
      },
    ],
  },
  {
    id: "osat",
    name: "Osat",
    categories: [
      {
        id: "osat-rungot",
        name: "Rungot ja rungkosetit",
        slug: "rungot",
        attributes: [
          ...componentBaseAttrs,
          frameSizeAttr,
          materialAttr,
          {
            key: "bikeType",
            label: "Pyörätyyppi",
            type: "select",
            options: ["Maasto", "Maantie", "Gravel", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-haarukat-iskarit",
        name: "Haarukat ja iskarit",
        slug: "haarukat-iskarit",
        attributes: [
          ...componentBaseAttrs,
          wheelSizeAttr,
          {
            key: "travel",
            label: "Jousto (mm)",
            type: "number",
            min: 0,
            max: 250,
            unit: "mm",
            filterable: true,
          },
          {
            key: "axleType",
            label: "Akselityyppi",
            type: "select",
            options: ["9mm QR", "15mm TA", "20mm TA", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-kiekot",
        name: "Kiekot",
        slug: "kiekot",
        attributes: [
          ...componentBaseAttrs,
          wheelSizeAttr,
          {
            key: "axleType",
            label: "Akselityyppi",
            type: "select",
            options: ["9mm QR", "12mm TA", "15mm TA", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-renkaat",
        name: "Renkaat ja sisärenkaat",
        slug: "renkaat",
        attributes: [
          ...componentBaseAttrs,
          wheelSizeAttr,
          {
            key: "tireWidth",
            label: "Leveys",
            type: "text",
          },
        ],
      },
      {
        id: "osat-satulat",
        name: "Satulat ja tolpat",
        slug: "satulat-tolpat",
        attributes: [
          ...componentBaseAttrs,
          {
            key: "seatpostDiameter",
            label: "Tolpan halkaisija",
            type: "select",
            options: ["27.2mm", "30.9mm", "31.6mm", "34.9mm", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-ohjaustangot",
        name: "Ohjaustangot ja stemmat",
        slug: "ohjaustangot-stemmat",
        attributes: [
          ...componentBaseAttrs,
          {
            key: "handlebarWidth",
            label: "Leveys (mm)",
            type: "number",
            min: 380,
            max: 850,
            unit: "mm",
          },
        ],
      },
      {
        id: "osat-voimansiirto",
        name: "Voimansiirto",
        slug: "voimansiirto",
        attributes: [
          ...componentBaseAttrs,
          {
            key: "speeds",
            label: "Vaihteet",
            type: "select",
            options: [
              "1x",
              "1x10",
              "1x11",
              "1x12",
              "2x10",
              "2x11",
              "2x12",
              "Muu",
            ],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-jarrut",
        name: "Jarrut",
        slug: "jarrut",
        attributes: [
          ...componentBaseAttrs,
          {
            key: "brakeType",
            label: "Jarrutyyppi",
            type: "select",
            options: ["Levy - hydraulinen", "Levy - mekaaninen", "Vanne", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "osat-sahko",
        name: "Sähköosat",
        slug: "sahko-osat",
        attributes: [
          ...componentBaseAttrs,
          {
            key: "componentType",
            label: "Osatyyppi",
            type: "select",
            options: [
              "Moottori",
              "Akku",
              "Laturi",
              "Näyttö",
              "Ohjausyksikkö",
              "Sensori",
              "Kaapeli",
              "Muu",
            ],
            filterable: true,
          },
        ],
      },
    ],
  },
  {
    id: "varusteet",
    name: "Varusteet",
    categories: [
      {
        id: "varusteet-vaatteet",
        name: "Vaatteet",
        slug: "vaatteet",
        attributes: [
          ...gearBaseAttrs,
          {
            key: "size",
            label: "Koko",
            type: "select",
            options: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
            filterable: true,
          },
          genderAttr,
        ],
      },
      {
        id: "varusteet-kyparat",
        name: "Kypärät ja suojat",
        slug: "kyparat-suojat",
        attributes: [
          ...gearBaseAttrs,
          {
            key: "size",
            label: "Koko",
            type: "select",
            options: ["XS", "S", "M", "L", "XL"],
            filterable: true,
          },
        ],
      },
      {
        id: "varusteet-kengat",
        name: "Kengät",
        slug: "kengat",
        attributes: [
          ...gearBaseAttrs,
          {
            key: "shoeSize",
            label: "Koko (EU)",
            type: "number",
            min: 30,
            max: 50,
            filterable: true,
          },
          {
            key: "cleatType",
            label: "Lukkotyyppi",
            type: "select",
            options: ["SPD", "SPD-SL", "Look", "Ei lukkoja", "Muu"],
            filterable: true,
          },
        ],
      },
      {
        id: "varusteet-elektroniikka",
        name: "Elektroniikka",
        slug: "elektroniikka",
        attributes: [
          ...gearBaseAttrs,
          {
            key: "deviceType",
            label: "Laitetyyppi",
            type: "select",
            options: [
              "Mittari",
              "Valot",
              "GPS",
              "Kamera",
              "Harjoitusvastus",
              "Muu",
            ],
            filterable: true,
          },
        ],
      },
      {
        id: "varusteet-muut",
        name: "Muut varusteet",
        slug: "muut-varusteet",
        attributes: [
          ...gearBaseAttrs,
          {
            key: "accessoryType",
            label: "Tyyppi",
            type: "select",
            options: [
              "Laukut",
              "Peräkärryt",
              "Työkalut",
              "Lokasuojat",
              "Reput",
              "Lukot",
              "Tarakka",
              "Muu",
            ],
            filterable: true,
          },
        ],
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

export function getAllAttributes(): Array<{
  key: string;
  label: string;
  type: string;
  options: string | null;
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
    options: attr.options ? JSON.stringify(attr.options) : null,
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
