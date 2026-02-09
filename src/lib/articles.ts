/**
 * Categorized well-known Wikipedia articles for route generation.
 * Used by both training (/api/generate-route) and ranked (/api/random-route).
 */
export const ARTICLES_BY_CATEGORY: Record<string, string[]> = {
  Countries: [
    "United States", "France", "Japan", "Brazil", "India", "Germany", "Canada",
    "Australia", "China", "Italy", "Mexico", "United Kingdom", "Russia", "Egypt",
    "South Korea", "Argentina", "Nigeria", "Thailand", "Vietnam", "Peru",
    "Spain", "Turkey", "Indonesia", "South Africa", "Sweden", "Poland", "Greece",
  ],
  Cities: [
    "New York City", "London", "Paris", "Tokyo", "Sydney", "Berlin", "Rome",
    "Los Angeles", "Chicago", "Toronto", "Madrid", "Mumbai", "Cairo", "Bangkok",
    "Dubai", "Istanbul", "Singapore", "Hong Kong", "Seoul", "Moscow",
    "Barcelona", "Amsterdam", "Rio de Janeiro", "Las Vegas",
  ],
  "Historical Figures": [
    "Adolf Hitler", "Abraham Lincoln", "Julius Caesar", "Mahatma Gandhi",
    "Alexander the Great", "Cleopatra", "Napoleon Bonaparte",
    "Martin Luther King Jr.", "Winston Churchill", "Genghis Khan",
    "Queen Victoria", "George Washington", "Nelson Mandela",
    "Galileo Galilei", "Marco Polo", "Joan of Arc", "Queen Elizabeth II",
  ],
  "Scientists & Inventors": [
    "Albert Einstein", "Isaac Newton", "Marie Curie", "Nikola Tesla",
    "Alan Turing", "Charles Darwin", "Stephen Hawking", "Thomas Edison",
    "Leonardo da Vinci", "Aristotle", "Archimedes",
    "Louis Pasteur", "Wright brothers",
  ],
  "Modern Celebrities": [
    "Logan Paul", "MrBeast", "Taylor Swift", "Lionel Messi",
    "Cristiano Ronaldo", "Elon Musk", "Kim Kardashian",
    "Kanye West", "Drake (musician)", "Beyoncé", "Rihanna",
    "Dwayne Johnson", "LeBron James", "Ariana Grande",
    "Neymar", "PewDiePie", "Justin Bieber", "Michael Jordan",
    "Oprah Winfrey", "BTS",
  ],
  Sports: [
    "FIFA World Cup", "National Basketball Association", "Formula One",
    "Super Bowl", "UEFA Champions League", "Tour de France",
    "Olympic Games", "Association football", "Tennis", "Boxing",
    "Golf", "Cricket World Cup",
  ],
  Entertainment: [
    "Marvel Cinematic Universe", "Star Wars", "Harry Potter", "Minecraft",
    "Fortnite", "Grand Theft Auto", "The Walt Disney Company", "Netflix",
    "Pokémon", "Game of Thrones", "Spider-Man", "Batman",
    "Super Mario", "YouTube", "TikTok", "Instagram",
    "The Lord of the Rings", "James Bond",
  ],
  "Tech & Companies": [
    "Apple Inc.", "Google", "Amazon (company)", "Microsoft",
    "Meta Platforms", "Tesla, Inc.", "Bitcoin", "Artificial intelligence",
    "iPhone", "SpaceX", "NASA", "Samsung",
  ],
  Science: [
    "DNA", "Black hole", "Theory of relativity", "Evolution",
    "Quantum mechanics", "Solar System", "Periodic table", "Atom",
    "Gravity", "Climate change", "Dinosaur", "Photosynthesis",
  ],
  Landmarks: [
    "Eiffel Tower", "Statue of Liberty", "Colosseum", "Great Wall of China",
    "Machu Picchu", "Taj Mahal", "Mount Everest", "Grand Canyon",
    "Niagara Falls", "Stonehenge", "Great Barrier Reef", "Amazon River",
  ],
  "Food & Drink": [
    "Pizza", "Coffee", "Chocolate", "Sushi", "Beer", "Wine",
    "Coca-Cola", "McDonald's", "Ice cream", "Bread",
  ],
  "Religion & Philosophy": [
    "Christianity", "Islam", "Buddhism", "Hinduism", "Judaism",
    "Bible", "Jesus", "Muhammad", "Gautama Buddha",
  ],
  "Events & Concepts": [
    "World War II", "World War I", "Cold War", "Industrial Revolution",
    "French Revolution", "Renaissance", "Internet",
    "Moon landing", "Titanic", "Democracy", "Communism",
  ],
};

/** Flat list of all well-known articles (for easy/hard modes) */
export const ALL_POPULAR = Object.values(ARTICLES_BY_CATEGORY).flat();

/** Pick a random well-known article */
export function getPopularArticle(): string {
  return ALL_POPULAR[Math.floor(Math.random() * ALL_POPULAR.length)];
}

/** Pick two well-known articles from different categories (for medium mode) */
export function getCategoricallyUnrelatedPair(): { start: string; target: string } {
  const categories = Object.keys(ARTICLES_BY_CATEGORY);
  const catA = categories[Math.floor(Math.random() * categories.length)];
  let catB = catA;
  while (catB === catA) {
    catB = categories[Math.floor(Math.random() * categories.length)];
  }
  const listA = ARTICLES_BY_CATEGORY[catA];
  const listB = ARTICLES_BY_CATEGORY[catB];
  return {
    start: listA[Math.floor(Math.random() * listA.length)],
    target: listB[Math.floor(Math.random() * listB.length)],
  };
}
