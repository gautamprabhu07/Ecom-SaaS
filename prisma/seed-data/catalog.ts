//Path: prisma/seed-data/catalog.ts
//20 product templates for each of the 10 categories. `subject` is a key in IMAGE_POOLS[category], so the
//photos always match what the title says. Brands are fictional.

export type ProductTemplate = {
  category: string;
  subCategory: string;
  subject: string;
  title: string;
  brand: string;
  min: number;
  max: number;
  blurb: string;
  features: string[];
  tags: string[];
};

const make =
  (category: string) =>
  (
    subCategory: string,
    subject: string,
    title: string,
    brand: string,
    min: number,
    max: number,
    blurb: string,
    features: string,
    tags: string,
  ): ProductTemplate => ({
    category,
    subCategory,
    subject,
    title,
    brand,
    min,
    max,
    blurb,
    features: features.split(";"),
    tags: tags.split(","),
  });

const E = make("Electronics");
const F = make("Fashion");
const H = make("Home & Garden");
const B = make("Health & Beauty");
const S = make("Sports & Outdoors");
const T = make("Toys & Games");
const G = make("Groceries");
const K = make("Books & Stationery");
const P = make("Pet Supplies");
const V = make("Gaming");

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ---------------------------------------------------------------- Electronics
  E("Mobile Phones", "phone", "Nova X12 5G Smartphone, 128GB", "Novaphone", 349, 449, "A fast 5G smartphone with a bright display and a battery that comfortably lasts a full day.", "6.5-inch OLED display;128GB storage with microSD slot;5000mAh battery with fast charging", "5g,android,dual sim"),
  E("Mobile Phones", "phone", "Nova X12 Pro, 256GB Dual SIM", "Novaphone", 549, 699, "The flagship of the Nova range: a triple-lens camera, a 120Hz screen and plenty of storage.", "120Hz AMOLED display;50MP triple camera;256GB storage", "5g,flagship,camera phone"),
  E("Mobile Phones", "phone", "Lumen S8 Compact Smartphone", "Lumen", 199, 279, "A pocket-friendly phone that does the everyday things well without the flagship price.", "5.8-inch display;Dual rear cameras;All-day battery", "budget,compact,android"),
  E("Mobile Phones", "phone", "Aero Mini Smartphone with Triple Camera", "Aero", 279, 379, "Small in the hand, big on photos, with a triple-camera system tuned for low light.", "Triple camera with night mode;Face unlock and fingerprint sensor;64GB storage", "camera phone,night mode,compact"),
  E("Laptops", "laptop", "Kestrel ProBook 15 Ultrabook, 16GB RAM", "Kestrel", 899, 1199, "A slim, quiet ultrabook built for long work days, with a sharp 15-inch screen and 16GB of RAM.", "16GB RAM, 512GB SSD;15.6-inch Full HD display;Up to 12 hours of battery", "ultrabook,work,16gb"),
  E("Laptops", "laptop", "Kestrel Air 14 Lightweight Laptop", "Kestrel", 749, 949, "At just 1.2kg it slips into any bag, yet still has the power for spreadsheets, calls and light editing.", "1.2kg aluminium body;14-inch display;Fast charging via USB-C", "lightweight,portable,usb-c"),
  E("Laptops", "laptop", "Orbit StudyBook 13 Everyday Laptop", "Orbit", 449, 599, "An affordable laptop for students: reliable, light, and ready for assignments and streaming.", "13.3-inch display;8GB RAM, 256GB SSD;Backlit keyboard", "student,budget,everyday"),
  E("Laptops", "laptop", "Orbit Creator 16 Laptop, 4K Display", "Orbit", 1299, 1699, "A creator-grade laptop with a colour-accurate 4K panel and a dedicated graphics card for editing.", "16-inch 4K OLED display;Dedicated graphics;32GB RAM, 1TB SSD", "4k,creator,editing"),
  E("Laptops", "tablet", "Slate 11 Tablet with Stylus", "Slate", 329, 479, "A responsive 11-inch tablet with a pressure-sensitive stylus for notes, sketching and streaming.", "11-inch Liquid display;Stylus included;Up to 10 hours of battery", "tablet,stylus,drawing"),
  E("Audio", "headphones", "Pulse Wireless Over-Ear Headphones", "Pulse Audio", 89, 149, "Comfortable wireless headphones with rich bass and a battery that keeps going for days.", "40-hour battery life;Bluetooth 5.2;Memory-foam ear cushions", "wireless,bluetooth,over-ear"),
  E("Audio", "headphones", "Studio Pro Noise-Cancelling Headphones", "Pulse Audio", 179, 279, "Active noise cancelling that switches the world off, with a balanced sound for music and calls.", "Adaptive noise cancelling;30-hour battery;Multipoint pairing", "noise cancelling,anc,travel"),
  E("Audio", "headphones", "Clarity Wired Studio Headphones", "Clarity", 49, 89, "Honest, detailed sound for monitoring and mixing, with a detachable cable for easy replacement.", "Closed-back design;Detachable 3m cable;40mm drivers", "wired,studio,monitoring"),
  E("Audio", "earbuds", "Buds Air True Wireless Earbuds", "Pulse Audio", 59, 99, "Tiny earbuds with a surprisingly full sound and a charging case that holds three extra charges.", "Up to 24 hours with the case;Touch controls;IPX4 sweat resistance", "earbuds,true wireless,compact"),
  E("Audio", "speaker", "Boom Mini Waterproof Bluetooth Speaker", "Boom", 39, 79, "A rugged little speaker that survives the beach, the pool and the occasional drop.", "IP67 waterproof;12-hour playtime;Pairs two speakers for stereo", "bluetooth,waterproof,portable"),
  E("Cameras", "camera", "Frame DSLR Camera with 18-55mm Lens", "Frame", 549, 749, "An easy-to-learn DSLR with a sharp kit lens, ideal for moving from phone photos to real photography.", "24MP sensor;Full HD video;Built-in Wi-Fi", "dslr,photography,beginner"),
  E("Cameras", "instant", "Snap Instant Film Camera", "Snap", 79, 129, "Take a photo and watch it develop in your hands: a fun, nostalgic camera for parties and travel.", "Prints in under 2 minutes;Built-in flash;Self-timer", "instant,film,retro"),
  E("Accessories", "smartwatch", "Pace Fit Smartwatch with Heart Rate", "Pace", 79, 139, "Tracks your steps, sleep and workouts, and puts your notifications on your wrist.", "Heart-rate and sleep tracking;7-day battery;Water resistant to 50m", "smartwatch,fitness,tracker"),
  E("Accessories", "charger", "Volt 65W USB-C Fast Charger", "Volt", 19, 39, "One compact charger for your laptop, tablet and phone, with enough power to charge them quickly.", "65W USB-C output;Foldable plug;Works with laptops and phones", "charger,usb-c,fast charging"),
  E("Accessories", "keyboard", "Slim Wireless Keyboard", "Orbit", 29, 59, "A low-profile, quiet keyboard that pairs with up to three devices and switches between them in a tap.", "Bluetooth, 3-device pairing;Rechargeable battery;Quiet scissor keys", "keyboard,wireless,productivity"),
  E("Accessories", "mouse", "Precision Wireless Mouse", "Orbit", 19, 39, "A comfortable, accurate mouse with a silent click and a battery that lasts for months.", "Silent buttons;Adjustable DPI;12-month battery", "mouse,wireless,silent"),

  // ---------------------------------------------------------------- Fashion
  F("Men's Clothing", "tshirt", "Essential Crew Neck Cotton Tee", "Thread & Thimble", 14, 24, "A soft, heavyweight cotton tee that holds its shape wash after wash.", "100% combed cotton;Pre-shrunk;Reinforced collar", "tshirt,cotton,basics"),
  F("Men's Clothing", "graphictee", "Retro Print Relaxed-Fit Tee", "Thread & Thimble", 19, 29, "A relaxed tee with a vintage-inspired print and a soft, lived-in feel from the first wear.", "Relaxed fit;Screen-printed graphic;Soft-washed cotton", "graphic tee,relaxed fit,casual"),
  F("Men's Clothing", "jeans", "Slim-Fit Stretch Denim Jeans", "Thread & Thimble", 39, 69, "A modern slim fit with just enough stretch to stay comfortable from morning to night.", "98% cotton, 2% elastane;Slim tapered leg;Classic five-pocket styling", "jeans,denim,slim fit"),
  F("Men's Clothing", "jacket", "Black Faux Leather Biker Jacket", "Thread & Thimble", 79, 139, "A sharp biker jacket in supple faux leather that works over a tee or a shirt.", "Faux leather shell;Asymmetric zip;Quilted lining", "jacket,biker,faux leather"),
  F("Men's Clothing", "sweater", "Chunky Knit Crew Sweater", "Thread & Thimble", 44, 74, "A thick, warm sweater with a relaxed drop shoulder, made for cold mornings.", "Soft cotton-blend yarn;Ribbed cuffs and hem;Relaxed fit", "sweater,knitwear,winter"),
  F("Women's Clothing", "knitwear", "Cream Fringe Knit Poncho", "Thread & Thimble", 34, 59, "A cosy poncho with a delicate fringe that layers easily over a tee or a dress.", "Lightweight open knit;One size;Hand-wash friendly", "poncho,knitwear,layering"),
  F("Women's Clothing", "coat", "Powder Blue Long Wool-Blend Coat", "Thread & Thimble", 99, 179, "A long, tailored coat in a soft blue that makes a winter outfit feel effortless.", "Wool-blend fabric;Full lining;Side pockets", "coat,wool,winter"),
  F("Women's Clothing", "womenstee", "Skeleton Hand Graphic Crop Tee", "Thread & Thimble", 17, 27, "A cropped tee with a bold hand graphic that pairs with high-waisted jeans.", "Cropped cut;Soft cotton jersey;Printed graphic", "crop top,graphic tee,streetwear"),
  F("Women's Clothing", "sweater", "Autumn Layering Set: Beanie & Sweater", "Thread & Thimble", 44, 74, "A matching beanie and sweater set that takes the guesswork out of cold-weather layering.", "Knit sweater and beanie;Soft acrylic blend;Gift-ready", "layering,beanie,autumn"),
  F("Women's Clothing", "wardrobe", "Neutral Wardrobe Staples Cardigan", "Thread & Thimble", 49, 79, "A neutral cardigan that sits comfortably alongside everything else in your wardrobe.", "Soft-touch knit;Button front;Machine washable", "cardigan,neutral,staples"),
  F("Footwear", "sneakers", "Crimson Flyknit Running Shoes", "Stride", 69, 119, "Breathable knit running shoes with a cushioned sole and a bold crimson finish.", "Breathable knit upper;Cushioned midsole;Grippy rubber outsole", "running,sneakers,knit"),
  F("Footwear", "trailshoe", "Stealth Trail Running Sneakers", "Stride", 79, 129, "Lightweight trail sneakers with a secure fit and the grip you need on loose ground.", "Lightweight design;Lugged outsole;Snug midfoot fit", "trail,running,lightweight"),
  F("Footwear", "pastelshoe", "Pastel Court Low-Top Sneakers", "Stride", 59, 99, "A soft pastel take on the classic low-top, comfortable enough to wear all day.", "Leather-look upper;Padded collar;Durable rubber sole", "sneakers,pastel,low-top"),
  F("Footwear", "sneakers", "Cloudstep Everyday Walking Shoes", "Stride", 54, 89, "Soft, supportive walking shoes for long days on your feet, from commuting to travelling.", "Cushioned insole;Flexible sole;Breathable lining", "walking,comfort,everyday"),
  F("Bags & Accessories", "handbag", "Tailored Red Leather Handbag", "Maison Verve", 89, 149, "A structured top-handle bag in rich red leather that dresses up everyday outfits.", "Genuine leather;Detachable strap;Magnetic clasp", "handbag,leather,statement"),
  F("Bags & Accessories", "backpack", "Metro Commuter Backpack, Navy", "Maison Verve", 39, 69, "A clean-lined backpack with a padded laptop sleeve and enough room for a day out.", "Padded 15-inch laptop sleeve;Water-resistant fabric;Hidden back pocket", "backpack,commuter,laptop bag"),
  F("Bags & Accessories", "leatherpack", "Vintage Leather Backpack", "Maison Verve", 79, 129, "A rugged leather backpack that develops character with every year you carry it.", "Full-grain leather;Adjustable straps;Two front pockets", "backpack,leather,vintage"),
  F("Bags & Accessories", "sunglasses", "Classic Black Wayfarer Sunglasses", "Maison Verve", 24, 49, "A timeless frame that suits almost every face and carries UV protection.", "UV400 lenses;Durable acetate frame;Includes case", "sunglasses,wayfarer,uv protection"),
  F("Bags & Accessories", "watch", "Minimal White Dial Watch", "Maison Verve", 49, 89, "A clean, minimal watch with a soft silicone strap that goes from the gym to dinner.", "Japanese quartz movement;Water resistant;Silicone strap", "watch,minimal,everyday"),
  F("Bags & Accessories", "handbag", "Structured Mini Crossbody Bag", "Maison Verve", 59, 99, "A mini crossbody that holds the essentials and still looks polished.", "Adjustable strap;Zip closure;Interior card slots", "crossbody,mini bag,leather"),

  // ---------------------------------------------------------------- Home & Garden
  H("Furniture", "sofa", "Emerald Velvet 3-Seater Sofa", "Hearth & Hedge", 499, 799, "A deep emerald velvet sofa that becomes the centrepiece of the room.", "Soft velvet upholstery;Solid wood legs;High-density foam seats", "sofa,velvet,living room"),
  H("Furniture", "sofa2", "Tufted Grey Chesterfield Sofa", "Hearth & Hedge", 599, 899, "A classic button-tufted sofa with generous proportions and a timeless silhouette.", "Button-tufted back;Linen-blend fabric;Comfortable seat depth", "sofa,tufted,classic"),
  H("Furniture", "sofa3", "Sky Blue Loveseat with Cushions", "Hearth & Hedge", 399, 649, "A compact two-seater in a calm blue that suits smaller living spaces and reading corners.", "Includes 4 cushions;Compact footprint;Easy assembly", "loveseat,compact,cushions"),
  H("Furniture", "armchair", "Mustard Accent Armchair", "Hearth & Hedge", 199, 329, "A bright accent chair that adds a pop of colour and a comfortable place to sit.", "Mid-century styling;Curved backrest;Solid wood legs", "armchair,accent,mustard"),
  H("Furniture", "bed", "Upholstered Tufted Queen Bed Frame", "Hearth & Hedge", 549, 849, "An upholstered queen bed with a tall tufted headboard for a hotel-style bedroom.", "Tufted headboard;Sturdy slatted base;Queen size", "bed,queen,upholstered"),
  H("Furniture", "chair", "Minimal Shell Chair, White", "Hearth & Hedge", 59, 99, "A moulded shell chair on beech legs, equally at home at a desk or dining table.", "Moulded seat;Solid beech legs;Stackable", "chair,minimal,dining"),
  H("Kitchenware", "dutchoven", "Enamelled Cast Iron Dutch Oven, 5Qt", "Hearth & Hedge", 59, 99, "Slow-cooks stews, soups and bread beautifully, and looks good enough to bring to the table.", "Enamelled cast iron;Oven safe to 260C;Tight-fitting lid", "cookware,dutch oven,cast iron"),
  H("Kitchenware", "knives", "Chef's Knife Roll Set, 5 Piece", "Hearth & Hedge", 69, 119, "A balanced five-piece knife set with a leather roll for tidy storage and travel.", "High-carbon steel blades;Wooden handles;Leather knife roll", "knives,chef,kitchen"),
  H("Kitchenware", "mug", "Stoneware Mug, Matte White", "Hearth & Hedge", 9, 16, "A heavy, comfortable stoneware mug with a matte finish that keeps drinks warm.", "Dishwasher safe;350ml;Microwave safe", "mug,stoneware,coffee"),
  H("Kitchenware", "ceramics", "Handmade Ceramic Bowl Set of 4", "Hearth & Hedge", 29, 49, "Four hand-glazed bowls in earthy tones for breakfast, soup or snacks.", "Set of four;Hand-glazed finish;Dishwasher safe", "bowls,ceramic,handmade"),
  H("Kitchenware", "kitchen", "Copper-Accent Cookware Starter Kit", "Hearth & Hedge", 99, 179, "A matched set of pots and pans with copper-toned accents that heat evenly and clean up easily.", "Five-piece cookware set;Non-stick interior;Induction compatible", "cookware,starter kit,non-stick"),
  H("Decor", "livingroom", "Boho Living Room Decor Set", "Hearth & Hedge", 49, 89, "A curated set of textured pieces that gives any living room a warm, bohemian feel.", "Mixed natural textures;Easy to style;Neutral palette", "boho,decor,living room"),
  H("Decor", "lamp", "Industrial Floor Lamp, Matte Grey", "Hearth & Hedge", 39, 69, "A bold floor lamp with an adjustable shade that casts focused light where you need it.", "Adjustable head;Weighted base;E27 bulb", "lamp,industrial,lighting"),
  H("Decor", "pillow", "Feather-Soft Hotel Pillow", "Hearth & Hedge", 19, 35, "A plump, supportive pillow with a soft cotton cover and a hotel-style feel.", "Hypoallergenic fill;Cotton cover;Machine washable", "pillow,bedding,hypoallergenic"),
  H("Decor", "rug", "Persian-Style Area Rug, 5x7ft", "Hearth & Hedge", 129, 219, "A softly patterned area rug that adds warmth and colour underfoot.", "Low pile;Non-slip backing;Stain-resistant", "rug,persian,area rug"),
  H("Decor", "candle", "Soy Wax Scented Candle, Vanilla", "Hearth & Hedge", 14, 24, "A slow-burning soy candle with a warm vanilla fragrance for relaxed evenings.", "Natural soy wax;40-hour burn time;Cotton wick", "candle,vanilla,soy wax"),
  H("Decor", "planter", "Mint Ceramic Planter with Succulent", "Hearth & Hedge", 15, 29, "A cheerful mint planter with a hardy succulent that needs very little care.", "Includes live succulent;Drainage hole;Glazed ceramic", "planter,succulent,desk plant"),
  H("Gardening Tools", "gardentools", "Garden Trowel & Hand Pruner Set", "Hearth & Hedge", 19, 34, "A sturdy trowel and sharp pruners for planting, potting and keeping beds tidy.", "Stainless steel heads;Ergonomic grips;Rust resistant", "garden,trowel,pruner"),
  H("Gardening Tools", "seedlings", "Seed Starter Pot Kit, 24 Pots", "Hearth & Hedge", 14, 26, "Everything you need to start seeds indoors and transplant healthy seedlings.", "24 biodegradable pots;Drip tray included;Plant markers", "seeds,starter kit,gardening"),
  H("Gardening Tools", "succulents", "Assorted Succulent Collection, 6 Pack", "Hearth & Hedge", 22, 38, "Six easy-care succulents in assorted shapes, ready to pot or arrange.", "Six live plants;Low maintenance;Shipped in protective packaging", "succulents,plants,low maintenance"),

  // ---------------------------------------------------------------- Health & Beauty
  B("Skincare", "skincare", "Gentle Daily Face Cleanser, 150ml", "Dewdrop", 14, 24, "A mild gel cleanser that removes the day without leaving skin tight or dry.", "Fragrance free;Suitable for sensitive skin;pH balanced", "cleanser,face wash,sensitive skin"),
  B("Skincare", "skincare2", "Overnight Hydrating Face Cream", "Dewdrop", 22, 38, "A rich night cream that works while you sleep and leaves skin plump by morning.", "Hyaluronic acid;Non-greasy texture;Dermatologist tested", "night cream,hydration,moisturiser"),
  B("Skincare", "skincare3", "Vitamin C Brightening Moisturiser", "Dewdrop", 24, 42, "A lightweight daily moisturiser with vitamin C to help even tone and brighten dull skin.", "10% vitamin C;SPF-friendly base;Lightweight gel-cream", "vitamin c,brightening,moisturiser"),
  B("Skincare", "bodylotion", "Nourishing Body Lotion, 250ml", "Dewdrop", 12, 20, "A creamy lotion that absorbs fast and keeps skin soft for the whole day.", "Shea butter;Fast absorbing;Light natural scent", "body lotion,shea butter,moisturising"),
  B("Skincare", "mask", "Clay Detox Face Mask", "Dewdrop", 16, 28, "A purifying clay mask that draws out impurities and leaves skin feeling fresh.", "Kaolin clay;Weekly treatment;Suitable for oily skin", "face mask,clay,detox"),
  B("Skincare", "handcream", "Hand Cream & Cuticle Care Duo", "Dewdrop", 9, 16, "A rich hand cream and cuticle balm that rescue dry, tired hands.", "Quick absorbing;Travel-sized tubes;Non-sticky", "hand cream,cuticle,dry skin"),
  B("Skincare", "skincareset", "Skincare Starter Trio Set", "Dewdrop", 39, 65, "A cleanser, moisturiser and treatment in one gift-ready set: a simple routine, done.", "Three full-size products;Gift ready;Dermatologist tested", "skincare set,gift,routine"),
  B("Makeup", "palette", "Studio Contour & Bronzer Palette", "Velour", 24, 38, "A blendable bronzer, contour and highlight palette for easy everyday sculpting.", "Buildable colour;Blendable formula;Mirror included", "contour,bronzer,palette"),
  B("Makeup", "brushes", "Professional Makeup Brush Set, 12 pcs", "Velour", 22, 36, "Twelve soft, dense brushes covering every step from foundation to eyeshadow.", "12 brushes with case;Synthetic bristles;Vegan", "brushes,makeup tools,vegan"),
  B("Makeup", "palette", "Eyeshadow Palette, 35 Shades", "Velour", 26, 44, "Thirty-five matte and shimmer shades for everything from daytime neutrals to bold looks.", "35 pigmented shades;Matte and shimmer;Long wearing", "eyeshadow,palette,pigmented"),
  B("Makeup", "lipstick", "Velvet Matte Lipstick", "Velour", 12, 20, "A comfortable matte lipstick with rich colour that lasts through the day.", "Long-wearing;Comfortable matte finish;Cruelty free", "lipstick,matte,long wear"),
  B("Makeup", "makeup", "Everyday Makeup Starter Kit", "Velour", 34, 56, "A well-chosen set of essentials for a quick, polished everyday look.", "Compact and travel friendly;Blush, bronzer and highlighter;Easy shades", "makeup kit,starter,everyday"),
  B("Makeup", "artistkit", "Pro Artist Pigment Palette Collection", "Velour", 39, 65, "A professional collection of vivid pigments and liners for bold, creative looks.", "Highly pigmented;Wide shade range;Studio quality", "artist,pigment,creative"),
  B("Haircare", "hairmask", "Restorative Hair Mask, 200ml", "Dewdrop", 15, 26, "A deeply conditioning mask that repairs dry, damaged hair in just five minutes.", "Argan and keratin;Five-minute treatment;Sulphate free", "hair mask,repair,conditioning"),
  B("Haircare", "haircare", "Silk Smooth Shampoo & Conditioner Duo", "Dewdrop", 18, 30, "A gentle shampoo and conditioner pair that leaves hair soft, shiny and manageable.", "Sulphate free;Colour-safe;Light fragrance", "shampoo,conditioner,smooth hair"),
  B("Haircare", "serum", "Argan Oil Hair Serum", "Dewdrop", 14, 24, "A lightweight finishing oil that tames frizz and adds shine without weighing hair down.", "Pure argan oil;Heat protection;Non-greasy", "argan oil,hair serum,frizz control"),
  B("Wellness", "oil", "Aromatherapy Massage Oil", "Dewdrop", 14, 24, "A calming blend of essential oils for a relaxing massage or a quiet evening ritual.", "Essential oil blend;Lavender and chamomile;Glass dropper bottle", "massage oil,aromatherapy,relaxation"),
  B("Wellness", "jaderoller", "Jade Facial Roller Ritual Set", "Dewdrop", 19, 32, "A cooling jade roller and gua sha set to help de-puff and relax your skin.", "Natural jade stone;Roller and gua sha;Storage pouch", "jade roller,gua sha,facial massage"),
  B("Wellness", "spa", "At-Home Spa Facial Treatment Kit", "Dewdrop", 29, 49, "A complete at-home facial: cleanse, mask and moisturise like you are at the spa.", "Includes mask and treatment;Step-by-step guide;Gift ready", "spa,facial,self care"),
  B("Wellness", "serum", "Botanical Body Oil Gift Set", "Dewdrop", 24, 39, "Two botanical body oils in a gift box: nourishing, lightly scented and quick to absorb.", "Two 50ml oils;Plant-derived;Gift box", "body oil,gift set,botanical"),

  // ---------------------------------------------------------------- Sports & Outdoors
  S("Fitness Equipment", "barbell", "Olympic Barbell Set with Weight Plates", "Summit", 189, 299, "A complete barbell set for serious home strength training, built to last.", "7ft Olympic barbell;Cast iron plates;Collars included", "barbell,strength,weights"),
  S("Fitness Equipment", "dumbbells", "Rubber Hex Dumbbell Pair, 20kg", "Summit", 49, 89, "Rubber-coated hex dumbbells that will not roll away or damage your floor.", "Rubber coated;Knurled steel handle;Non-roll hex shape", "dumbbells,hex,home gym"),
  S("Fitness Equipment", "gymrack", "Home Gym Dumbbell Rack, 5 Pairs", "Summit", 249, 399, "A tidy rack and five pairs of dumbbells that turns a spare corner into a gym.", "Five dumbbell pairs;Sturdy steel rack;Stable base", "dumbbell rack,home gym,weights"),
  S("Fitness Equipment", "pullup", "Doorway Pull-Up Bar, Heavy Duty", "Summit", 29, 49, "A secure doorway bar for pull-ups, chin-ups and hanging core work, with no drilling.", "No screws needed;Supports 150kg;Padded grips", "pull-up bar,bodyweight,home workout"),
  S("Fitness Equipment", "yoga", "Premium Yoga Mat, 6mm", "Summit", 24, 44, "A cushioned, non-slip mat that supports your joints through every flow.", "6mm cushioning;Non-slip surface;Carry strap included", "yoga mat,non-slip,fitness"),
  S("Fitness Equipment", "situps", "Ab Roller & Sit-Up Mat Set", "Summit", 19, 34, "A simple core-training set: an ab roller with a padded mat for your knees.", "Wide stable wheel;Padded knee mat;Compact storage", "ab roller,core,workout"),
  S("Fitness Equipment", "treadmill", "Foldable Home Treadmill", "Summit", 349, 549, "A compact folding treadmill with a quiet motor and preset programmes.", "Folds flat for storage;12 preset programmes;Heart-rate sensors", "treadmill,cardio,foldable"),
  S("Fitness Equipment", "deadlift", "Lifting Straps & Chalk Kit", "Summit", 19, 34, "Lifting straps and gym chalk to keep your grip going through heavy sets.", "Padded cotton straps;Gym chalk block;Storage bag", "lifting straps,chalk,grip"),
  S("Outdoor Gear", "tent", "4-Season Dome Camping Tent, 3 Person", "Summit", 89, 159, "A stable, weatherproof dome tent that goes up fast and sleeps three comfortably.", "Waterproof flysheet;Sets up in 5 minutes;Sleeps three", "tent,camping,4-season"),
  S("Outdoor Gear", "hiking", "Trekking Backpack, 50L", "Summit", 69, 119, "A supportive 50L pack with a ventilated back panel for multi-day hikes.", "50L capacity;Ventilated back panel;Rain cover included", "backpack,trekking,hiking"),
  S("Outdoor Gear", "hiking", "Carbon Trekking Poles, Pair", "Summit", 34, 59, "Lightweight carbon poles that fold small and take weight off your knees.", "Carbon fibre;Collapsible;Cork grips", "trekking poles,carbon,hiking"),
  S("Outdoor Gear", "tent", "Lightweight Sleeping Bag, -5C", "Summit", 49, 89, "A warm, compact sleeping bag rated to -5C for spring, autumn and mild-winter camping.", "-5C comfort rating;Compression sack included;Water-resistant shell", "sleeping bag,camping,warm"),
  S("Outdoor Gear", "hiking", "Waterproof Hiking Shell Jacket", "Summit", 79, 139, "A breathable, waterproof shell that keeps you dry on the trail without overheating.", "Waterproof and breathable;Adjustable hood;Packable", "jacket,waterproof,hiking"),
  S("Sportswear", "runningshoes", "Breathable Running Shoes, Coral", "Stride", 59, 99, "A light, responsive running shoe with a breathable upper and a bright coral finish.", "Breathable mesh;Responsive cushioning;Lightweight", "running shoes,breathable,training"),
  S("Sportswear", "swimming", "Competition Swim Goggles & Cap Set", "Stride", 15, 28, "Anti-fog goggles and a silicone cap for laps in the pool or open water.", "Anti-fog lenses;UV protection;Silicone cap", "swimming,goggles,swim cap"),
  S("Sportswear", "sprint", "Sprint Track Spikes", "Stride", 69, 109, "Light, snappy spikes designed for short-distance track events.", "Lightweight plate;Removable spikes;Secure lacing", "spikes,track,sprint"),
  S("Cycling", "bicycle", "Fixie Single-Speed Road Bicycle", "Summit", 299, 479, "A clean, simple single-speed bike that is fast, light and easy to maintain.", "Single-speed drivetrain;Lightweight frame;Flip-flop hub", "bicycle,fixie,road bike"),
  S("Cycling", "cyclingrace", "Aero Road Cycling Helmet", "Summit", 49, 89, "A ventilated, aerodynamic helmet with an adjustable fit and plenty of airflow.", "In-mould construction;Adjustable fit system;Ventilated", "helmet,cycling,aero"),
  S("Cycling", "cyclist", "Pro Team Cycling Jersey", "Summit", 34, 59, "A breathable, close-fitting jersey with rear pockets for the long ride.", "Moisture-wicking fabric;Three rear pockets;Full-length zip", "jersey,cycling,breathable"),
  S("Cycling", "cyclingrace", "Padded Cycling Shorts", "Summit", 29, 49, "Comfortable padded shorts that take the sting out of long rides.", "Gel padding;Flat seams;Stretch fabric", "cycling shorts,padded,comfort"),

  // ---------------------------------------------------------------- Toys & Games
  T("Board Games", "boardgame", "Island Settlers Strategy Board Game", "Little Quest", 29, 49, "Trade, build and outsmart your friends in a strategy game that stays fresh with every play.", "3 to 4 players;Playtime about 75 minutes;Ages 10+", "strategy,board game,family"),
  T("Board Games", "chess", "Classic Hardwood Chess Set", "Little Quest", 34, 59, "A beautifully weighted wooden chess set that is a pleasure to play and to display.", "Hardwood pieces;Folding board;Felt-lined bases", "chess,wooden,classic"),
  T("Board Games", "boardgames", "Family Game Night Bundle, 5 Games", "Little Quest", 39, 65, "Five classic games in one box: everything you need for a family game night.", "Five games;Ages 6+;Storage box", "board games,family,bundle"),
  T("Board Games", "gamedice", "Word Dice Party Game", "Little Quest", 12, 22, "A quick, noisy word game played with letter dice: easy to learn, hard to put down.", "2 to 8 players;Playtime about 15 minutes;Travel size", "dice,party game,words"),
  T("Board Games", "dominoes", "Double-Six Domino Set, 28 pcs", "Little Quest", 12, 22, "A full set of double-six dominoes with a storage tin, great for travel and family time.", "28 pieces;Storage tin;Classic rules included", "dominoes,classic,travel"),
  T("Board Games", "boardgame", "Deluxe Tabletop Adventure Game", "Little Quest", 44, 74, "A cooperative adventure game with a modular board and a story that unfolds over many nights.", "Cooperative play;Modular board;Ages 12+", "adventure,cooperative,tabletop"),
  T("Puzzles", "puzzle", "1000-Piece Jigsaw Puzzle, Autumn Mosaic", "Little Quest", 14, 24, "A richly coloured 1000-piece puzzle that makes a relaxing weekend project.", "1000 pieces;Sturdy linen-finish board;Poster included", "jigsaw,1000 piece,relaxing"),
  T("Puzzles", "puzzle", "500-Piece Family Jigsaw Puzzle", "Little Quest", 11, 19, "A friendly 500-piece puzzle sized for the whole family to work on together.", "500 pieces;Ages 8+;Anti-glare finish", "jigsaw,family,500 piece"),
  T("Puzzles", "puzzle", "Brain Teaser Puzzle Collection", "Little Quest", 15, 26, "A mixed collection of mind-bending puzzles to keep curious minds busy.", "Multiple puzzle types;Ages 8+;Solutions included", "brain teaser,logic,puzzle"),
  T("Action Figures", "robot", "Retro Tin Robot Collectible", "Little Quest", 24, 44, "A vintage-style tin robot with a retro finish that looks great on a shelf.", "Tin construction;Retro styling;Collector's box", "robot,retro,collectible"),
  T("Action Figures", "figures", "Plumber Hero Figure Set, 4 pc", "Little Quest", 29, 49, "A four-piece set of colourful hero figures ready for adventure.", "Four figures;Poseable;Ages 4+", "figures,heroes,collectible"),
  T("Action Figures", "troopers", "Galactic Trooper Mini Figure Pack", "Little Quest", 19, 34, "A pack of mini trooper figures for display, play or building scenes.", "Pack of mini figures;Detailed paint;Ages 6+", "mini figures,space,collectible"),
  T("Action Figures", "toycar", "Diecast Convertible Toy Car, Red", "Little Quest", 12, 22, "A detailed diecast convertible with rolling wheels and a glossy red finish.", "Diecast metal;Rolling wheels;Collector grade", "diecast,toy car,collectible"),
  T("Action Figures", "vintagecar", "Vintage Mini Car Collectible, Cream", "Little Quest", 14, 26, "A charming vintage-style mini car in cream that looks great on a desk or shelf.", "Detailed model;Pull-back motor;Ages 3+", "vintage,toy car,collectible"),
  T("Educational Toys", "train", "Wooden Train Set, 42 Pieces", "Little Quest", 39, 69, "A classic wooden train set that builds imagination and fine motor skills.", "42 pieces;Natural wood;Compatible with major track brands", "wooden toys,train,imagination"),
  T("Educational Toys", "bricks", "Creative Building Bricks, 1000 pcs", "Little Quest", 29, 49, "A big box of colourful bricks that fit together for endless building ideas.", "1000 bricks;Compatible with major brands;Storage tub", "building bricks,creative,stem"),
  T("Educational Toys", "blocks", "Alphabet Learning Blocks", "Little Quest", 19, 34, "Chunky wooden alphabet blocks that make early letters and words feel like play.", "Wooden blocks;Non-toxic paint;Ages 2+", "alphabet,learning,wooden"),
  T("Educational Toys", "boats", "Wooden Sailboat Toy Set", "Little Quest", 22, 38, "A set of little wooden sailboats for bath time, pond time or pretend voyages.", "Wooden boats;Smooth finish;Ages 3+", "sailboat,wooden,pretend play"),
  T("Educational Toys", "stacking", "Rainbow Stacking Rings", "Little Quest", 9, 16, "Classic stacking rings that help toddlers learn colours, sizes and coordination.", "Bright colours;Easy-grip rings;Ages 12 months+", "stacking,toddler,colours"),
  T("Educational Toys", "teddy", "Plush Teddy Bear, Cream", "Little Quest", 19, 32, "An irresistibly soft teddy bear, a comforting companion from bedtime to adventure.", "Super-soft plush;Machine washable;Safe for newborns", "teddy,plush,gift"),

  // ---------------------------------------------------------------- Groceries
  G("Snacks", "darkchoc", "Dark Chocolate Chunks, 400g", "Fresh Basket", 9, 15, "Rich, bittersweet dark chocolate chunks for baking, snacking or melting into a hot drink.", "70% cocoa;Resealable bag;Fairtrade cocoa", "chocolate,dark,baking"),
  G("Snacks", "truffles", "Assorted Truffle Gift Box", "Fresh Basket", 18, 30, "A box of handmade chocolate truffles in assorted flavours, ready to gift.", "12 assorted truffles;Handmade;Gift box", "truffles,gift,chocolate"),
  G("Snacks", "chocolates", "Handcrafted Milk Chocolates, 24 pc", "Fresh Basket", 14, 24, "Twenty-four smooth milk chocolates in assorted shapes and fillings.", "24 pieces;Smooth milk chocolate;Assorted fillings", "milk chocolate,treats,gift"),
  G("Snacks", "almonds", "Roasted Almonds, 500g", "Fresh Basket", 8, 14, "Crunchy dry-roasted almonds with nothing added except a pinch of sea salt.", "Dry roasted;Lightly salted;Resealable pouch", "almonds,nuts,healthy snack"),
  G("Snacks", "cookies", "Chocolate Chip Cookies, Bakery Box", "Fresh Basket", 7, 13, "Soft, generous cookies loaded with chocolate chips and baked in small batches.", "Baked in small batches;Real butter;Box of 12", "cookies,chocolate chip,bakery"),
  G("Snacks", "chips", "Baked Cheese Puffs, Family Pack", "Fresh Basket", 4, 8, "Crunchy baked cheese puffs in a family-sized bag, made for sharing.", "Baked, not fried;Real cheese;Family size", "snack,cheese,crunchy"),
  G("Beverages", "coffee", "Single-Origin Coffee Beans, 1kg", "Fresh Basket", 18, 28, "Medium-roast single-origin beans with notes of chocolate and toasted nuts.", "Whole beans;Medium roast;Roasted weekly", "coffee,beans,single origin"),
  G("Beverages", "espresso", "Barista Blend Espresso, 500g", "Fresh Basket", 12, 20, "A smooth, full-bodied espresso blend built for milk drinks and a good crema.", "Dark roast;Balanced and sweet;Great with milk", "espresso,barista,coffee"),
  G("Beverages", "icedtea", "Peach Iced Tea Mix, 12 Pack", "Fresh Basket", 10, 16, "Refreshing peach iced tea sachets: just add cold water and ice.", "12 sachets;Real tea leaves;No artificial colours", "iced tea,peach,summer"),
  G("Beverages", "tea", "Premium Loose-Leaf Tea Selection", "Fresh Basket", 14, 24, "A tasting set of loose-leaf teas, from fragrant green to a robust breakfast black.", "Six varieties;Loose leaf;Resealable tins", "tea,loose leaf,gift"),
  G("Beverages", "juice", "Cold-Pressed Orange Juice, 6 x 330ml", "Fresh Basket", 11, 18, "Cold-pressed orange juice made from sun-ripened fruit, with nothing added.", "100% juice;Cold pressed;No added sugar", "juice,orange,cold pressed"),
  G("Pantry", "honey", "Raw Wildflower Honey, 500g", "Fresh Basket", 8, 14, "Raw, unfiltered wildflower honey with a floral sweetness that is lovely on toast.", "Raw and unfiltered;Locally sourced;Glass jar", "honey,raw,natural"),
  G("Pantry", "oliveoil", "Extra Virgin Olive Oil, 750ml", "Fresh Basket", 12, 22, "A fruity, peppery extra virgin olive oil for dressings, dipping and finishing dishes.", "Cold pressed;First harvest;Dark glass bottle", "olive oil,extra virgin,cooking"),
  G("Pantry", "spices", "Whole Spice Collection, 12 Jars", "Fresh Basket", 24, 39, "Twelve essential whole spices in glass jars, from cumin to cardamom.", "12 jars;Whole spices;Airtight lids", "spices,cooking,collection"),
  G("Pantry", "pasta", "Artisan Pasta Variety Pack", "Fresh Basket", 9, 16, "Bronze-cut artisan pasta in four shapes that hold sauce beautifully.", "Four shapes;Bronze cut;Durum wheat", "pasta,artisan,italian"),
  G("Pantry", "flour", "Stone-Ground Wholemeal Flour, 2kg", "Fresh Basket", 5, 9, "Stone-ground wholemeal flour with a nutty flavour for bread, pancakes and bakes.", "Stone ground;High fibre;2kg bag", "flour,wholemeal,baking"),
  G("Pantry", "bread", "Ancient Grain Sourdough Loaf Mix", "Fresh Basket", 7, 12, "Everything you need for a crusty seeded sourdough loaf at home.", "Ancient grains;Starter included;Step-by-step card", "sourdough,bread,baking"),
  G("Organic", "blueberries", "Organic Blueberries, 500g", "Fresh Basket", 6, 10, "Plump, sweet organic blueberries, picked ripe and packed the same day.", "Certified organic;Hand picked;500g punnet", "blueberries,organic,fruit"),
  G("Organic", "vegbox", "Organic Seasonal Vegetable Box", "Fresh Basket", 19, 32, "A weekly box of organic seasonal vegetables, grown without synthetic pesticides.", "Seasonal selection;Certified organic;Plastic-free packing", "vegetables,organic,seasonal"),
  G("Organic", "fruitbasket", "Organic Fruit Basket, Mixed", "Fresh Basket", 22, 36, "A generous basket of organic fruit, ideal for gifting or for a week of snacks.", "Mixed seasonal fruit;Certified organic;Gift basket", "fruit basket,organic,gift"),

  // ---------------------------------------------------------------- Books & Stationery
  K("Fiction", "novel", "The Lantern Keepers: A Novel", "Paper Trail", 11, 17, "A sweeping novel about a small coastal town and the family that keeps its old lighthouse burning.", "Paperback, 384 pages;Book-club friendly;Includes reading guide", "novel,fiction,paperback"),
  K("Fiction", "poetry", "Honey & Ash: Poems", "Paper Trail", 9, 15, "A quiet, honest collection of poems about loss, love and learning to begin again.", "Paperback, 160 pages;Illustrated;Gift worthy", "poetry,poems,paperback"),
  K("Fiction", "stories", "Paper Moons: Short Stories", "Paper Trail", 10, 16, "Twelve short stories that are strange, tender and impossible to forget.", "Paperback, 256 pages;Twelve stories;Debut collection", "short stories,fiction,paperback"),
  K("Fiction", "openbook", "A Winter of Open Books", "Paper Trail", 12, 18, "A cosy story about a bookshop, a snowed-in week and the readers who find each other.", "Paperback, 320 pages;Cosy fiction;Great winter read", "cosy,bookshop,fiction"),
  K("Fiction", "library", "The Last Reading Room", "Paper Trail", 11, 17, "A mystery set in a grand old library where every shelf hides a secret.", "Hardcover, 352 pages;Mystery;Page-turner", "mystery,library,hardcover"),
  K("Fiction", "handbooks", "Letters from the Shelves", "Paper Trail", 10, 16, "An epistolary novel told through notes left in the pages of second-hand books.", "Paperback, 288 pages;Epistolary;Heartwarming", "epistolary,novel,paperback"),
  K("Non-Fiction", "business", "Startup Playbook: From Idea to Launch", "Paper Trail", 16, 26, "A practical, no-nonsense guide to testing an idea, finding customers and launching.", "Paperback, 304 pages;Worksheets included;Case studies", "startup,business,guide"),
  K("Non-Fiction", "selfhelp", "The Habit Compass", "Paper Trail", 14, 22, "A clear framework for building routines that stick, backed by research and real stories.", "Paperback, 240 pages;Actionable exercises;Research based", "habits,self-improvement,productivity"),
  K("Non-Fiction", "money", "Money, Simply Explained", "Paper Trail", 13, 21, "A friendly guide to budgeting, saving and investing for people who find finance intimidating.", "Paperback, 272 pages;Plain English;Worked examples", "personal finance,money,guide"),
  K("Non-Fiction", "learning", "The Curious Mind: Learning to Learn", "Paper Trail", 12, 20, "How to study smarter, remember more and keep your curiosity alive for life.", "Paperback, 224 pages;Study techniques;Short chapters", "learning,study,education"),
  K("Study Supplies", "pen", "Fountain Pen Starter Set", "Paper Trail", 19, 34, "A smooth-writing fountain pen with ink cartridges, a converter and a travel tin.", "Steel nib;Ink cartridges included;Converter included", "fountain pen,writing,starter"),
  K("Study Supplies", "notebook", "A5 Spiral Ruled Notebook, 3-Pack", "Paper Trail", 9, 16, "Three durable spiral notebooks with smooth, fountain-pen-friendly paper.", "A5 size;120 gsm paper;3 notebooks", "notebook,ruled,a5"),
  K("Study Supplies", "journal", "Premium Dotted Journal with Fountain Pen", "Paper Trail", 17, 29, "A dotted journal and fountain pen set for planning, sketching and journaling.", "Dotted pages;Lay-flat binding;Pen included", "journal,dotted,bullet journal"),
  K("Study Supplies", "organizer", "Highlighter & Gel Pen Study Pack", "Paper Trail", 8, 14, "Colourful highlighters and smooth gel pens for notes that are easy to revise from.", "Assorted colours;Quick-dry ink;Desk organiser tray", "highlighters,gel pens,study"),
  K("Study Supplies", "notebook", "Blank Sketch & Note Pad Bundle", "Paper Trail", 7, 12, "Three blank pads for sketching, brainstorming and everything in between.", "Three pads;Thick paper;Perforated pages", "sketch pad,blank,notes"),
  K("Office Supplies", "organizer", "Desk Organiser with Pen Cups", "Paper Trail", 14, 24, "A tidy desk organiser with pen cups and compartments for everything within reach.", "Multiple compartments;Sturdy build;Non-slip base", "desk organiser,office,storage"),
  K("Office Supplies", "blackpen", "Matte Black Gel Pens, 10 Pack", "Paper Trail", 9, 15, "Ten smooth, fast-drying matte black gel pens that never skip.", "0.5mm tip;Quick-dry ink;Pack of 10", "gel pens,black,office"),
  K("Office Supplies", "pen", "Executive Fountain Pen, Steel Nib", "Paper Trail", 29, 49, "A weighty, balanced fountain pen that signs documents and impresses colleagues.", "Stainless steel nib;Weighted barrel;Gift box", "fountain pen,executive,gift"),
  K("Office Supplies", "organizer", "Sticky Notes & Planner Set", "Paper Trail", 11, 19, "Sticky notes, flags and a weekly planner to keep your desk and your week in order.", "Assorted sticky notes;Weekly planner pad;Page flags", "sticky notes,planner,office"),
  K("Office Supplies", "notebook", "Classic Ruled Legal Pads, 6-Pack", "Paper Trail", 10, 17, "Six classic ruled pads with perforated pages for meetings, lists and ideas.", "50 sheets per pad;Perforated pages;Pack of 6", "legal pad,ruled,office"),

  // ---------------------------------------------------------------- Pet Supplies
  P("Dog", "dog", "Adventure Dog Harness, Adjustable", "Paws & Whiskers", 19, 34, "A padded, no-pull harness that keeps walks comfortable and controlled.", "Padded chest plate;Adjustable fit;Reflective trim", "dog harness,walking,no-pull"),
  P("Dog", "dogsweater", "Cosy Knit Dog Sweater", "Paws & Whiskers", 14, 26, "A warm knitted sweater that keeps small dogs snug on cold walks.", "Soft knit;Stretchy fit;Machine washable", "dog sweater,winter,small dog"),
  P("Dog", "doghoodie", "Hooded Dog Hoodie, Sunshine Yellow", "Paws & Whiskers", 16, 28, "A cheerful hoodie in sunshine yellow that is as comfy as it is cute.", "Cotton blend;Easy leash opening;Sizes XS-XL", "dog hoodie,clothing,yellow"),
  P("Dog", "dogbed", "Orthopedic Memory Foam Dog Bed", "Paws & Whiskers", 39, 79, "A supportive memory foam bed that cushions ageing joints and settles restless dogs.", "Memory foam;Removable cover;Non-slip base", "dog bed,orthopedic,memory foam"),
  P("Dog", "dogsrun", "Reflective Leash & Collar Set", "Paws & Whiskers", 14, 24, "A matching leash and collar with reflective stitching for safe evening walks.", "Reflective stitching;Padded handle;Adjustable collar", "leash,collar,reflective"),
  P("Dog", "petfood", "Premium Dry Dog Food, 5kg", "Paws & Whiskers", 24, 42, "A complete, balanced dry food with real chicken as the first ingredient.", "Real chicken first;No artificial colours;5kg bag", "dog food,dry food,chicken"),
  P("Dog", "treats", "Training Treats Variety Pack", "Paws & Whiskers", 8, 14, "Small, soft treats that dogs love, perfect for training and rewards.", "Bite-sized;Soft texture;Three flavours", "dog treats,training,rewards"),
  P("Cat", "cat", "Scratch-Proof Cat Tree, 5 Level", "Paws & Whiskers", 69, 119, "A tall, sturdy cat tree with scratching posts, perches and a cosy hideaway.", "Five levels;Sisal scratching posts;Stable base", "cat tree,scratching post,climbing"),
  P("Cat", "catwand", "Interactive Cat Teaser Wand Set", "Paws & Whiskers", 8, 14, "A set of feather and ribbon wands that turn playtime into a proper workout.", "Three wand attachments;Replaceable toys;Lightweight", "cat toy,teaser,interactive"),
  P("Cat", "catfood", "Grain-Free Cat Food, 2kg", "Paws & Whiskers", 19, 32, "A grain-free recipe with salmon that supports a healthy coat and digestion.", "Grain free;Real salmon;2kg bag", "cat food,grain free,salmon"),
  P("Cat", "litter", "Self-Cleaning Cat Litter Box", "Paws & Whiskers", 49, 89, "A smart litter box that scoops itself, so there is less to do and less odour.", "Automatic cleaning;Odour control;Quiet motor", "litter box,self-cleaning,cat"),
  P("Cat", "catbed", "Window Perch Cat Bed", "Paws & Whiskers", 22, 38, "A sunny perch that fixes to the window so your cat can watch the world go by.", "Strong suction mounts;Soft cover;Holds up to 15kg", "cat bed,window perch,cat"),
  P("Cat", "cattreats", "Salmon Cat Treats, 12 Pack", "Paws & Whiskers", 9, 15, "Crunchy salmon-filled treats that cats can't resist, in a resealable pouch.", "Real salmon;Crunchy outside, soft inside;Pack of 12", "cat treats,salmon,snack"),
  P("Grooming", "grooming", "Fluffy Coat Deshedding Brush", "Paws & Whiskers", 12, 20, "A gentle deshedding brush that removes loose undercoat and keeps fluffy dogs tidy.", "Self-cleaning button;Gentle pins;Ergonomic handle", "deshedding,brush,grooming"),
  P("Grooming", "shampoo", "Gentle Pet Shampoo, 500ml", "Paws & Whiskers", 10, 17, "A soap-free, soothing shampoo that leaves coats soft, clean and lightly scented.", "Oatmeal formula;Soap free;pH balanced for pets", "pet shampoo,oatmeal,bath"),
  P("Grooming", "groomkit", "Nail Clipper & Grooming Kit", "Paws & Whiskers", 13, 22, "A complete grooming kit with nail clippers, a file and a comb in a travel pouch.", "Stainless steel clippers;Nail file included;Travel pouch", "nail clipper,grooming kit,pets"),
  P("Pet Toys", "pettoy", "Rope Tug Chew Toy Set, 3 Pack", "Paws & Whiskers", 9, 16, "Three tough cotton rope toys for tug-of-war, chewing and teeth cleaning.", "Three ropes;Durable cotton;Helps clean teeth", "dog toys,rope,chew"),
  P("Pet Toys", "pettoys", "Squeaky Plush Pet Toys, 6 Pack", "Paws & Whiskers", 11, 19, "Six soft, squeaky plush toys in assorted designs, perfect for cuddling and fetching.", "Six toys;Squeakers inside;Machine washable", "plush,squeaky,dog toys"),
  P("Pet Toys", "catnip", "Catnip Mouse Toys, 8 Pack", "Paws & Whiskers", 8, 14, "Eight little catnip-stuffed mice that cats love to chase, bat and carry around.", "Eight toys;Real catnip;Lightweight", "catnip,cat toys,mice"),
  P("Pet Toys", "dogsrun", "Fetch Ball Launcher & 3 Balls", "Paws & Whiskers", 17, 29, "A hand-held launcher that throws balls far, so you do not have to touch the slobber.", "Includes 3 balls;Adjustable distance;Lightweight", "fetch,ball launcher,dog toy"),

  // ---------------------------------------------------------------- Gaming
  V("Consoles", "console", "NextGen Console, 825GB, White", "Pixel Forge", 399, 499, "A fast next-generation console with near-instant loading and stunning 4K visuals.", "825GB SSD;4K gaming up to 120fps;Controller included", "console,4k,next-gen"),
  V("Consoles", "console2", "Digital Edition Console Bundle", "Pixel Forge", 349, 449, "The all-digital version of our flagship console, bundled with a second controller.", "All-digital, no disc drive;Two controllers;4K output", "console,digital,bundle"),
  V("Consoles", "console3", "HomePlay Console, Classic Edition", "Pixel Forge", 199, 299, "A proven, great-value console with a huge library of games to play.", "500GB storage;Huge game library;Controller included", "console,classic,value"),
  V("Consoles", "xbox", "All-Digital Console S, 1TB", "Pixel Forge", 249, 349, "A compact all-digital console with 1TB of storage and a wireless controller.", "1TB storage;Compact design;Wireless controller", "console,digital,compact"),
  V("Consoles", "retro", "Retro Mini Console with 200 Games", "Pixel Forge", 49, 89, "A tiny retro console with 200 classic games built in. Just plug it into the TV.", "200 built-in games;HDMI output;Two controllers", "retro,mini console,classic"),
  V("Games", "footballgame", "Football Pro 25, Console Edition", "Pixel Forge", 39, 69, "The latest season of football with sharper graphics, smarter AI and updated squads.", "Updated squads;Online multiplayer;Career mode", "football,sports game,console"),
  V("Games", "battle", "Arena Strike: Battle Royale", "Pixel Forge", 29, 59, "Drop in, loot up and be the last squad standing in a fast-paced battle royale.", "100-player matches;Squads and solo;Season pass included", "battle royale,shooter,multiplayer"),
  V("Games", "arcade", "Arcade Legends Collection", "Pixel Forge", 24, 44, "A collection of arcade classics, rebuilt for modern consoles and local multiplayer.", "20 arcade classics;Local multiplayer;Leaderboards", "arcade,retro,collection"),
  V("Games", "retrogames", "Retro Platform Adventure Pack", "Pixel Forge", 19, 34, "A pack of pixel-art platformers that will challenge your reflexes and your patience.", "Five platformers;Pixel art;Co-op mode", "platformer,retro,adventure"),
  V("Controllers", "controller", "Aurora Wireless Pro Controller", "Pixel Forge", 49, 79, "A comfortable wireless controller with hair-trigger sensitivity and a vivid gradient finish.", "Wireless Bluetooth;40-hour battery;Textured grips", "controller,wireless,gamepad"),
  V("Controllers", "controllers", "Dual Controller Twin Pack", "Pixel Forge", 79, 129, "Two wireless controllers in one pack, so you are always ready for couch co-op.", "Pack of two;Wireless;Rechargeable", "controller,twin pack,co-op"),
  V("Controllers", "procontroller", "Pro Controller with Back Paddles", "Pixel Forge", 59, 99, "A competitive controller with remappable back paddles and adjustable trigger stops.", "Four back paddles;Adjustable triggers;Tournament ready", "pro controller,paddles,competitive"),
  V("Controllers", "darkcontroller", "Midnight Wireless Controller", "Pixel Forge", 39, 69, "A dark, low-profile wireless controller that feels great in long sessions.", "Low-latency wireless;Comfortable grip;Rechargeable", "controller,wireless,dark"),
  V("Controllers", "dock", "Charging Dock for 2 Controllers", "Pixel Forge", 19, 34, "A tidy charging dock that powers two controllers at once, with no cables to swap.", "Charges two controllers;LED indicators;Compact", "charging dock,controller,accessory"),
  V("Controllers", "whitecontroller", "Wireless Console Controller, White", "Pixel Forge", 44, 69, "A clean white wireless controller with a comfortable grip and responsive triggers.", "Textured grip;Responsive triggers;Bluetooth", "controller,white,wireless"),
  V("PC Gaming", "rgbkeyboard", "RGB Mechanical Gaming Keyboard", "Pixel Forge", 59, 109, "A fast mechanical keyboard with per-key RGB lighting and hot-swappable switches.", "Per-key RGB;Hot-swappable switches;Detachable USB-C cable", "keyboard,rgb,mechanical"),
  V("PC Gaming", "headset", "Esports Pro Gaming Headset", "Pixel Forge", 59, 99, "A comfortable headset with clear positional audio and a noise-cancelling mic.", "7.1 surround;Noise-cancelling mic;Memory-foam earcups", "headset,esports,surround"),
  V("PC Gaming", "setup", "Gaming Desk Setup Bundle", "Pixel Forge", 249, 449, "A full desk bundle: a spacious gaming desk, monitor arm and cable management.", "Large desk surface;Cable management;Monitor arm included", "gaming desk,setup,bundle"),
  V("PC Gaming", "pcaccessories", "Gaming Accessory Kit: Mouse, Pad & Headset Stand", "Pixel Forge", 44, 79, "A compact kit with a gaming mouse, desk mat and headset stand to complete your setup.", "Precision gaming mouse;Large desk mat;Headset stand", "accessories,mouse,desk mat"),
  V("PC Gaming", "monitor", "34-inch Ultrawide Gaming Monitor", "Pixel Forge", 349, 549, "A curved ultrawide display with a 144Hz refresh rate for deeply immersive gaming.", "34-inch curved;144Hz refresh;1ms response", "monitor,ultrawide,144hz"),
];
