import type { TrackAdRecipe, TrackBRecipe } from "./types";

export const trackA: TrackAdRecipe[] = [
  {
    name: "Beef & Hidden-Veg Bolognese",
    time: "~15 min reheat",
    single:
      "500g beef mince, 1 onion, 2 carrots (grated), 1 butternut or zucchini (grated), 2 cloves garlic, 2 tins chopped tomatoes, 2 tbsp tomato paste, 1 beef stock cube, Italian herbs.",
    quad: "2kg mince, 4 onions, 8 carrots, 4 butternut/zucchini, 8 garlic cloves, 8 tins tomatoes, 8 tbsp paste, 4 stock cubes.",
    method:
      "Brown mince in batches, sauté onion/garlic/grated veg, combine with tomatoes and stock, simmer 35 min. Cool, portion sauce only into 4 tubs, freeze.",
    reheat:
      "Thaw overnight or defrost in microwave; simmer sauce 8–10 min while pasta boils (400g pasta cooked fresh). ~15 min total.",
  },
  {
    name: "Mild Chicken & Butternut Curry",
    time: "~20 min reheat",
    single:
      "600g chicken thigh fillets (diced), 1 onion, 2 cups butternut (cubed), 1 tin coconut milk, 2 tbsp mild curry powder, 1 tin chopped tomatoes, chicken stock.",
    quad: "2.4kg chicken thigh, 4 onions, 8 cups butternut, 4 tins coconut milk, 8 tbsp mild curry powder, 4 tins tomatoes.",
    method:
      "Sauté onion, brown chicken, add butternut/spices/liquids, simmer 25 min until chicken is cooked and butternut is soft. Cool, portion into 4 tubs, freeze.",
    reheat:
      "Thaw; reheat gently on low heat 10 min (don't boil hard — coconut milk can split). Serve over fresh rice. ~20 min total.",
  },
  {
    name: "Cottage Pie",
    time: "45–50 min oven, no hands-on",
    single:
      "500g beef mince, 1 onion, 2 carrots (diced), 1 cup frozen peas, 2 tbsp tomato paste, 1 cup beef stock, topping: 1kg potatoes mashed with butter and milk.",
    quad: "2kg mince, 4 onions, 8 carrots, 4 cups peas, 8 tbsp paste, 4 cups stock, 4kg potatoes.",
    method:
      "Cook mince filling, make mash topping, assemble in 4 separate foil trays. Cool completely, cover, freeze whole (unbaked).",
    reheat:
      "Straight from freezer into a 200°C oven, 45–50 min (or 30 min if thawed overnight). Zero hands-on time — just the oven.",
  },
  {
    name: "Chicken Alfredo-Style Pasta Bake",
    time: "~20 min reheat",
    single:
      "500g chicken breast (diced), 1 onion, 2 cups mushrooms (sliced), 500ml cream or white sauce, 1 cup grated cheese, 2 cloves garlic.",
    quad: "2kg chicken breast, 4 onions, 8 cups mushrooms, 2 litres cream/white sauce, 4 cups grated cheese.",
    method: "Cook chicken and mushrooms, make the sauce, combine. Cool, portion sauce + chicken (no pasta) into 4 tubs, freeze.",
    reheat:
      "Thaw; reheat gently on stovetop 10 min (low heat, don't boil). Toss with freshly cooked pasta (400g/dinner). ~20 min total.",
  },
  {
    name: "Mild Chilli Con Carne",
    time: "~20 min reheat",
    single:
      "500g beef mince, 1 onion, 1 bell pepper (diced), 1 tin kidney beans (drained), 1 tin chopped tomatoes, 2 tbsp mild paprika/chilli seasoning, 1 tbsp tomato paste.",
    quad: "2kg mince, 4 onions, 4 peppers, 4 tins kidney beans, 4 tins tomatoes, 8 tbsp mild seasoning, 4 tbsp paste.",
    method: "Brown mince, sauté veg, add beans/tomatoes/seasoning, simmer 25 min. Cool, portion into 4 tubs, freeze.",
    reheat: "Thaw; simmer 10 min. Serve over rice with grated cheese on the side so kids can self-adjust. ~20 min total.",
  },
];

export const trackB: TrackBRecipe[] = [
  {
    name: "Quick Beef Mince & Pasta",
    time: "25 min",
    ingredients: "Beef mince, jarred/tinned tomato pasta sauce, pasta, grated cheese.",
    method: "Brown mince, stir through sauce, simmer 10 min while pasta boils.",
  },
  {
    name: "Crumbed Chicken + Oven Chips",
    time: "25 min, mostly oven",
    ingredients: "Frozen crumbed chicken pieces, frozen oven chips, frozen peas or corn.",
    method: "Everything goes in the oven at once — minimal hands-on time.",
  },
  {
    name: "Sausages, Mash & Gravy",
    time: "20 min",
    ingredients: "Sausages, instant mash or quick-boiled potatoes, gravy granules, frozen green beans.",
    method: "Pan or oven the sausages, boil/microwave mash, warm gravy, steam beans.",
  },
  {
    name: "Chicken Fried Rice",
    time: "15–20 min",
    ingredients: "Pre-cooked/pouch rice, chicken strips, egg, frozen stir-fry veg mix, soy sauce.",
    method: "Everything in one pan — cook chicken, scramble egg through, add rice and veg, splash of soy.",
  },
  {
    name: "Chicken Quesadillas",
    time: "15 min",
    ingredients: "Tortilla wraps, shredded cooked/rotisserie chicken, grated cheese.",
    method: "Fill wraps, pan-fry until golden and cheese melts. Side of corn.",
  },
  {
    name: "One-Pot Chicken & Rice",
    time: "30 min, mostly unattended",
    ingredients: "Chicken thighs, rice, stock, frozen veg.",
    method: "One pot, simmer and walk away.",
  },
];

export const weekPlanDefaults = [
  {
    day: "Mon",
    meal: "Beef Mince & Pasta",
    note: "Cook 750g mince instead of 500g — extra for Tuesday lunch leftovers.",
  },
  { day: "Tue", meal: "Crumbed Chicken + Oven Chips + Peas", note: "Oven does most of the work." },
  { day: "Wed", meal: "Sausages, Mash & Gravy + Green Beans", note: "Comfort-food night, very low kid-resistance." },
  { day: "Thu", meal: "Chicken Fried Rice", note: "Uses up leftover rice/veg, clears the fridge." },
];

export const shopWeek: [string, string, string][] = [
  ["Beef mince", "750g", "R110"],
  ["Frozen crumbed chicken pieces", "1 box (~600g)", "R90"],
  ["Sausages (pork or beef)", "500g", "R70"],
  ["Chicken breast fillets or strips", "400g", "R70"],
  ["Eggs", "6-pack", "R30"],
  ["Pasta (spaghetti or penne)", "500g", "R25"],
  ["Frozen oven chips", "1kg", "R45"],
  ["Potatoes (or instant mash)", "1kg", "R35"],
  ["Rice", "1kg", "R30"],
  ["Frozen peas", "500g", "R30"],
  ["Frozen stir-fry veg mix", "500g", "R35"],
  ["Frozen green beans", "500g", "R30"],
  ["Onions", "1kg bag", "R25"],
  ["Garlic", "1 bulb/jar", "R15"],
  ["Tinned tomatoes / pasta sauce", "2 tins/jars", "R40"],
  ["Gravy granules", "1 packet", "R20"],
  ["Soy sauce", "1 small bottle", "R25"],
  ["Tomato paste", "1 tube", "R15"],
  ["Grated cheese", "250g", "R55"],
  ["Butter / milk (for mash)", "small", "R30"],
];

export const shopBatch: [string, string, string][] = [
  ["Beef mince (for 3 mince recipes)", "6kg total", "R870"],
  ["Chicken thigh fillets", "2.4kg", "R340"],
  ["Chicken breast", "2kg", "R280"],
  ["Coconut milk", "4 tins", "R140"],
  ["Kidney beans", "4 tins", "R100"],
  ["Chopped tomatoes", "12 tins", "R240"],
  ["Potatoes", "4kg", "R70"],
  ["Cream / white sauce", "2 litres", "R200"],
  ["Mushrooms", "8 cups", "R80"],
  ["Grated cheese", "4 cups", "R110"],
  ["Butternut", "8 cups", "R80"],
  ["Bell peppers", "4", "R60"],
  ["Onions", "16 (or bags)", "R100"],
  ["Garlic", "8 cloves", "R20"],
  ["Curry powder (mild)", "8 tbsp jar", "R40"],
  ["Chilli/paprika seasoning (mild)", "8 tbsp jar", "R35"],
  ["Frozen peas", "4 cups", "R60"],
  ["Beef & chicken stock", "8 cubes/cartons", "R60"],
  ["Weekly fresh pasta/rice (×5 weeks)", "as needed", "R500"],
];

export function defaultTracker(): Record<string, boolean[]> {
  return Object.fromEntries(trackA.map((r) => [r.name, [false, false, false, false]]));
}
