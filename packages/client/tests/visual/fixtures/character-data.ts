// Sample character data for visual regression testing

import { PLACEHOLDER_IMAGE_DATA_URI } from './fixture-constants';

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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
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
    imageUrl: PLACEHOLDER_IMAGE_DATA_URI,
    level: 12,
    hitPoints: 98,
    maxHitPoints: 112,
    armorClass: 17,
    isAlive: false,
    statusEffects: ['Dead'],
  },
];

// Scenarios for different visual states
const extendedCharacters: Character[] = [
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
];

const injuredCharacters: Character[] = [
  {
    ...sampleCharacters[0],
    hitPoints: 23,
    statusEffects: ['Wounded', 'Stunned'],
  } as Character,
  {
    ...sampleCharacters[1],
    hitPoints: 45,
    statusEffects: ['Bleeding'],
  } as Character,
  {
    ...sampleCharacters[2],
    hitPoints: 12,
    statusEffects: ['Unconscious'],
  } as Character,
];

export const characterScenarios = {
  default: sampleCharacters,
  allAlive: sampleCharacters.filter(char => char.isAlive),
  allDead: sampleCharacters.filter(char => !char.isAlive),
  empty: [] as Character[],
  singleCharacter: sampleCharacters.slice(0, 1),
  manyCharacters: extendedCharacters,
  injuredCharacters,
} satisfies Record<string, Character[]>;

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
    imageUrl: char.imageUrl || PLACEHOLDER_IMAGE_DATA_URI,
  })),
};
