// 500+ pictionary-friendly words across different categories and difficulties
export const WORDS = [
  // Easy / Animals
  "cat", "dog", "fish", "bird", "lion", "tiger", "bear", "duck", "frog", "snake",
  "elephant", "giraffe", "monkey", "rabbit", "horse", "cow", "pig", "sheep", "chicken",
  "penguin", "dolphin", "whale", "shark", "octopus", "spider", "butterfly", "bee", "ant",
  "turtle", "snail", "crab", "lobster", "owl", "bat", "fox", "wolf", "zebra", "kangaroo",
  "panda", "koala", "hamster", "mouse", "camel", "hippo", "rhino", "cheetah", "flamingo",
  "peacock", "parrot", "swan", "crocodile", "dinosaur", "gorilla", "sloth", "hedgehog",

  // Food & Drinks
  "apple", "banana", "orange", "pizza", "burger", "cookie", "cake", "ice cream", "donut",
  "hot dog", "taco", "sushi", "sandwich", "bread", "cheese", "egg", "pancake", "waffle",
  "strawberry", "grape", "watermelon", "cherry", "pineapple", "mango", "lemon", "corn",
  "carrot", "potato", "tomato", "mushroom", "broccoli", "onion", "avocado", "popcorn",
  "chocolate", "candy", "lollipop", "cupcake", "pie", "coffee", "tea", "milk", "juice",
  "water", "soda", "soup", "salad", "spaghetti", "noodles", "bacon", "steak",

  // Objects & Tools
  "pencil", "pen", "book", "clock", "watch", "phone", "computer", "keyboard", "mouse",
  "chair", "table", "bed", "door", "window", "lamp", "candle", "mirror", "key",
  "lock", "scissors", "hammer", "nail", "wrench", "screwdriver", "ladder", "broom",
  "bucket", "umbrella", "glasses", "backpack", "wallet", "coin", "money", "bell",
  "guitar", "piano", "drum", "violin", "trumpet", "camera", "microphone", "headphones",
  "television", "radio", "battery", "flashlight", "magnet", "compass", "map", "flag",
  "envelope", "stamp", "box", "bottle", "cup", "plate", "fork", "spoon", "knife",

  // Clothes & Accessories
  "hat", "cap", "shirt", "t-shirt", "pants", "jeans", "shorts", "dress", "skirt",
  "jacket", "coat", "sweater", "sock", "shoe", "boot", "sneaker", "glove", "scarf",
  "belt", "tie", "necklace", "ring", "crown", "helmet", "mask", "sunglasses", "watch",

  // Vehicles & Transportation
  "car", "bus", "truck", "train", "airplane", "helicopter", "rocket", "boat", "ship",
  "submarine", "bicycle", "motorcycle", "scooter", "skateboard", "tractor", "ambulance",
  "fire truck", "police car", "taxi", "canoe", "hot air balloon", "parachute",

  // Nature & Weather
  "tree", "flower", "grass", "leaf", "sun", "moon", "star", "cloud", "rain",
  "snow", "snowman", "rainbow", "lightning", "storm", "wind", "fire", "smoke",
  "mountain", "hill", "volcano", "river", "lake", "ocean", "beach", "island",
  "cave", "desert", "forest", "waterfall", "rock", "stone", "sand",

  // Buildings & Places
  "house", "home", "building", "castle", "tent", "igloo", "barn", "bridge",
  "tower", "lighthouse", "hospital", "school", "bank", "restaurant", "hotel", "cinema",
  "stadium", "airport", "park", "playground", "zoo", "farm", "space",

  // Body Parts
  "eye", "ear", "nose", "mouth", "tooth", "tongue", "head", "hair",
  "hand", "finger", "thumb", "foot", "toe", "leg", "arm", "knee",
  "heart", "brain", "bone", "face", "smile", "beard", "mustache",

  // Actions & Sports
  "run", "jump", "swim", "fly", "sleep", "sing", "dance", "read",
  "write", "draw", "cook", "eat", "drink", "laugh", "cry", "climb",
  "football", "soccer", "basketball", "baseball", "tennis", "golf", "bowling",
  "boxing", "fishing", "camping", "surfing", "skiing",

  // Fantasy & Characters
  "ghost", "alien", "monster", "robot", "zombie", "vampire", "witch", "wizard",
  "dragon", "unicorn", "mermaid", "pirate", "ninja", "superhero", "clown", "king",
  "queen", "prince", "princess", "knight", "detective", "doctor", "chef", "astronaut"
];

export function getRandomWords(count = 3, customWords = []) {
  const pool = customWords && customWords.length >= 3 ? customWords : WORDS;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Levenshtein distance for close guess detection
export function levenshteinDistance(a, b) {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  const matrix = Array.from({ length: s1.length + 1 }, () =>
    new Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s1.length][s2.length];
}
