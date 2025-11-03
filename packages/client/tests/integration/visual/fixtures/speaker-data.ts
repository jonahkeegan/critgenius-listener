// Sample speaker profile data for visual regression testing

import { PLACEHOLDER_IMAGE_DATA_URI } from './fixture-constants';
export interface SpeakerProfile {
  id: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  microphoneLevel?: number;
  joinTime: Date;
  lastActivity: Date;
  speakingState: 'speaking' | 'silent' | 'muted';
  sessionStats?: {
    totalSpeakingTime: number;
    wordsSpoken: number;
    interruptions: number;
  };
  preferences?: {
    volumeLevel: number;
    noiseReduction: boolean;
    autoMute: boolean;
  };
}

export const sampleSpeakerProfiles: SpeakerProfile[] = [
  {
    id: 'speaker-1',
    name: 'Gandalf',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: true,
    microphoneLevel: 75,
    joinTime: new Date('2024-01-15T18:30:00Z'),
    lastActivity: new Date('2024-01-15T19:45:00Z'),
    speakingState: 'speaking',
    sessionStats: {
      totalSpeakingTime: 2340, // seconds
      wordsSpoken: 3421,
      interruptions: 2,
    },
    preferences: {
      volumeLevel: 85,
      noiseReduction: true,
      autoMute: false,
    },
  },
  {
    id: 'speaker-2',
    name: 'Aragorn',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: true,
    microphoneLevel: 82,
    joinTime: new Date('2024-01-15T18:30:00Z'),
    lastActivity: new Date('2024-01-15T19:44:00Z'),
    speakingState: 'silent',
    sessionStats: {
      totalSpeakingTime: 1987,
      wordsSpoken: 2876,
      interruptions: 1,
    },
    preferences: {
      volumeLevel: 90,
      noiseReduction: true,
      autoMute: true,
    },
  },
  {
    id: 'speaker-3',
    name: 'Legolas',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: true,
    microphoneLevel: 68,
    joinTime: new Date('2024-01-15T18:31:00Z'),
    lastActivity: new Date('2024-01-15T19:43:00Z'),
    speakingState: 'muted',
    sessionStats: {
      totalSpeakingTime: 1567,
      wordsSpoken: 2134,
      interruptions: 0,
    },
    preferences: {
      volumeLevel: 80,
      noiseReduction: false,
      autoMute: true,
    },
  },
  {
    id: 'speaker-4',
    name: 'Gimli',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: false,
    microphoneLevel: 0,
    joinTime: new Date('2024-01-15T18:30:00Z'),
    lastActivity: new Date('2024-01-15T19:30:00Z'),
    speakingState: 'muted',
    sessionStats: {
      totalSpeakingTime: 3421,
      wordsSpoken: 4987,
      interruptions: 5,
    },
    preferences: {
      volumeLevel: 95,
      noiseReduction: false,
      autoMute: false,
    },
  },
  {
    id: 'speaker-5',
    name: 'Frodo',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: true,
    microphoneLevel: 45,
    joinTime: new Date('2024-01-15T18:32:00Z'),
    lastActivity: new Date('2024-01-15T19:42:00Z'),
    speakingState: 'speaking',
    sessionStats: {
      totalSpeakingTime: 876,
      wordsSpoken: 1234,
      interruptions: 0,
    },
    preferences: {
      volumeLevel: 70,
      noiseReduction: true,
      autoMute: false,
    },
  },
  {
    id: 'speaker-6',
    name: 'Boromir',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: false,
    microphoneLevel: 0,
    joinTime: new Date('2024-01-15T18:30:00Z'),
    lastActivity: new Date('2024-01-15T19:15:00Z'),
    speakingState: 'muted',
    sessionStats: {
      totalSpeakingTime: 1654,
      wordsSpoken: 2456,
      interruptions: 3,
    },
    preferences: {
      volumeLevel: 88,
      noiseReduction: true,
      autoMute: true,
    },
  },
];

// Test scenarios for different visual states
export const speakerScenarios = {
  default: sampleSpeakerProfiles,
  allActive: sampleSpeakerProfiles.filter(speaker => speaker.isActive),
  allInactive: sampleSpeakerProfiles.filter(speaker => !speaker.isActive),
  empty: [],
  singleActiveSpeaker: sampleSpeakerProfiles
    .filter(speaker => speaker.isActive)
    .slice(0, 1),
  manySpeakers: [
    ...sampleSpeakerProfiles,
    {
      id: 'speaker-7',
      name: 'Samwise',
      isActive: true,
      microphoneLevel: 55,
      joinTime: new Date('2024-01-15T18:35:00Z'),
      lastActivity: new Date('2024-01-15T19:41:00Z'),
      speakingState: 'silent',
      sessionStats: {
        totalSpeakingTime: 654,
        wordsSpoken: 987,
        interruptions: 0,
      },
      preferences: {
        volumeLevel: 75,
        noiseReduction: true,
        autoMute: false,
      },
    },
    {
      id: 'speaker-8',
      name: 'Gollum',
      isActive: false,
      microphoneLevel: 0,
      joinTime: new Date('2024-01-15T19:00:00Z'),
      lastActivity: new Date('2024-01-15T19:10:00Z'),
      speakingState: 'muted',
      sessionStats: {
        totalSpeakingTime: 123,
        wordsSpoken: 87,
        interruptions: 1,
      },
      preferences: {
        volumeLevel: 60,
        noiseReduction: false,
        autoMute: true,
      },
    },
  ],
  mixedSpeakingStates: [
    {
      ...sampleSpeakerProfiles[0],
      speakingState: 'speaking',
    },
    {
      ...sampleSpeakerProfiles[1],
      speakingState: 'silent',
    },
    {
      ...sampleSpeakerProfiles[2],
      speakingState: 'muted',
    },
    {
      ...sampleSpeakerProfiles[3],
      speakingState: 'speaking',
    },
  ],
};

// Responsive testing variations
export const speakerTestVariations = {
  minimalProfile: {
    id: 'speaker-test',
    name: 'Test Speaker',
    isActive: true,
    joinTime: new Date(),
    lastActivity: new Date(),
    speakingState: 'silent' as const,
  },
  maximalProfile: {
    id: 'speaker-max',
    name: 'Complex Speaker Profile with Long Name',
    avatar: PLACEHOLDER_IMAGE_DATA_URI,
    isActive: true,
    microphoneLevel: 100,
    joinTime: new Date('2024-01-15T18:00:00Z'),
    lastActivity: new Date('2024-01-15T20:00:00Z'),
    speakingState: 'speaking' as const,
    sessionStats: {
      totalSpeakingTime: 7200, // 2 hours
      wordsSpoken: 12345,
      interruptions: 15,
    },
    preferences: {
      volumeLevel: 100,
      noiseReduction: true,
      autoMute: false,
    },
  },
};
