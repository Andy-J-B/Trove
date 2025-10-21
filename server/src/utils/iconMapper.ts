/**
 * Icon Mapping Utility
 * Maps category names to Feather icon names based on keyword detection
 */

const ICON_MAP: Record<string, string> = {
  // Technology & Electronics
  tech: 'smartphone',
  technology: 'smartphone',
  phone: 'smartphone',
  computer: 'monitor',
  laptop: 'monitor',
  gaming: 'monitor',
  
  // Reading & Education
  book: 'book',
  books: 'book',
  reading: 'book',
  education: 'book',
  
  // Fashion & Shopping
  fashion: 'shopping-bag',
  clothes: 'shopping-bag',
  clothing: 'shopping-bag',
  apparel: 'shopping-bag',
  
  // Food & Dining
  food: 'coffee',
  restaurant: 'coffee',
  dining: 'coffee',
  cafe: 'coffee',
  
  // Travel & Transportation
  travel: 'map',
  trip: 'map',
  vacation: 'map',
  car: 'truck',
  vehicle: 'truck',
  auto: 'truck',
  
  // Entertainment
  music: 'music',
  audio: 'music',
  movie: 'film',
  film: 'film',
  video: 'film',
  
  // Health & Fitness
  fitness: 'activity',
  workout: 'activity',
  exercise: 'activity',
  health: 'heart',
  
  // Home & Living
  home: 'home',
  house: 'home',
  furniture: 'home',
  
  // Work & Productivity
  work: 'briefcase',
  office: 'briefcase',
  business: 'briefcase',
  
  // Hobbies & Interests
  art: 'image',
  photo: 'camera',
  photography: 'camera',
  gift: 'gift',
  
  // Miscellaneous
  tool: 'tool',
  tools: 'tool',
  garden: 'sun',
};

/**
 * Determines the appropriate Feather icon name for a category based on keyword matching
 * @param categoryName - The name of the category to match
 * @returns The Feather icon name, or "folder" as default
 */
export function getCategoryIcon(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();
  
  // Check each keyword in the icon map
  for (const [keyword, iconName] of Object.entries(ICON_MAP)) {
    if (normalized.includes(keyword)) {
      return iconName;
    }
  }
  
  // Return default icon when no match found
  return 'folder';
}
