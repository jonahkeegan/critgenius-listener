// Sample character data for visual regression testing
export interface Character {
  id: string;
  name: string;
  class: string;
  speaker: string;
  imageUrl?: string;
  level?: number;
  hitPoints?: number;
  maxHitPoints?: number;
  armorClass?: number;
  isAlive: boolean;
  statusEffects?: string[];
}

export const sampleCharacters: Character[] = [
  {
    id: '1',
    name: 'Gandalf',
    class: 'Wizard',
    speaker: 'speaker-1',
    imageUrl:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
    level: 20,
    hitPoints: 145,
    maxHitPoints: 160,
    armorClass: 16,
    isAlive: true,
    statusEffects: ['Mage Armor', 'Shield'],
  },
  {
    id: '2',
    name: 'Aragorn',
    class: 'Ranger',
    speaker: 'speaker-2',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    level: 15,
    hitPoints: 134,
    maxHitPoints: 134,
    armorClass: 18,
    isAlive: true,
    statusEffects: ['Tracking', 'Natural Explorer'],
  },
  {
    id: '3',
    name: 'Legolas',
    class: 'Ranger',
    speaker: 'speaker-3',
    imageUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    level: 16,
    hitPoints: 98,
    maxHitPoints: 112,
    armorClass: 15,
    isAlive: true,
    statusEffects: ['Evasion', 'Extra Attack'],
  },
  {
    id: '4',
    name: 'Gimli',
    class: 'Fighter',
    speaker: 'speaker-4',
    imageUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    level: 14,
    hitPoints: 156,
    maxHitPoints: 156,
    armorClass: 20,
    isAlive: true,
    statusEffects: ['Extra Attack', 'Second Wind'],
  },
  {
    id: '5',
    name: 'Frodo',
    class: 'Rogue',
    speaker: 'speaker-5',
    imageUrl:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    level: 8,
    hitPoints: 45,
    maxHitPoints: 52,
    armorClass: 16,
    isAlive: true,
    statusEffects: ['Stealth', 'Sneak Attack'],
  },
  {
    id: '6',
    name: 'Boromir',
    class: 'Fighter',
    speaker: 'speaker-6',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    level: 12,
    hitPoints: 98,
    maxHitPoints: 112,
    armorClass: 17,
    isAlive: false,
    statusEffects: ['Dead'],
  },
];

// Scenarios for different visual states
export const characterScenarios = {
  default: sampleCharacters,
  allAlive: sampleCharacters.filter(char => char.isAlive),
  allDead: sampleCharacters.filter(char => !char.isAlive),
  empty: [],
  singleCharacter: sampleCharacters.slice(0, 1),
  manyCharacters: [
    ...sampleCharacters,
    {
      id: '7',
      name: 'Samwise',
      class: 'Fighter',
      speaker: 'speaker-7',
      level: 10,
      hitPoints: 89,
      maxHitPoints: 89,
      armorClass: 16,
      isAlive: true,
      statusEffects: ['Loyalty'],
    },
    {
      id: '8',
      name: 'Gollum',
      class: 'Rogue',
      speaker: 'speaker-8',
      level: 3,
      hitPoints: 23,
      maxHitPoints: 23,
      armorClass: 13,
      isAlive: true,
      statusEffects: ['Hidden', 'Stealthy'],
    },
  ],
  injuredCharacters: [
    {
      ...sampleCharacters[0],
      hitPoints: 23,
      statusEffects: ['Wounded', 'Stunned'],
    },
    {
      ...sampleCharacters[1],
      hitPoints: 45,
      statusEffects: ['Bleeding'],
    },
    {
      ...sampleCharacters[2],
      hitPoints: 12,
      statusEffects: ['Unconscious'],
    },
  ],
};

// Test data variations for responsive testing
export const characterTestVariations = {
  minimalData: [
    {
      id: '1',
      name: 'Test',
      class: 'Warrior',
      speaker: 'test-speaker',
      isAlive: true,
    },
  ],
  maximalData: sampleCharacters.map(char => ({
    ...char,
    statusEffects: ['Effect 1', 'Effect 2', 'Effect 3', 'Effect 4', 'Effect 5'],
    imageUrl:
      char.imageUrl ||
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
  })),
};
