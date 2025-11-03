// Sample transcript data for visual regression testing
export interface TranscriptEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  characterName?: string;
  text: string;
  timestamp: Date;
  duration?: number;
  confidence?: number;
  isHighlighted?: boolean;
  isEdited?: boolean;
  hasCorrection?: boolean;
  originalText?: string;
  metadata?: {
    diceRolls?: Array<{
      type: string;
      result: number;
      modifier?: number;
      total: number;
    }>;
    actions?: string[];
    locations?: string[];
  };
}

export const sampleTranscriptEntries: TranscriptEntry[] = [
  {
    id: 'transcript-1',
    speakerId: 'speaker-1',
    speakerName: 'Gandalf',
    characterName: 'Gandalf',
    text: 'You shall not pass! This is the bridge of Khazad-dûm, and none shall pass without my leave.',
    timestamp: new Date('2024-01-15T18:45:12Z'),
    duration: 4500,
    confidence: 0.98,
    isHighlighted: true,
    metadata: {
      actions: ['Cast spell', 'Block path'],
      locations: ['Bridge of Khazad-dûm'],
    },
  },
  {
    id: 'transcript-2',
    speakerId: 'speaker-2',
    speakerName: 'Aragorn',
    characterName: 'Aragorn',
    text: "I am Arathorn's son, Isildur's heir, Elendil's heir. By my sword, I swear to you that I will not let you pass.",
    timestamp: new Date('2024-01-15T18:46:30Z'),
    duration: 3800,
    confidence: 0.95,
    isHighlighted: false,
    metadata: {
      actions: ['Challenge opponent'],
      locations: ['Battlefield'],
    },
  },
  {
    id: 'transcript-3',
    speakerId: 'speaker-3',
    speakerName: 'Legolas',
    characterName: 'Legolas',
    text: 'A red sun rises. Blood has been spilled this night.',
    timestamp: new Date('2024-01-15T19:15:45Z'),
    duration: 2200,
    confidence: 0.97,
    isHighlighted: false,
    metadata: {
      actions: ['Observe environment'],
      locations: ['Fangorn Forest'],
    },
  },
  {
    id: 'transcript-4',
    speakerId: 'speaker-4',
    speakerName: 'Gimli',
    characterName: 'Gimli',
    text: 'Nobody tosses a Dwarf! We are not some faceless people. We are of the line of Durin!',
    timestamp: new Date('2024-01-15T19:20:15Z'),
    duration: 3500,
    confidence: 0.92,
    isHighlighted: false,
    metadata: {
      actions: ['Defend honor'],
      locations: ['Mines of Moria'],
    },
  },
  {
    id: 'transcript-5',
    speakerId: 'speaker-5',
    speakerName: 'Frodo',
    characterName: 'Frodo',
    text: 'I will take the ring, though I do not know the way.',
    timestamp: new Date('2024-01-15T19:25:30Z'),
    duration: 2800,
    confidence: 0.89,
    isHighlighted: true,
    metadata: {
      actions: ['Accept quest'],
      locations: ['Rivendell'],
    },
  },
  {
    id: 'transcript-6',
    speakerId: 'speaker-6',
    speakerName: 'Boromir',
    characterName: 'Boromir',
    text: "You need to give me the ring. You don't understand! I can protect you from him.",
    timestamp: new Date('2024-01-15T19:30:22Z'),
    duration: 4200,
    confidence: 0.94,
    isHighlighted: false,
    hasCorrection: true,
    originalText:
      "You need to give me the ring. You don't understand! I cannot protect you from him.",
    metadata: {
      actions: ['Attempt negotiation'],
      locations: ['Amon Hen'],
    },
  },
];

// Transcript scenarios for different visual states
export const transcriptScenarios = {
  default: sampleTranscriptEntries,
  longSession: [
    ...sampleTranscriptEntries,
    {
      id: 'transcript-7',
      speakerId: 'speaker-1',
      speakerName: 'Gandalf',
      characterName: 'Gandalf',
      text: 'The Wheel of Time turns, and Ages come and pass, leaving memories that become legend.',
      timestamp: new Date('2024-01-15T20:00:00Z'),
      duration: 5200,
      confidence: 0.96,
      isHighlighted: false,
    },
    {
      id: 'transcript-8',
      speakerId: 'speaker-2',
      speakerName: 'Aragorn',
      characterName: 'Aragorn',
      text: 'For Frodo.',
      timestamp: new Date('2024-01-15T20:15:30Z'),
      duration: 1200,
      confidence: 0.91,
      isHighlighted: true,
    },
    {
      id: 'transcript-9',
      speakerId: 'speaker-3',
      speakerName: 'Legolas',
      characterName: 'Legolas',
      text: 'They are taking the Hobbits to Isengard!',
      timestamp: new Date('2024-01-15T20:30:45Z'),
      duration: 3100,
      confidence: 0.97,
      isHighlighted: false,
    },
  ],
  emptySession: [],
  singleEntry: sampleTranscriptEntries.slice(0, 1),
  highlightedEntries: sampleTranscriptEntries.filter(
    entry => entry.isHighlighted
  ),
  editedEntries: sampleTranscriptEntries.filter(entry => entry.hasCorrection),
  diceRolls: [
    {
      id: 'transcript-dice-1',
      speakerId: 'speaker-2',
      speakerName: 'Aragorn',
      characterName: 'Aragorn',
      text: 'I attack the orc with my sword! Let me roll for attack.',
      timestamp: new Date('2024-01-15T18:50:12Z'),
      duration: 3200,
      confidence: 0.93,
      metadata: {
        diceRolls: [
          {
            type: 'Attack Roll',
            result: 15,
            modifier: 5,
            total: 20,
          },
        ],
        actions: ['Attack'],
        locations: ['Battlefield'],
      },
    },
    {
      id: 'transcript-dice-2',
      speakerId: 'speaker-4',
      speakerName: 'Gimli',
      characterName: 'Gimli',
      text: "I'll roll to see if I can lift this boulder! Strength check.",
      timestamp: new Date('2024-01-15T19:10:30Z'),
      duration: 4100,
      confidence: 0.88,
      metadata: {
        diceRolls: [
          {
            type: 'Strength Check',
            result: 18,
            modifier: 3,
            total: 21,
          },
        ],
        actions: ['Athletics check'],
        locations: ['Dungeon'],
      },
    },
  ],
};

// Transcript states for responsive testing
export const transcriptTestVariations = {
  minimalEntry: {
    id: 'test-entry',
    speakerId: 'speaker-test',
    speakerName: 'Test Speaker',
    text: 'Test transcript entry.',
    timestamp: new Date(),
  },
  maximalEntry: {
    id: 'maximal-entry',
    speakerId: 'speaker-max',
    speakerName: 'Complex Speaker with Very Long Name That Might Affect Layout',
    characterName: 'Long Character Name That Might Wrap or Cause Layout Issues',
    text: 'This is a very long transcript entry that contains multiple sentences, complex D&D terminology like "polymorph", "dispel magic", "fireball", "counterspell", and various other fantasy elements that might affect visual rendering and text wrapping in different viewport sizes. It also includes detailed descriptions of actions, locations, and character interactions that could impact the visual layout of the transcript display component.',
    timestamp: new Date('2024-01-15T20:00:00Z'),
    duration: 15000,
    confidence: 0.87,
    isHighlighted: true,
    isEdited: true,
    hasCorrection: true,
    originalText: 'Original text before correction.',
    metadata: {
      diceRolls: [
        {
          type: 'Attack Roll',
          result: 19,
          modifier: 5,
          total: 24,
        },
        {
          type: 'Damage Roll',
          result: 12,
          modifier: 3,
          total: 15,
        },
      ],
      actions: [
        'Attack',
        'Cast spell',
        'Move',
        'Hide',
        'Search',
        'Investigation',
      ],
      locations: [
        'Ancient Temple',
        'Forbidden Forest',
        'Mysterious Cave',
        'Dwarven City',
      ],
    },
  },
  emptyText: {
    id: 'empty-entry',
    speakerId: 'speaker-empty',
    speakerName: 'Empty Speaker',
    text: '',
    timestamp: new Date(),
  },
  veryLongWord: {
    id: 'longword-entry',
    speakerId: 'speaker-longword',
    speakerName: 'Long Word Speaker',
    text: 'Pneumonoultramicroscopicsilicovolcanoconiosis - a fictitious long word to test text wrapping',
    timestamp: new Date(),
  },
};
